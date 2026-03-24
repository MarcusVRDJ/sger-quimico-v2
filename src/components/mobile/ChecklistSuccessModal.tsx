"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ChecklistSuccessModalProps {
  open: boolean;
  title: string;
  description: string;
  seconds?: number;
  onFinish: () => void;
}

export function ChecklistSuccessModal({
  open,
  title,
  description,
  seconds = 5,
  onFinish,
}: ChecklistSuccessModalProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!open) return;

    setRemaining(seconds);
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(seconds - elapsedSeconds, 0);
      setRemaining(next);

      if (next === 0) {
        window.clearInterval(interval);
        onFinish();
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [open, onFinish, seconds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-green-100 p-2">
            <CheckCircle2 className="h-6 w-6 text-green-700" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-200"
              style={{ width: `${(remaining / seconds) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Redirecionando em {remaining}s
          </p>
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  );
}
