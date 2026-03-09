import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Crosshair, Check, Navigation } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import LocationPicker from "@/components/LocationPicker";
import MapPreview from "@/components/MapPreview";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { company, loading: companyLoading, createCompany } = useCompany();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [pendingReports, setPendingReports] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLng, setProfileLng] = useState<number | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [lastReport, setLastReport] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [showPing, setShowPing] = useState(true);

  useEffect(() => {
    if (showPing) {
      const timer = setTimeout(() => setShowPing(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [showPing]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("latitude, longitude")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileLat((data as any)?.latitude ?? null);
        setProfileLng((data as any)?.longitude ?? null);
        setProfileLoading(false);
      });
  }, [user]);

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

  // Location prompt if not set
  if (!profileLat && showLocationPrompt) {
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

  // Company creation if no company yet
  if (!company) {
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

  // Company dashboard
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
      <AppHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
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
              {!shareLoading && showPing && (
                  <span className="absolute inset-0 rounded-full bg-primary opacity-20 animate-[ping_0.8s_ease-out_3]" />
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

        {/* Map preview */}
        <MapPreview companyId={company.id} pendingReports={pendingReports} />
      </main>
    </div>
  );
};

export default Dashboard;
