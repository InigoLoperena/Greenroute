import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, ArrowLeft, Crosshair } from "lucide-react";

const Report = () => {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lastReport, setLastReport] = useState<{ lat: number; lng: number } | null>(null);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !companyLoading && !company) {
      navigate("/dashboard");
    }
  }, [authLoading, companyLoading, company, navigate]);

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("browserNoGeo"));
      return;
    }
    if (!company || !user) {
      toast.error(t("mustBelongToCompany"));
      return;
    }

    setLoading(true);
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
          setReportCount((c) => c + 1);
          toast.success(t("locationShared"));
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error(t("couldNotGetLocation"));
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold">{t("reportLocationTitle")}</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{t("reportInstruction")}</p>
          {reportCount > 0 && (
            <p className="text-sm font-medium text-primary">
              {reportCount} {t("locationsShared")}
            </p>
          )}
        </div>

        <button
          onClick={shareLocation}
          disabled={loading}
          className="relative flex h-40 w-40 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="animate-spin h-10 w-10 border-4 border-primary-foreground border-t-transparent rounded-full" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Crosshair className="h-12 w-12" />
              <span className="font-display font-semibold text-sm">{t("shareBtn")}</span>
            </div>
          )}
          {!loading && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
          )}
        </button>

        {lastReport && (
          <Card className="w-full max-w-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Check className="h-5 w-5 text-success shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{t("lastLocationRegistered")}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {lastReport.lat.toFixed(6)}, {lastReport.lng.toFixed(6)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Report;
