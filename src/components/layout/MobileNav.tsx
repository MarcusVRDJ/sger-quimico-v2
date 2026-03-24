"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, RefreshCw, Send, Droplets, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/mobile", label: "Início", icon: Home },
  { href: "/mobile/recebimento", label: "Recebimento", icon: RefreshCw },
  { href: "/mobile/expedicao", label: "Expedição", icon: Send },
  { href: "/mobile/limpeza", label: "Limpeza", icon: Droplets },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/mobile" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors min-h-[56px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}

      <ThemeToggle
        className="flex-1 rounded-none border-0 bg-transparent px-0 py-3 text-xs font-medium text-muted-foreground hover:bg-muted min-h-[56px]"
        showLabel
        label="Tema"
      />

      <button
        type="button"
        onClick={() => void logout()}
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors min-h-[56px] text-muted-foreground"
      >
        <LogOut className="h-5 w-5" />
        Sair
      </button>
    </nav>
  );
}
