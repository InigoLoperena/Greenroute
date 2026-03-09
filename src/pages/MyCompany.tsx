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
import { Send, Building2, Save } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const MyCompany = () => {
  const { user, loading: authLoading } = useAuth();
  const { company, members, isAdmin, loading: companyLoading, inviteMember, refetch } = useCompany();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && !companyLoading && !company) navigate("/dashboard");
  }, [authLoading, companyLoading, company, user, navigate]);

  useEffect(() => {
    if (company) setCompanyName(company.name);
  }, [company]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMember(inviteEmail);
      toast.success(`${t("invitationSent")} ${inviteEmail}`);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !companyName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("companies")
      .update({ name: companyName.trim() })
      .eq("id", company.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("companyNameUpdated"));
      refetch();
    }
    setSavingName(false);
  };

  if (authLoading || companyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold">{t("myCompany")}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Company name */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("companyNameSetting")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="flex gap-2">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={savingName}>
                  <Save className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Team members */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("teamMembers")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{m.profiles?.full_name || m.profiles?.email || t("noName")}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                </div>
                <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                  {m.role === "admin" ? t("admin") : t("member")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invite member */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("inviteMember")}</CardTitle>
              <CardDescription>{t("sendEmailInvite")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("autoJoinNote")}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyCompany;
