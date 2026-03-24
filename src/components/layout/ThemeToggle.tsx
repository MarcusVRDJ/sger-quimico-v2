"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ThemeToggle({
  className,
  showLabel = true,
  label,
}: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const dynamicLabel = mounted && theme === "dark" ? "Modo claro" : "Modo escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
        className
      )}
      aria-label="Alternar modo claro e escuro"
      aria-pressed={theme === "dark"}
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {showLabel && <span>{label ?? dynamicLabel}</span>}
    </button>
  );
}
