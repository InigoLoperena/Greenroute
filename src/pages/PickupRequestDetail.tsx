import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, Package, Check, DollarSign, Loader2, Image as ImageIcon, CreditCard } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import BidChat from "@/components/BidChat";

interface PickupRequest {
  id: string;
  user_id: string;
  description: string;
  num_items: string;
  address: string;
  preferred_date: string | null;
  preferred_time: string | null;
  photos: string[];
  status: string;
  created_at: string;
}

interface Bid {
  id: string;
  pickup_request_id: string;
  bidder_id: string;
  bid_type: string;
  amount: number;
  notes: string;
  status: string;
  created_at: string;
  bidder_profile?: { full_name: string | null; email: string | null };
}

const PickupRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, tObj, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState<PickupRequest | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const [bidType, setBidType] = useState<"charge_for_removal" | "pay_for_removal">("charge_for_removal");
  const [bidAmount, setBidAmount] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [payingBid, setPayingBid] = useState<string | null>(null);

  const isOwner = user?.id === request?.user_id;
  const timeLabels = tObj("timeLabels") as Record<string, string>;

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") toast.success(t("paymentSuccess"));
    if (payment === "cancelled") toast.info(t("paymentCancelled"));
  }, [searchParams, t]);

  const fetchData = async () => {
    if (!id) return;
    // Fetch request and bids in parallel
    const [reqResult, bidsResult] = await Promise.all([
      supabase.from("pickup_requests").select("*").eq("id", id).single(),
      supabase.from("bids").select("*").eq("pickup_request_id", id).order("created_at", { ascending: false }),
    ]);

    if (reqResult.data) {
      setRequest(reqResult.data as any);
      // Fetch owner profile (needs user_id from request)
      const { data: ownerData } = await supabase.from("profiles").select("full_name, email").eq("user_id", (reqResult.data as any).user_id).maybeSingle();
      if (ownerData) setOwnerProfile(ownerData);
    }

    if (bidsResult.data) {
      const bidderIds = [...new Set((bidsResult.data as any[]).map((b: any) => b.bidder_id))];
      const { data: profiles } = bidderIds.length > 0
        ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", bidderIds)
        : { data: [] };
      const enriched = (bidsResult.data as any[]).map((b: any) => ({
        ...b,
        bidder_profile: profiles?.find((p) => p.user_id === b.bidder_id) || null,
      }));
      setBids(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`bids_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `pickup_request_id=eq.${id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth?mode=register");
      return;
    }
    if (!id) return;
    setSubmittingBid(true);
    try {
      const { error } = await supabase.from("bids").insert({
        pickup_request_id: id,
        bidder_id: user.id,
        bid_type: bidType,
        amount: parseFloat(bidAmount),
        notes: bidNotes,
      } as any);
      if (error) throw error;
      toast.success(t("bidSent"));
      setBidAmount("");
      setBidNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingBid(false);
    }
  };

  const initiatePayment = async (bid: Bid) => {
    setPayingBid(bid.id);
    try {
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
        body: { bid_id: bid.id, pickup_request_id: id, amount: bid.amount, bid_type: bid.bid_type },
      });
      if (checkoutError) { toast.error(checkoutError.message); return; }
      if (checkoutData?.url) window.location.href = checkoutData.url;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPayingBid(null);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    setAcceptingBid(bidId);
    try {
      const { error: bidError } = await supabase.from("bids").update({ status: "accepted" } as any).eq("id", bidId);
      if (bidError) throw bidError;

      await supabase.from("bids").update({ status: "rejected" } as any).eq("pickup_request_id", id!).neq("id", bidId);
      await supabase.from("pickup_requests").update({ status: "accepted" } as any).eq("id", id!);

      const bid = bids.find((b) => b.id === bidId);
      if (bid) {
        if (bid.bid_type === "charge_for_removal") {
          toast.success(t("bidAcceptedRedirecting"));
          await initiatePayment(bid);
          return;
        } else {
          toast.success(t("bidAcceptedNotify"));
        }
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAcceptingBid(null);
    }
  };

  const shouldShowPayButton = (bid: Bid) => {
    if (bid.status !== "accepted") return false;
    if (bid.bid_type === "charge_for_removal" && isOwner) return true;
    if (bid.bid_type === "pay_for_removal" && user?.id === bid.bidder_id) return true;
    return false;
  };

  const getPayerLabel = (bid: Bid) => {
    if (bid.bid_type === "charge_for_removal") return t("payRemovalService");
    return t("payForTheItems");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("requestNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-lg font-bold">{t("pickupRequestTitle")}</h1>
              <Badge variant={request.status === "open" ? "default" : "secondary"}>
                {request.status === "open" ? t("open") : request.status === "accepted" ? t("accepted") : request.status}
              </Badge>
            </div>
          </div>
          <NotificationBell />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {request.photos && request.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {request.photos.map((url, i) => (
              <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-40 w-40 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{request.num_items} {t("items")}</span>
            </div>
            <p className="text-sm">{request.description}</p>
            {request.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {request.address}
              </div>
            )}
            {request.preferred_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(request.preferred_date).toLocaleDateString(language === "es" ? "es-ES" : "en-US")}
                {request.preferred_time ? ` · ${timeLabels[request.preferred_time] || request.preferred_time}` : ""}
              </div>
            )}
          </CardContent>
        </Card>

        {request.status === "accepted" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-primary">{t("platformFee")}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold">{t("bids")} ({bids.length})</h2>

          {bids.map((bid) => (
            <Card key={bid.id} className={bid.status === "accepted" ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {bid.bidder_profile?.full_name || bid.bidder_profile?.email || t("user")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bid.created_at).toLocaleString(language === "es" ? "es-ES" : "en-US")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${bid.bid_type === "pay_for_removal" ? "text-primary" : "text-destructive"}`}>
                      {bid.bid_type === "pay_for_removal" ? "+" : "-"}€{bid.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bid.bid_type === "pay_for_removal" ? t("paysForItems") : t("removalCost")}
                    </p>
                  </div>
                </div>
                {bid.notes && <p className="text-sm text-muted-foreground">{bid.notes}</p>}

                {bid.status === "accepted" && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 mr-1" /> {t("accepted")}
                  </Badge>
                )}
                {bid.status === "rejected" && <Badge variant="secondary">{t("rejected")}</Badge>}

                {isOwner && bid.status === "pending" && request.status === "open" && (
                  <Button size="sm" className="w-full mt-2" onClick={() => handleAcceptBid(bid.id)} disabled={acceptingBid !== null}>
                    {acceptingBid === bid.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    {t("acceptBid")}
                  </Button>
                )}

                {shouldShowPayButton(bid) && (
                  <Button size="sm" className="w-full mt-2" variant="default" onClick={() => initiatePayment(bid)} disabled={payingBid !== null}>
                    {payingBid === bid.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
                    {getPayerLabel(bid)}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat for accepted bid — visible to both owner and bidder */}
        {(() => {
          const acceptedBid = bids.find((b) => b.status === "accepted");
          if (!acceptedBid || !user) return null;
          const isBidder = user.id === acceptedBid.bidder_id;
          const isReqOwner = user.id === request.user_id;
          if (!isBidder && !isReqOwner) return null;
          const otherName = isBidder
            ? ownerProfile?.full_name || ownerProfile?.email || t("user")
            : acceptedBid.bidder_profile?.full_name || acceptedBid.bidder_profile?.email || t("user");
          return <BidChat bidId={acceptedBid.id} otherUserName={otherName} />;
        })()}

        {!isOwner && request.status === "open" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("placeBid")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("offerType")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={bidType === "charge_for_removal" ? "default" : "outline"} className="w-full" onClick={() => setBidType("charge_for_removal")}>
                      {t("chargeForRemoval")}
                    </Button>
                    <Button type="button" variant={bidType === "pay_for_removal" ? "default" : "outline"} className="w-full" onClick={() => setBidType("pay_for_removal")}>
                      {t("payForItems")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("amount")}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" min="0" step="0.01" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="0.00" className="pl-9" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("additionalNotes")}</Label>
                  <Textarea value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} placeholder={t("notesPlaceholder")} rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={submittingBid}>
                  {submittingBid ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {t("submitBid")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PickupRequestDetail;
