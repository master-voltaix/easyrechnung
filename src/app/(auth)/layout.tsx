"use client";

import { useLanguage } from "@/components/language-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand identity */}
      <div className="hidden lg:flex lg:w-[420px] lg:flex-col lg:justify-between bg-[#0A0A0A] px-10 py-12 shrink-0">
        {/* Brand */}
        <div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span
              className="text-white text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
            >
              Quick
            </span>
            <span
              className="text-[#52B876] text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
            >
              Bill
            </span>
          </div>
          <p
            className="text-[#444] text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace" }}
          >
            {t.auth.tagline}
          </p>
        </div>

        {/* Central statement */}
        <div className="space-y-6">
          <div className="w-12 h-[3px] bg-[#52B876]" />
          <h2
            className="text-white text-3xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
          >
            {t.auth.heroHeading}<br />
            <span className="text-[#52B876]">{t.auth.heroAccent}</span>
          </h2>
          <p className="text-[#555] text-sm leading-relaxed max-w-xs">
            {t.auth.heroDesc}
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {[t.auth.feature1, t.auth.feature2, t.auth.feature3, t.auth.feature4].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#52B876] shrink-0" />
              <span className="text-[#666] text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F5EF] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-baseline gap-1 justify-center mb-1">
              <span
                className="text-[#0A0A0A] text-2xl font-semibold"
                style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
              >
                Quick
              </span>
              <span
                className="text-[#52B876] text-2xl font-semibold"
                style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
              >
                Bill
              </span>
            </div>
            <p className="text-muted-foreground text-xs tracking-widest uppercase font-mono">
              {t.auth.tagline}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
