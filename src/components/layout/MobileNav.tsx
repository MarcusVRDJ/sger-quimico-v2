"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, RefreshCw, Send, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mobile", label: "Início", icon: Home },
  { href: "/mobile/recebimento", label: "Recebimento", icon: RefreshCw },
  { href: "/mobile/expedicao", label: "Expedição", icon: Send },
  { href: "/mobile/limpeza", label: "Limpeza", icon: Droplets },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex safe-area-pb">
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
              active ? "text-blue-600" : "text-gray-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
