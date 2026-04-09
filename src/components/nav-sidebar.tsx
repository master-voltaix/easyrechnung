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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firmenprofil", label: "Firmenprofil", icon: Building2 },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/produkte", label: "Produkte", icon: Package },
  { href: "/rechnungen", label: "Rechnungen", icon: FileText },
  { href: "/ausgaben", label: "Ausgaben", icon: Receipt },
];

export function NavSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-primary text-white shadow-lg shadow-primary/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
        <span className="text-lg font-bold text-foreground">EasyRechnung</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-muted-foreground hover:bg-secondary/50"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b border-border">
            <span className="text-lg font-bold text-foreground">EasyRechnung</span>
          </div>
          <div className="px-3 pt-4 pb-2">
            <Link href="/rechnungen/neu" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Neue Rechnung
              </Button>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavLinks />
          </nav>
          <div className="px-3 py-4 border-t border-border">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card">
        <div className="px-6 py-6 border-b border-border">
          <span className="text-xl font-bold text-foreground">EasyRechnung</span>
        </div>
        <div className="px-3 pt-4 pb-2">
          <Link href="/rechnungen/neu">
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </button>
        </div>
      </div>
    </>
  );
}
