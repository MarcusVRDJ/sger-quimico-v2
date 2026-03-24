"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import { QrScannerModal } from "@/components/mobile/QrScannerModal";
import type { StatusContentor } from "@/drizzle/schema";
import { parseQrContentor } from "@/lib/qr-contentor";

const ETAPAS = [
  "Identificação",
  "Inspeção Externa",
  "Inspeção Interna",
  "Validades",
  "Revisão",
];

interface Respostas {
  numeroSerie: string;
  tipoContentor: "OFFSHORE" | "ONSHORE_REFIL" | "ONSHORE_BASE" | "";
  fabricante: string;
  capacidadeLitros: string;
  tara: string;
  avarias: boolean;
  lacreRoto: boolean;
  testesVencidos: boolean;
  produtoAnterior: boolean;
  residuos: boolean;
  observacoes: string;
  dataValidade: string;
  dataUltimaInspecao: string;
}

export default function RecebimentoPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [infoNumeroSerie, setInfoNumeroSerie] = useState("");
  const [erro, setErro] = useState("");
  const [respostas, setRespostas] = useState<Respostas>({
    numeroSerie: "",
    tipoContentor: "",
    fabricante: "",
    capacidadeLitros: "",
    tara: "",
    avarias: false,
    lacreRoto: false,
    testesVencidos: false,
    produtoAnterior: false,
    residuos: false,
    observacoes: "",
    dataValidade: "",
    dataUltimaInspecao: "",
  });

  function set<K extends keyof Respostas>(key: K, value: Respostas[K]) {
    setRespostas((prev) => ({ ...prev, [key]: value }));
  }

  function statusPreview(): StatusContentor {
    if (respostas.avarias || respostas.lacreRoto)
      return "REPROVADO_INTEGRIDADE";
    if (respostas.testesVencidos) return "REPROVADO_VENCIDO";
    if (respostas.produtoAnterior || respostas.residuos) return "APROVADO_SUJO";
    return "APROVADO";
  }

  async function enviar() {
    setEnviando(true);
    setErro("");
    try {
      const capacidadeLitros = respostas.capacidadeLitros
        ? Number(respostas.capacidadeLitros)
        : undefined;

      const res = await fetch("/api/checklists/recebimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...respostas,
          capacidadeLitros: Number.isFinite(capacidadeLitros)
            ? Math.trunc(capacidadeLitros as number)
            : undefined,
          fabricante: respostas.fabricante || undefined,
          tara: respostas.tara || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Erro ao enviar checklist");
        return;
      }
      router.push("/mobile?sucesso=recebimento");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function buscarNumeroSerie(numeroSerie: string) {
    if (!numeroSerie) return;

    try {
      const res = await fetch(
        `/api/contentores/busca?numeroSerie=${encodeURIComponent(numeroSerie)}`
      );

      if (res.ok) {
        const data = (await res.json()) as {
          contentor?: {
            tipoContentor: Respostas["tipoContentor"];
            fabricante: string | null;
            capacidadeLitros: number | null;
            tara: string | null;
          };
        };

        setInfoNumeroSerie("Contentor já cadastrado. Os dados foram carregados.");

        if (data.contentor) {
          setRespostas((prev) => ({
            ...prev,
            tipoContentor: prev.tipoContentor || data.contentor?.tipoContentor || "",
            fabricante: prev.fabricante || data.contentor?.fabricante || "",
            capacidadeLitros:
              prev.capacidadeLitros ||
              (data.contentor?.capacidadeLitros
                ? String(data.contentor.capacidadeLitros)
                : ""),
            tara: prev.tara || data.contentor?.tara || "",
          }));
        }
        return;
      }

      if (res.status === 404) {
        setInfoNumeroSerie(
          "Número de série não encontrado. O contentor será criado ao finalizar o checklist."
        );
        return;
      }

      setInfoNumeroSerie("");
    } catch {
      setInfoNumeroSerie("");
    }
  }

  function onQrLido(rawValue: string) {
    const parsed = parseQrContentor(rawValue);

    if (!parsed.ok || !parsed.data) {
      setErro(parsed.error ?? "QR inválido. Confira os dados e corrija manualmente.");
      return;
    }

    setErro("");
    setRespostas((prev) => ({
      ...prev,
      numeroSerie: parsed.data?.numeroSerie ?? prev.numeroSerie,
      fabricante: parsed.data?.fabricante ?? prev.fabricante,
      capacidadeLitros: parsed.data?.capacidadeLitros
        ? String(parsed.data.capacidadeLitros)
        : prev.capacidadeLitros,
      tara: parsed.data?.tara ?? prev.tara,
    }));

    void buscarNumeroSerie(parsed.data.numeroSerie);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com progresso */}
      <div className="bg-card border-b border-border shadow-sm px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-foreground mb-4">
          Checklist Recebimento
        </h1>
        {/* Barra de progresso */}
        <div className="flex gap-1 mb-3">
          {ETAPAS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= etapa ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Etapa {etapa + 1} de {ETAPAS.length}: <strong>{ETAPAS[etapa]}</strong>
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {erro && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        {/* Etapa 0: Identificação */}
        {etapa === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Número de Série *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={respostas.numeroSerie}
                  onChange={(e) => set("numeroSerie", e.target.value)}
                  onBlur={(e) => void buscarNumeroSerie(e.target.value.trim())}
                  placeholder="Ex: SN-2024-001"
                  className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setScannerAberto(true)}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium text-foreground bg-card"
                >
                  <QrCode className="h-4 w-4" />
                  QR
                </button>
              </div>
              {infoNumeroSerie && (
                <p className="text-xs text-muted-foreground mt-2">{infoNumeroSerie}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Tipo de Contentor *
              </label>
              <select
                value={respostas.tipoContentor}
                onChange={(e) =>
                  set(
                    "tipoContentor",
                    e.target.value as Respostas["tipoContentor"]
                  )
                }
                className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione...</option>
                <option value="OFFSHORE">Offshore</option>
                <option value="ONSHORE_REFIL">Onshore (Refil)</option>
                <option value="ONSHORE_BASE">Onshore (Base)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-border space-y-4">
              <p className="text-xs text-muted-foreground">
                Dados do QR (editáveis)
              </p>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Fabricante
                </label>
                <input
                  type="text"
                  value={respostas.fabricante}
                  onChange={(e) => set("fabricante", e.target.value)}
                  placeholder="Ex: Schutz"
                  className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Capacidade (L)
                </label>
                <input
                  type="number"
                  min={1}
                  value={respostas.capacidadeLitros}
                  onChange={(e) => set("capacidadeLitros", e.target.value)}
                  placeholder="Ex: 1000"
                  className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Tara (kg)
                </label>
                <input
                  type="text"
                  value={respostas.tara}
                  onChange={(e) => set("tara", e.target.value)}
                  placeholder="Ex: 250.00"
                  className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}

        {/* Etapa 1: Inspeção Externa */}
        {etapa === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifique o estado externo do contentor.
            </p>
            <CheckItem
              label="Há avarias físicas visíveis?"
              checked={respostas.avarias}
              onChange={(v) => set("avarias", v)}
            />
            <CheckItem
              label="Lacre roto ou ausente?"
              checked={respostas.lacreRoto}
              onChange={(v) => set("lacreRoto", v)}
            />
          </div>
        )}

        {/* Etapa 2: Inspeção Interna */}
        {etapa === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifique o estado interno do contentor.
            </p>
            <CheckItem
              label="Presença de produto anterior?"
              checked={respostas.produtoAnterior}
              onChange={(v) => set("produtoAnterior", v)}
            />
            <CheckItem
              label="Presença de resíduos?"
              checked={respostas.residuos}
              onChange={(v) => set("residuos", v)}
            />
          </div>
        )}

        {/* Etapa 3: Validades */}
        {etapa === 3 && (
          <div className="space-y-5">
            <CheckItem
              label="Testes técnicos vencidos?"
              checked={respostas.testesVencidos}
              onChange={(v) => set("testesVencidos", v)}
            />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Data de Validade do Contentor
              </label>
              <input
                type="date"
                value={respostas.dataValidade}
                onChange={(e) => set("dataValidade", e.target.value)}
                className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Data Última Inspeção
              </label>
              <input
                type="date"
                value={respostas.dataUltimaInspecao}
                onChange={(e) => set("dataUltimaInspecao", e.target.value)}
                className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Etapa 4: Revisão */}
        {etapa === 4 && (
          <div className="space-y-5">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Resumo</h3>
              <Row label="Nº Série" value={respostas.numeroSerie || "—"} />
              <Row label="Tipo" value={tipoLabel(respostas.tipoContentor)} />
              <Row label="Fabricante" value={respostas.fabricante || "—"} />
              <Row
                label="Capacidade"
                value={respostas.capacidadeLitros ? `${respostas.capacidadeLitros} L` : "—"}
              />
              <Row label="Tara" value={respostas.tara ? `${respostas.tara} kg` : "—"} />
              <Row label="Avarias" value={respostas.avarias ? "Sim" : "Não"} />
              <Row
                label="Lacre Roto"
                value={respostas.lacreRoto ? "Sim" : "Não"}
              />
              <Row
                label="Produto Anterior"
                value={respostas.produtoAnterior ? "Sim" : "Não"}
              />
              <Row
                label="Resíduos"
                value={respostas.residuos ? "Sim" : "Não"}
              />
              <Row
                label="Testes Vencidos"
                value={respostas.testesVencidos ? "Sim" : "Não"}
              />
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Status Resultante:</p>
                <StatusBadge status={statusPreview()} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={respostas.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                rows={3}
                placeholder="Alguma observação adicional..."
                className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-3">
        {etapa > 0 && (
          <button
            onClick={() => setEtapa((e) => e - 1)}
            className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-base"
          >
            Anterior
          </button>
        )}
        {etapa < ETAPAS.length - 1 ? (
          <button
            onClick={() => setEtapa((e) => e + 1)}
            disabled={
              etapa === 0 &&
              (!respostas.numeroSerie || !respostas.tipoContentor)
            }
            className="flex-1 bg-primary disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl text-base"
          >
            Próximo
          </button>
        ) : (
          <button
            onClick={() => void enviar()}
            disabled={enviando}
            className="flex-1 bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-base"
          >
            {enviando ? "Enviando..." : "Finalizar"}
          </button>
        )}
      </div>

      <QrScannerModal
        open={scannerAberto}
        onOpenChange={setScannerAberto}
        onDecoded={onQrLido}
      />
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left transition-colors ${
        checked
          ? "border-red-400 bg-red-50"
          : "border-border bg-card"
      }`}
    >
      <span className="text-base font-medium text-foreground">{label}</span>
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          checked ? "border-red-500 bg-red-500" : "border-border"
        }`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function tipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    OFFSHORE: "Offshore",
    ONSHORE_REFIL: "Onshore (Refil)",
    ONSHORE_BASE: "Onshore (Base)",
    "": "—",
  };
  return labels[tipo] ?? tipo;
}
