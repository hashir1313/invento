"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  FlaskConical,
  LogOut,
  BarChart3,
  Clock,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/sales", label: "Sales & Orders", icon: ShoppingCart },
    { href: "/raw-materials", label: "Raw Materials", icon: Boxes },
    { href: "/batch-production-v2", label: "Production", icon: FlaskConical },
    { href: "/maceration", label: "Maceration", icon: Clock },
    { href: "/finances", label: "Finances", icon: BarChart3 },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-hairline">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-on-primary" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-[-0.4px] text-ink">
                Invento
              </span>
              <span className="eyebrow text-[10px] leading-[14px] mt-0.5">
                Perfume Inventory
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-elevated border border-hairline text-ink font-medium shadow-whisper"
                        : "text-body hover:text-ink hover:bg-hairline-soft border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        isActive ? "text-ink" : "text-mute"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm ml-1.5"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </nav>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar (Bottom Bar for easy smartphone use) */}
      <nav className="md:hidden flex justify-around items-center bg-elevated/90 backdrop-blur-md border-t border-hairline py-1.5 fixed bottom-0 left-0 right-0 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-2 text-[11px] leading-[14px] rounded-md transition-colors",
                isActive ? "text-ink font-medium" : "text-mute hover:text-body"
              )}
            >
              <Icon
                className={cn("w-4 h-4 mb-1", isActive ? "text-ink" : "text-mute")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center py-1 px-2 text-[11px] leading-[14px] text-mute hover:text-error transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 mb-1" />
          <span>Logout</span>
        </button>
      </nav>
    </header>
  );
}
