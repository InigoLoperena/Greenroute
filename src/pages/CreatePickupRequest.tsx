import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Camera, X, Loader2 } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

const CreatePickupRequest = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [numItems, setNumItems] = useState("1-5");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    const files = Array.from(e.target.files);

    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("pickup-photos").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("pickup-photos").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setPhotos((prev) => [...prev, ...urls]);
      toast.success(`${files.length} ${t("photosUploaded")}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth?mode=register"); return; }
    if (latitude === null || longitude === null) {
      toast.error(t("mustShareLocation"));
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase.from("pickup_requests").insert({
        user_id: user.id,
        description,
        num_items: numItems,
        address: "",
        latitude,
        longitude,
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        photos,
      } as any);
      if (error) throw error;
      toast.success(t("requestPublished"));
      navigate("/marketplace");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">{t("newPickupRequest")}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("itemDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("photos")}</Label>
                  <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/50 transition-colors hover:bg-muted">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-primary" />
                        <span className="text-sm text-muted-foreground">{t("addPhotos")}</span>
                      </>
                    )}
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>{t("numberOfItems")}</Label>
                  <Select value={numItems} onValueChange={setNumItems}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5</SelectItem>
                      <SelectItem value="6-10">6-10</SelectItem>
                      <SelectItem value="11-20">11-20</SelectItem>
                      <SelectItem value="20+">20+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("pickupLocation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("preferredDate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("date")}</Label>
                  <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("time")}</Label>
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger><SelectValue placeholder={t("time")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">{t("morning")}</SelectItem>
                      <SelectItem value="afternoon">{t("afternoon")}</SelectItem>
                      <SelectItem value="evening">{t("evening")}</SelectItem>
                      <SelectItem value="flexible">{t("flexible")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("publishRequest")}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreatePickupRequest;
