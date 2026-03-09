import { useEffect, useState, useMemo, Component, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Route, CheckCircle, Navigation, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Error boundary to catch leaflet cleanup errors
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* swallow leaflet cleanup errors */ }
  render() {
    if (this.state.hasError) return <div className="flex items-center justify-center h-full text-muted-foreground">Map error — please reload</div>;
    return this.props.children;
  }
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Monkey-patch Marker to prevent _leaflet_events crash on cleanup
const origOnRemove = (L.Marker.prototype as any).onRemove;
(L.Marker.prototype as any).onRemove = function (map: any) {
  try {
    return origOnRemove.call(this, map);
  } catch {
    // swallow cleanup errors when DOM is already gone
  }
};

const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const collectedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ReportItem {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  reported_by: string;
}

type FilterType = "all" | "24h" | "48h" | "collected" | "mine";

const FitBounds = ({ reports, userLocation }: { reports: ReportItem[]; userLocation: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !(map as any)._container) return;
    const points: [number, number][] = reports.map((r) => [r.latitude, r.longitude]);
    if (userLocation) points.push(userLocation);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    }
  }, [reports, userLocation, map]);
  return null;
};

const MapView = () => {
  const { user, loading: authLoading } = useAuth();
  const { company, isAdmin, loading: companyLoading } = useCompany();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !companyLoading && !company) {
      navigate("/dashboard");
    }
  }, [authLoading, companyLoading, company, navigate]);

  const fetchReports = async () => {
    if (!company) return;
    // Fetch all statuses so we can filter client-side
    const { data, error } = await supabase
      .from("location_reports")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error fetching reports:", error); return; }
    if (data) {
      setAllReports(data as unknown as ReportItem[]);
      // Fetch member names
      const userIds = [...new Set(data.map((r: any) => r.reported_by))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach((p: any) => { names[p.user_id] = p.full_name || p.email || "?"; });
          setMemberNames(names);
        }
      }
    }
  };

  const reports = useMemo(() => {
    const now = Date.now();
    return allReports.filter((r) => {
      switch (filter) {
        case "24h":
          return (r.status === "pending" || r.status === "in_route") && (now - new Date(r.created_at).getTime()) <= 24 * 60 * 60 * 1000;
        case "48h":
          return (r.status === "pending" || r.status === "in_route") && (now - new Date(r.created_at).getTime()) <= 48 * 60 * 60 * 1000;
        case "collected":
          return r.status === "collected";
        case "mine":
          return r.reported_by === user?.id;
        default: // "all"
          return r.status === "pending" || r.status === "in_route";
      }
    });
  }, [allReports, filter, user?.id]);

  useEffect(() => {
    if (!company) return;
    fetchReports();
    const channel = supabase
      .channel(`location_reports_${company.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_reports", filter: `company_id=eq.${company.id}` }, () => fetchReports())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [company]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Clear selection when filter changes
  useEffect(() => {
    setSelected(new Set());
    setRouteCoords([]);
    setRouteWaypoints([]);
  }, [filter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === reports.length) setSelected(new Set());
    else setSelected(new Set(reports.map((r) => r.id)));
  };

  const generateRoute = async () => {
    const selectedReports = reports.filter((r) => selected.has(r.id));
    if (selectedReports.length < 1) { toast.error(t("selectAtLeast1")); return; }

    setRouteLoading(true);
    try {
      const waypoints: [number, number][] = [];
      if (userLocation) waypoints.push(userLocation);
      selectedReports.forEach((r) => waypoints.push([r.latitude, r.longitude]));
      if (waypoints.length < 2) {
        if (userLocation) waypoints.push(userLocation);
        else { toast.error(t("need2Points")); setRouteLoading(false); return; }
      }

      const coords = waypoints.map((w) => `${w[1]},${w[0]}`).join(";");
      const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await resp.json();

      if (data.code === "Ok" && data.routes[0]) {
        const geometry = data.routes[0].geometry.coordinates;
        setRouteCoords(geometry.map((c: number[]) => [c[1], c[0]] as [number, number]));
        setRouteWaypoints(waypoints);
        const duration = Math.round(data.routes[0].duration / 60);
        const distance = (data.routes[0].distance / 1000).toFixed(1);
        toast.success(`${t("routeGenerated")}: ${distance} km, ~${duration} min`);
      } else {
        toast.error(t("couldNotCalculateRoute"));
      }
    } catch {
      toast.error(t("errorCalculatingRoute"));
    } finally {
      setRouteLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    if (routeWaypoints.length < 2) return;
    const origin = `${routeWaypoints[0][0]},${routeWaypoints[0][1]}`;
    const dest = `${routeWaypoints[routeWaypoints.length - 1][0]},${routeWaypoints[routeWaypoints.length - 1][1]}`;
    const midpoints = routeWaypoints.slice(1, -1);
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    if (midpoints.length > 0) {
      url += `&waypoints=${midpoints.map((w) => `${w[0]},${w[1]}`).join("%7C")}`;
    }
    window.open(url, "_blank");
  };

  const openInWaze = () => {
    if (routeWaypoints.length < 2) return;
    const dest = routeWaypoints[routeWaypoints.length - 1];
    window.open(`https://waze.com/ul?ll=${dest[0]},${dest[1]}&navigate=yes`, "_blank");
  };

  const markCollected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await supabase.from("location_reports").update({ status: "collected" as any }).in("id", ids);
    if (error) { toast.error(t("errorUpdating")); return; }
    await fetchReports();
    setSelected(new Set());
    setRouteCoords([]);
    setRouteWaypoints([]);
    toast.success(t("markedCollected"));
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("location_reports").delete().in("id", ids);
    if (error) { toast.error(t("errorDeleting")); console.error(error); return; }
    await fetchReports();
    setSelected(new Set());
    setRouteCoords([]);
    setRouteWaypoints([]);
    toast.success(t("pointsDeleted"));
  };

  // Can delete if: admin (can delete any) or all selected are user's own
  const canDelete = useMemo(() => {
    if (selected.size === 0) return false;
    if (isAdmin) return true;
    const selectedReports = allReports.filter((r) => selected.has(r.id));
    return selectedReports.every((r) => r.reported_by === user?.id);
  }, [selected, isAdmin, allReports, user?.id]);

  const defaultCenter: [number, number] = userLocation || (reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : [42.8125, -1.6458]);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "24h", label: t("filter24h") },
    { key: "48h", label: t("filter48h") },
    { key: "collected", label: t("filterCollected") },
    { key: "mine", label: t("filterMine") },
  ];

  return (
    <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>
      <header className="border-b bg-card px-3 py-2 z-[1000] shrink-0 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-display text-base font-bold">{t("pickupMap")}</h1>
            <Badge variant="secondary" className="text-xs">{reports.length}</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={selectAll}>
              {selected.size === reports.length && reports.length > 0 ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 shrink-0 rounded-full px-3"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 relative z-0 isolate">
        <MapErrorBoundary>
          <MapContainer key={company?.id || "map"} center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds reports={reports} userLocation={userLocation} />
            {userLocation && (
              <Marker position={userLocation} icon={greenIcon}>
                <Popup>{t("yourLocation")}</Popup>
              </Marker>
            )}
            {reports.map((r) => (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={r.status === "collected" ? collectedIcon : defaultIcon}
                eventHandlers={{ click: () => toggleSelect(r.id) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{selected.has(r.id) ? t("selectedMarker") : r.status === "collected" ? t("collected") : t("pendingPoint")}</p>
                    <p className="text-xs opacity-70">{new Date(r.created_at).toLocaleString()}</p>
                    <p className="text-xs mt-1">{t("sharedBy")}: {memberNames[r.reported_by] || "..."}</p>
                    <p className="text-xs font-mono mt-1">{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} pathOptions={{ color: "#1a6b3c", weight: 5, opacity: 0.8 }} />
            )}
          </MapContainer>
        </MapErrorBoundary>
      </div>

      <div className="shrink-0 bg-card border-t px-3 py-3 z-[1000] safe-area-bottom relative">
        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <div className="flex gap-2">
            <Button onClick={generateRoute} disabled={selected.size === 0 || routeLoading} className="flex-1 h-10 text-sm" size="sm">
              <Route className="h-4 w-4 mr-1.5" />
              {routeLoading ? t("calculating") : `${t("route")} (${selected.size})`}
            </Button>
            {selected.size > 0 && filter !== "collected" && (
              <Button variant="outline" onClick={markCollected} size="sm" className="h-10 text-sm">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {t("collected")}
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={deleteSelected} size="sm" className="h-10 text-sm">
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t("deleteSelected")}
              </Button>
            )}
          </div>
          {routeWaypoints.length >= 2 && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 h-10 text-sm" size="sm" onClick={openInGoogleMaps}>
                <Navigation className="h-4 w-4 mr-1.5" />
                {t("openGoogleMaps")}
              </Button>
              <Button variant="outline" size="sm" className="h-10 text-sm" onClick={openInWaze}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                {t("openWaze")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
