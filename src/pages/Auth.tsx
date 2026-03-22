import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Recycle, Truck, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type AccountType = "individual" | "company";

const Auth = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const isInvitation = searchParams.get("invitation") === "true";
  const invitationCompany = searchParams.get("company") || "";
  const inviteEmail = searchParams.get("invite_email") || "";
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(isInvitation ? "company" : "individual");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t("accountCreated"));
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center relative">
          <div className="absolute right-0 top-0">
            <LanguageSwitcher />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Recycle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("appName")}</h1>
          <p className="mt-2 text-muted-foreground">{t("smartWasteManagement")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">{isLogin ? t("signIn") : t("createAccount")}</CardTitle>
            <CardDescription>
              {isLogin ? t("accessYourPanel") : t("chooseAccountType")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {isInvitation ? (
                    <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 text-center space-y-2">
                      <Building2 className="h-8 w-8 text-primary mx-auto" />
                      <p className="text-sm font-medium">
                        {t("theCompany")} <span className="font-bold text-primary">{decodeURIComponent(invitationCompany)}</span> {t("invitationMessage")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>{t("accountType")}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAccountType("individual")}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            accountType === "individual"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <User className={cn("h-6 w-6", accountType === "individual" ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-sm font-medium", accountType === "individual" ? "text-primary" : "text-muted-foreground")}>
                            {t("individual")}
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            {t("individualDesc")}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType("company")}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            accountType === "company"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <Building2 className={cn("h-6 w-6", accountType === "company" ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-sm font-medium", accountType === "company" ? "text-primary" : "text-muted-foreground")}>
                            {t("company")}
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            {t("companyDesc")}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {isInvitation ? t("fullName") : accountType === "company" ? t("companyNameLabel") : t("fullName")}
                    </Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isInvitation ? t("namePlaceholder") : accountType === "company" ? t("companyNamePlaceholder") : t("namePlaceholder")}
                      required
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("loading") : isLogin ? t("enter") : t("createAccount")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? t("noAccount") : t("hasAccount")}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Truck className="h-4 w-4" />
          <span>{t("optimizeRoutes")}</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
