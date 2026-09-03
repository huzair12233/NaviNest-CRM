"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Menu, X, Bell, LogOut, ChevronDown } from "lucide-react";
import { NAV } from "./nav-config";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { GlobalSearch } from "./global-search";
import { logoutAction } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";

type ShellUser = { name: string; email: string; role: string; avatarColor: string };

export function Shell({
  user,
  notifCount,
  children,
}: {
  user: ShellUser;
  notifCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const canSee = (i: { managerOnly?: boolean; adminOnly?: boolean }) => {
    if (i.adminOnly) return user.role === "ADMIN";
    if (i.managerOnly) return user.role === "ADMIN" || user.role === "MANAGER";
    return true;
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
    (href.startsWith("/leads/") && pathname === href);

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto scroll-thin px-3 py-4">
      {NAV.map((section) => {
        const items = section.items.filter(canSee);
        if (!items.length) return null;
        return (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-800"
                        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-600" : "text-ink-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-ink-100 px-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">NaviNest</p>
            <p className="text-[11px] text-ink-400">Realtors CRM</p>
          </div>
        </div>
        {nav}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-pop animate-slide-in">
            <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4">
              <span className="flex items-center gap-2 font-semibold text-ink-900">
                <Building2 className="h-5 w-5 text-brand-700" /> NaviNest
              </span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-ink-500" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-ink-600" />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-ink-100"
            >
              <Avatar name={user.name} color={user.avatarColor} size={28} />
              <span className="hidden text-sm font-medium text-ink-800 sm:block">{user.name}</span>
              <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1.5 w-52 animate-fade-in rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-400">{user.email}</p>
                    <p className="mt-1 text-[11px] font-medium text-brand-700">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <hr className="my-1 border-ink-100" />
                  <form action={logoutAction}>
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-600 hover:bg-ink-100">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
