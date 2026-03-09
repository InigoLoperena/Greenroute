import { forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageSwitcher = forwardRef<HTMLButtonElement>((_, ref) => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className="font-display font-bold text-xs px-2 h-8"
      onClick={() => setLanguage(language === "en" ? "es" : "en")}
    >
      {language === "en" ? "ES" : "EN"}
    </Button>
  );
});

LanguageSwitcher.displayName = "LanguageSwitcher";

export default LanguageSwitcher;
