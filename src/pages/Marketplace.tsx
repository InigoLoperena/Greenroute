import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MarketplaceFeed from "@/components/MarketplaceFeed";
import { toast } from "sonner";

const Marketplace = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("latitude, longitude")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserLat((data as any)?.latitude ?? null);
        setUserLng((data as any)?.longitude ?? null);
      });
  }, [user]);

  const handlePublish = () => {
    if (!user) {
      toast.info(t("loginToPublish"));
      navigate("/auth");
      return;
    }
    navigate("/marketplace/new");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? "/dashboard" : "/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-lg font-bold">{t("marketplace")}</h1>
              <p className="text-xs text-muted-foreground">{t("requestsAndBids")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <MarketplaceFeed userLat={userLat} userLng={userLng} />
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button size="lg" className="rounded-full shadow-lg px-6 gap-2" onClick={handlePublish}>
          <Plus className="h-5 w-5" />
          {t("postRequest")}
        </Button>
      </div>
    </div>
  );
};

export default Marketplace;
