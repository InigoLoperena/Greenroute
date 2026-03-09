import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

interface LocationReport {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

interface MapPreviewProps {
  companyId: string;
  pendingReports: number;
}

const MapPreview = ({ companyId, pendingReports }: MapPreviewProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<LocationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("location_reports")
        .select("id, latitude, longitude, status, created_at")
        .eq("company_id", companyId)
        .eq("status", "pending" as any)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setReports(data as any);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`map_preview_${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_reports", filter: `company_id=eq.${companyId}` }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const center: [number, number] =
    reports.length > 0
      ? [reports[0].latitude, reports[0].longitude]
      : [40.4168, -3.7038]; // Madrid default

  if (loading) {
    return <div className="rounded-2xl bg-card animate-pulse h-64" />;
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border bg-card cursor-pointer group"
      onClick={() => navigate("/map")}
    >
      <div className="h-80 sm:h-96 relative">
        <MapContainer
          center={center}
          zoom={reports.length > 0 ? 13 : 6}
          className="h-full w-full"
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {reports.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={6}
              pathOptions={{ color: "hsl(142, 71%, 45%)", fillColor: "hsl(142, 71%, 45%)", fillOpacity: 0.8, weight: 2 }}
            >
              <Tooltip>{t("pendingPoint")}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("viewMapRoutes")}</p>
              <p className="text-xs text-muted-foreground">
                {pendingReports} {t("pendingPoints")}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Route className="h-3 w-3 mr-1" />
            {t("route")}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default MapPreview;
