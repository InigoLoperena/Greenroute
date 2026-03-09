import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Recycle,
  UserCircle,
  Building2,
  Package,
  Crosshair,
  Check,
  Gavel,
  MapPin,
  Route,
  LogOut,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MarketplaceFeed from "@/components/MarketplaceFeed";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEMO_REPORTS = [
  { id: "d1", lat: 40.4168, lng: -3.7038 },
  { id: "d2", lat: 40.4205, lng: -3.7102 },
  { id: "d3", lat: 40.4132, lng: -3.6955 },
  { id: "d4", lat: 40.4251, lng: -3.6889 },
  { id: "d5", lat: 40.4089, lng: -3.7145 },
  { id: "d6", lat: 40.4310, lng: -3.7005 },
  { id: "d7", lat: 40.4185, lng: -3.6800 },
];

const DemoPreview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const goRegister = () => navigate("/auth?mode=register");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header — mirrors company dashboard */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">Demo Company</h1>
              <p className="text-xs text-muted-foreground">{t("managementPanel")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={goRegister}>
              <UserCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goRegister}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm font-medium text-primary">
        {t("demoNotice")}
      </div>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
        {/* Quick actions row */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <Button variant="outline" className="shrink-0 gap-2" onClick={goRegister}>
            <Package className="h-4 w-4" /> {t("myRequestsBtn")}
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" onClick={goRegister}>
            <Gavel className="h-4 w-4" /> {t("myBidsBtn")}
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" onClick={goRegister}>
            <Building2 className="h-4 w-4" /> {t("myCompany")}
          </Button>
        </div>

        {/* Share coordinates section */}
        <div className="space-y-4">
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground mb-4">{t("reportInstruction")}</p>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={goRegister}
                  className="relative flex h-36 w-36 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Crosshair className="h-12 w-12" />
                    <span className="font-display font-semibold text-sm">{t("shareBtn")}</span>
                  </div>
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
                </button>
                <p className="text-sm font-medium text-primary">
                  3 {t("locationsShared")}
                </p>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">
                    40.41680, -3.70380
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo map preview */}
          <div
            className="relative rounded-2xl overflow-hidden border bg-card cursor-pointer group"
            onClick={goRegister}
          >
            <div className="h-80 sm:h-96 relative">
              <MapContainer
                center={[40.4168, -3.7038]}
                zoom={13}
                className="h-full w-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {DEMO_REPORTS.map((r) => (
                  <CircleMarker
                    key={r.id}
                    center={[r.lat, r.lng]}
                    radius={6}
                    pathOptions={{
                      color: "hsl(142, 71%, 45%)",
                      fillColor: "hsl(142, 71%, 45%)",
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Tooltip>{t("pendingPoint")}</Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>

              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("viewMapRoutes")}</p>
                    <p className="text-xs text-muted-foreground">
                      7 {t("pendingPoints")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  <Route className="h-3 w-3 mr-1" />
                  {t("route")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace section */}
        <div>
          <h2 className="font-display text-xl font-bold mb-1">{t("marketplace")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("requestsAndBids")}</p>
          <MarketplaceFeed userLat={40.4168} userLng={-3.7038} />
        </div>
      </main>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={goRegister}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default DemoPreview;
