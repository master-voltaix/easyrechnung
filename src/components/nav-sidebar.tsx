"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  Receipt,
  LogOut,
  Menu,
  X,
  Plus,
  LayoutTemplate,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/settings-dialog";
import { useLanguage } from "@/components/language-provider";

export function NavSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/firmenprofil", label: t.nav.companyProfile, icon: Building2 },
    { href: "/kunden", label: t.nav.customers, icon: Users },
    { href: "/produkte", label: t.nav.products, icon: Package },
    { href: "/rechnungen", label: t.nav.invoices, icon: FileText },
    { href: "/vorlagen", label: "Vorlagen", icon: LayoutTemplate },
    { href: "/ausgaben", label: t.nav.expenses, icon: Receipt },
  ];

  const NavLinks = () => (
    <div className="space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150",
              isActive
                ? "text-white"
                : "text-[#888] hover:text-white hover:bg-white/5"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#52B876] rounded-r-sm" />
            )}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-[#52B876]" : "text-[#555]"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-r border-[#1C1C1C]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#1C1C1C]">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-white font-display text-3xl font-semibold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
          >
            Quick
          </span>
          <span
            className="text-[#52B876] font-display text-3xl font-semibold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
          >
            Bill
          </span>
        </div>
        <p className="text-[#444] text-[10px] tracking-widest uppercase mt-1 font-mono">
          {t.nav.subtitle}
        </p>
      </div>

      {/* New Invoice CTA */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/rechnungen/neu"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#52B876] hover:bg-[#3FA364] transition-colors duration-150"
          style={{ borderRadius: "2px" }}
        >
          <Plus className="h-4 w-4" />
          {t.nav.newInvoice}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="px-4 mb-2 text-[10px] font-mono font-medium tracking-widest text-[#333] uppercase">
          {t.nav.navigation}
        </p>
        <NavLinks />
      </nav>

      {/* Settings + Logout */}
      <div className="px-2 py-3 border-t border-[#1C1C1C] space-y-0.5">
        <SettingsDialog />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#555] hover:text-white hover:bg-white/5 w-full transition-colors duration-150"
          style={{ borderRadius: "2px" }}
        >
          <LogOut className="h-4 w-4" />
          {t.nav.logout}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A0A0A] border-b border-[#1C1C1C]">
        <div className="flex items-baseline gap-1">
          <span className="text-white font-display text-base font-semibold">Quick</span>
          <span className="text-[#52B876] font-display text-base font-semibold">Bill</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#666] hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
}
