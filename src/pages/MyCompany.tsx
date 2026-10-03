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
import { Send, Save, Trash2, UserMinus } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const MyCompany = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    company,
    members,
    isAdmin,
    loading: companyLoading,
    inviteMember,
    removeMember,
    deleteCompany,
    refetch,
  } = useCompany();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && !companyLoading && !company) navigate("/dashboard");
  }, [authLoading, companyLoading, company, user, navigate]);

  useEffect(() => {
    if (company) setCompanyName(company.name);
  }, [company]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await inviteMember(inviteEmail);
      toast.success(`${t("invitationSent")} ${inviteEmail}`);
      setInviteEmail("");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite member");
    }
  };

  const handleUpdateName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company || !companyName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ name: companyName.trim() })
        .eq("id", company.id);
      if (error) throw error;
      toast.success(t("companyNameUpdated"));
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update company");
    } finally {
      setSavingName(false);
    }
  };

  const handleRemoveMember = async (member: (typeof members)[number]) => {
    const confirmed = window.confirm(
      language === "es" ? "¿Eliminar este miembro de la empresa?" : "Remove this member from the company?",
    );
    if (!confirmed) return;
    setBusyMember(member.id);
    try {
      await removeMember(member);
      toast.success(language === "es" ? "Miembro eliminado" : "Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove member");
    } finally {
      setBusyMember(null);
    }
  };

  const handleDeleteCompany = async () => {
    const confirmed = window.confirm(
      language === "es"
        ? "¿Eliminar definitivamente la empresa? También se eliminarán sus datos asociados."
        : "Permanently delete this company? Associated company data will also be deleted.",
    );
    if (!confirmed) return;
    setDeletingCompany(true);
    try {
      await deleteCompany();
      toast.success(language === "es" ? "Empresa eliminada" : "Company deleted");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete company");
      setDeletingCompany(false);
    }
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
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{t("companyNameSetting")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="flex gap-2">
                <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required className="flex-1" />
                <Button type="submit" size="icon" disabled={savingName}>
                  <Save className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("teamMembers")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {member.profiles?.full_name || member.profiles?.email || t("noName")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                    {member.role === "admin" ? t("admin") : t("member")}
                  </Badge>
                  {isAdmin && member.user_id !== user?.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={busyMember === member.id}
                      onClick={() => handleRemoveMember(member)}
                      aria-label={language === "es" ? "Eliminar miembro" : "Remove member"}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="flex-1"
                />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">{t("autoJoinNote")}</p>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                {language === "es" ? "Eliminar empresa" : "Delete company"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Esta acción es permanente y eliminará los datos asociados a la empresa."
                  : "This is permanent and removes data associated with the company."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteCompany} disabled={deletingCompany}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingCompany
                  ? (language === "es" ? "Eliminando..." : "Deleting...")
                  : (language === "es" ? "Eliminar empresa" : "Delete company")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyCompany;
