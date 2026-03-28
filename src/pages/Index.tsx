import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Recycle, MapPin, Route, Truck, Mail, MessageCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import tutorialReport from "@/assets/tutorial-report.png";
import heroIllustration from "@/assets/hero-illustration.png";
import tutorialMap from "@/assets/tutorial-map.png";

import valorizationImg from "@/assets/valorization.png";


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const wmSteps = [
    { img: tutorialReport, title: t("tutorialWmStep1Title"), desc: t("tutorialWmStep1Desc") },
    { img: tutorialMap, title: t("tutorialWmStep2Title"), desc: t("tutorialWmStep2Desc") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
            <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("heroDescription")}
              </p>
              <div className="flex justify-center md:justify-start gap-3">
                <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}>
                  {t("startFree")}
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <img
                src={heroIllustration}
                alt="Greenroute circular waste management"
                className="w-full h-auto rounded-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-t bg-card">
          <div className="container mx-auto grid gap-8 px-4 py-16 sm:grid-cols-3">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
                <MapPin className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureReportTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureReportDesc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Route className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureRouteTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureRouteDesc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Truck className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureCollectTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureCollectDesc")}</p>
            </div>
          </div>
        </section>

        {/* Waste Managers Tutorial */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Truck className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                {t("tutorialWmTitle")}
              </span>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("tutorialWmTitle")}</h2>
              <p className="mt-4 text-muted-foreground text-lg">{t("tutorialWmSubtitle")}</p>
            </div>

            <div className="space-y-24">
              {wmSteps.map((step, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-10 md:flex-row ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
                >
                  <div className="w-full md:w-3/5">
                    <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
                      <img
                        src={step.img}
                        alt={step.title}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-2/5 text-center md:text-left space-y-4">
                    <h3 className="font-display text-2xl font-bold text-primary">{step.title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Valorization */}
        <section className="border-t bg-background">
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
              <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("valorizationTitle")}</h2>
                <p className="text-lg text-muted-foreground">{t("valorizationDesc")}</p>
                <div className="flex justify-center md:justify-start">
                  <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}>
                    {t("startFree")}
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
                  <img
                    src={valorizationImg}
                    alt="Circular economy market"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-t bg-card">
          <div className="container mx-auto grid gap-8 px-4 py-16 sm:grid-cols-3">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
                <MapPin className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureReportTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureReportDesc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Route className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureRouteTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureRouteDesc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Truck className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t("featureCollectTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("featureCollectDesc")}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Recycle className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold">{t("appName")}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("footerTagline")}
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">{t("footerProduct")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate(user ? "/report" : "/auth?mode=register")} className="text-muted-foreground hover:text-foreground transition-colors">{t("featureReportTitle")}</button></li>
                <li><button onClick={() => navigate(user ? "/map" : "/auth?mode=register")} className="text-muted-foreground hover:text-foreground transition-colors">{t("featureRouteTitle")}</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">{t("footerContact")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                   <a href="mailto:contact@greenroute.digital" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                     <Mail className="h-4 w-4" /> contact@greenroute.digital
                   </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Greenroute. {t("footerRights")}</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a
        href="https://api.whatsapp.com/send?phone=34667504944"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] transition-colors"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
};

export default Index;
