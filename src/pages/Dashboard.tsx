import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Plus, Recycle, UserCircle, Building2, Package, Crosshair, Check, Navigation, Gavel } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import LocationPicker from "@/components/LocationPicker";
import MarketplaceFeed from "@/components/MarketplaceFeed";
import MapPreview from "@/components/MapPreview";

type AccountType = "individual" | "company" | null;

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { company, loading: companyLoading, createCompany } = useCompany();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [pendingReports, setPendingReports] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLng, setProfileLng] = useState<number | null>(null);
  const [locationSet, setLocationSet] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [lastReport, setLastReport] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("account_type, latitude, longitude, stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAccountType((data?.account_type as AccountType) || null);
        setProfileLat((data as any)?.latitude ?? null);
        setProfileLng((data as any)?.longitude ?? null);
        setLocationSet((data as any)?.latitude != null);
        setStripeAccountId((data as any)?.stripe_account_id ?? null);
        setProfileLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (company && accountType === "individual") {
      setAccountType("company");
      if (user) {
        supabase
          .from("profiles")
          .update({ account_type: "company" } as any)
          .eq("user_id", user.id)
          .then(() => {});
      }
    }
  }, [company, accountType, user]);

  useEffect(() => {
    if (company) {
      supabase
        .from("location_reports")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("status", "pending" as any)
        .then(({ count }) => setPendingReports(count ?? 0));
    }
  }, [company]);

  const handleSelectAccountType = async (type: "individual" | "company") => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: type } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAccountType(type);
    if (!profileLat) setShowLocationPrompt(true);
    toast.success(`${type === "company" ? t("companyProfile") : t("personalProfile")} ${t("profileConfigured")}`);
  };

  const handleSaveLocation = async (lat: number, lng: number) => {
    if (!user) return;
    setProfileLat(lat);
    setProfileLng(lng);
    const { error } = await supabase
      .from("profiles")
      .update({ latitude: lat, longitude: lng } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLocationSet(true);
    toast.success(t("locationSaved"));
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCompany(companyName);
      toast.success(t("companyCreated"));
    } catch (err: any) {
      toast.error(err.message);
    }
  };



  if (authLoading || profileLoading || companyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Step 1: Choose account type
  if (!accountType || accountType === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center relative">
            <div className="absolute right-0 top-0">
              <LanguageSwitcher />
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Recycle className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t("welcomeTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("welcomeSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              onClick={() => handleSelectAccountType("individual")}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <UserCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{t("individualUser")}</h3>
                <p className="text-sm text-muted-foreground">{t("individualUserDesc")}</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              onClick={() => handleSelectAccountType("company")}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{t("companyUser")}</h3>
                <p className="text-sm text-muted-foreground">{t("companyUserDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Location prompt
  if (showLocationPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Navigation className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t("setupLocation")}</h1>
            <p className="mt-2 text-muted-foreground">{t("locationNeeded")}</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <LocationPicker
                latitude={profileLat}
                longitude={profileLng}
                onLocationChange={handleSaveLocation}
              />
            </CardContent>
          </Card>

          {profileLat !== null && (
            <Button className="w-full" size="lg" onClick={() => setShowLocationPrompt(false)}>
              {t("continue")}
            </Button>
          )}

          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowLocationPrompt(false)}
          >
            {t("skipForNow")}
          </button>
        </div>
      </div>
    );
  }

  // Individual user dashboard
  if (accountType === "individual") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Recycle className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-lg font-bold">{t("appName")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                <UserCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Quick actions */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            <Button variant="outline" className="shrink-0 gap-2" onClick={() => navigate("/my-requests")}>
              <Package className="h-4 w-4" /> {t("myRequestsBtn")}
            </Button>
            <Button variant="outline" className="shrink-0 gap-2" onClick={() => navigate("/my-bids")}>
              <Gavel className="h-4 w-4" /> {t("myBidsBtn")}
            </Button>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-1">{t("marketplace")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("viewAndBid")}</p>
          </div>

          <MarketplaceFeed userLat={profileLat} userLng={profileLng} />
        </main>

        {/* Floating action button */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => navigate("/marketplace/new")}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Company user: show company creation if no company yet
  if (accountType === "company" && !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-center font-display">{t("setupCompany")}</CardTitle>
            <CardDescription className="text-center">{t("enterCompanyName")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("companyNameInput")}
                required
              />
              <Button type="submit" className="w-full">{t("createCompany")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Company dashboard — Share button + inline report logic

  const shareLocation = () => {
    if (!navigator.geolocation) { toast.error(t("browserNoGeo")); return; }
    if (!company || !user) { toast.error(t("mustBelongToCompany")); return; }
    setShareLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { error } = await supabase.from("location_reports").insert({
            company_id: company.id,
            reported_by: user.id,
            latitude,
            longitude,
          });
          if (error) throw error;
          setLastReport({ lat: latitude, lng: longitude });
          setSessionCount((c) => c + 1);
          setPendingReports((c) => c + 1);
          toast.success(t("locationShared"));
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setShareLoading(false);
        }
      },
      () => { toast.error(t("couldNotGetLocation")); setShareLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">{company!.name}</h1>
              <p className="text-xs text-muted-foreground">{t("managementPanel")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                <UserCircle className="h-4 w-4" />
              </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
        {/* Quick actions row */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => navigate("/my-requests")}>
            <Package className="h-4 w-4" /> {t("myRequestsBtn")}
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => navigate("/my-bids")}>
            <Gavel className="h-4 w-4" /> {t("myBidsBtn")}
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => navigate("/my-company")}>
            <Building2 className="h-4 w-4" /> {t("myCompany")}
          </Button>
        </div>

        {/* === PRIMARY: Share coordinates + Map === */}
        <div className="space-y-4">
          {/* Share coordinates section */}
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground mb-4">{t("reportInstruction")}</p>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={shareLocation}
                  disabled={shareLoading}
                  className="relative flex h-36 w-36 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {shareLoading ? (
                    <div className="animate-spin h-10 w-10 border-4 border-primary-foreground border-t-transparent rounded-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Crosshair className="h-12 w-12" />
                      <span className="font-display font-semibold text-sm">{t("shareBtn")}</span>
                    </div>
                  )}
                  {!shareLoading && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
                  )}
                </button>
                {sessionCount > 0 && (
                  <p className="text-sm font-medium text-primary">
                    {sessionCount} {t("locationsShared")}
                  </p>
                )}
                {lastReport && (
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {lastReport.lat.toFixed(5)}, {lastReport.lng.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Map preview — bigger */}
          <MapPreview companyId={company!.id} pendingReports={pendingReports} />
        </div>

        {/* === SECONDARY: Marketplace === */}
        <div>
          <h2 className="font-display text-xl font-bold mb-1">{t("marketplace")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("requestsAndBids")}</p>
          <MarketplaceFeed userLat={profileLat} userLng={profileLng} />
        </div>

      </main>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate("/marketplace/new")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
