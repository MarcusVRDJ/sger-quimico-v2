"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Droplets,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/contentores",
    label: "Contentores",
    icon: Package,
  },
  {
    href: "/limpeza",
    label: "Requisições de Limpeza",
    icon: Droplets,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    adminOnly: true,
  },
];

interface SidebarProps {
  perfil: string;
}

export function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card text-foreground border-r border-border dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800">
      <div className="p-6 border-b border-border dark:border-zinc-800">
        <h1 className="text-lg font-bold">SGE Químico v2</h1>
        <p className="text-xs text-muted-foreground mt-1 dark:text-zinc-400">
          Gestão de Contentores IBC
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && perfil !== "ADMIN") return null;
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border dark:border-zinc-800">
        <ThemeToggle className="mb-2 w-full justify-start border-border bg-background text-foreground hover:bg-muted dark:border-zinc-700 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-800" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
