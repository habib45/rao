"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  BarChart3,
  Languages,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  ClipboardCheck,
  Image as ImageIcon,
  FileText,
  Map,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/app/admin/_lib/cn";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/review", label: "Review Queue", icon: ClipboardCheck },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/blog/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/translations", label: "Translations", icon: Languages },
  { href: "/admin/public-media", label: "Public Media", icon: ImageIcon },
  { href: "/admin/sitemap", label: "Sitemap", icon: Map },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminShellProps {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Show loading indicator when pathname changes
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    let initialDark = false;

    if (stored !== null) {
      initialDark = stored === "true";
    } else {
      initialDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setDarkMode(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("darkMode", next.toString());
  }

  async function handleSignOut() {
    await fetch("/admin/api/auth/signout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Package className="h-6 w-6 text-brand" />
          <span className="text-lg font-semibold">RaoFinds Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            // Exact match for /admin and /admin/products to avoid /admin/products/review
            // matching "/admin/products" as a prefix. /admin/blog is treated as a prefix
            // match so its sub-pages (new, [id], categories) keep the link active.
            const exactMatchRoutes = ["/admin", "/admin/products"];
            const active = exactMatchRoutes.includes(href)
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-muted hover:text-foreground lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 flex-1">
            {isNavigating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
            )}
          </div>

          <span className="hidden text-sm text-muted sm:block">{userEmail}</span>

          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
