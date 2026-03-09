import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Recycle, Home, LogOut, UserCircle, Building2 } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="border-b bg-card sticky top-0 z-30">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user ? "/dashboard" : "/")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Recycle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} title={t("myPanel")}>
                <Home className="h-4 w-4" />
              </Button>
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                <UserCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/my-company")}>
                <Building2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login")}>
                {t("login")}
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=register")}>
                {t("register")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
