"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, Loader2, X } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecoded: (rawValue: string) => void;
}

export function QrScannerModal({
  open,
  onOpenChange,
  onDecoded,
}: QrScannerModalProps) {
  const scannerId = useMemo(
    () => `qr-reader-${Math.random().toString(36).slice(2)}`,
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    let scanner: {
      stop: () => Promise<void>;
      clear: () => Promise<void>;
    } | null = null;

    async function startScanner() {
      setLoading(true);
      setError("");

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        const activeScanner = new Html5Qrcode(scannerId);
        scanner = activeScanner;

        await activeScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onDecoded(decodedText);
            onOpenChange(false);
          },
          undefined
        );
      } catch {
        if (mounted) {
          setError(
            "Não foi possível acessar a câmera. Verifique a permissão e tente novamente."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void startScanner();

    return () => {
      mounted = false;
      if (!scanner) return;

      void scanner
        .stop()
        .catch(() => undefined)
        .then(() => scanner?.clear().catch(() => undefined));
    };
  }, [open, onDecoded, onOpenChange, scannerId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card border border-border shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-base font-semibold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Ler QR do Contentor
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="rounded-xl overflow-hidden border border-border bg-black min-h-[260px]">
            <div id={scannerId} className="w-full h-[300px]" />
          </div>

          {loading && (
            <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando câmera...
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Formato esperado: numeroSerie,fabricante,capacidade,tara
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
