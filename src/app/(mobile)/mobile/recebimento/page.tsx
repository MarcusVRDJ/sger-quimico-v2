"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import { QrScannerModal } from "@/components/mobile/QrScannerModal";
import { ChecklistSuccessModal } from "@/components/mobile/ChecklistSuccessModal";
import type { StatusContentor } from "@/drizzle/schema";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
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

interface TemplateAtivoResponse {
  templateId: string;
  templateNome: string;
  tipoChecklist: "RECEBIMENTO" | "EXPEDICAO";
  revisaoId: string;
  versao: number;
  definicao: ChecklistTemplateDefinition;
  aprovadoEm: string | null;
}

function isRespostaKey(key: string): key is keyof Respostas {
  const allowed: Array<keyof Respostas> = [
    "avarias",
    "lacreRoto",
    "testesVencidos",
    "produtoAnterior",
    "residuos",
    "dataValidade",
    "dataUltimaInspecao",
    "observacoes",
  ];

  return allowed.includes(key as keyof Respostas);
}

export default function RecebimentoPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [infoNumeroSerie, setInfoNumeroSerie] = useState("");
  const [erro, setErro] = useState("");
  const [carregandoTemplate, setCarregandoTemplate] = useState(true);
  const [templateAtivo, setTemplateAtivo] = useState<TemplateAtivoResponse | null>(
    null
  );
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

  useEffect(() => {
    async function carregarTemplateAtivo() {
      try {
        setCarregandoTemplate(true);
        const res = await fetch(
          "/api/checklist-templates/ativo?tipoChecklist=RECEBIMENTO"
        );

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;

          setErro(
            data?.error ??
              "Nenhum template ativo encontrado para checklist de recebimento"
          );
          setTemplateAtivo(null);
          return;
        }

        const data = (await res.json()) as TemplateAtivoResponse;
        setTemplateAtivo(data);
      } catch {
        setErro("Não foi possível carregar o template de checklist.");
        setTemplateAtivo(null);
      } finally {
        setCarregandoTemplate(false);
      }
    }

    void carregarTemplateAtivo();
  }, []);

  const secoesTemplate = useMemo(() => {
    if (!templateAtivo) return [];

    return templateAtivo.definicao.sections.filter((section) =>
      section.fields.some((field) => isRespostaKey(field.key))
    );
  }, [templateAtivo]);

  const etapas = useMemo(() => {
    if (secoesTemplate.length === 0) return ETAPAS;
    return [
      "Identificação",
      ...secoesTemplate.map((section) => section.title),
      "Revisão",
    ];
  }, [secoesTemplate]);

  const ultimaEtapa = etapas.length - 1;
  const secaoAtual =
    etapa > 0 && etapa < ultimaEtapa ? secoesTemplate[etapa - 1] : null;

  function canAdvance(): boolean {
    if (etapa === 0) {
      return Boolean(respostas.numeroSerie && respostas.tipoContentor);
    }

    if (!secaoAtual) return true;

    return secaoAtual.fields.every((field) => {
      if (!field.required || !isRespostaKey(field.key)) return true;

      const value = respostas[field.key];
      if (typeof value === "boolean") return true;
      return value.trim().length > 0;
    });
  }

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
      setModalSucessoAberto(true);
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
          {etapas.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= etapa ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Etapa {etapa + 1} de {etapas.length}: <strong>{etapas[etapa]}</strong>
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {carregandoTemplate && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
            Carregando template de checklist...
          </div>
        )}

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

        {/* Etapas dinâmicas de inspeção */}
        {secaoAtual && (
          <div className="space-y-4">
            {secaoAtual.description && (
              <p className="text-sm text-muted-foreground">{secaoAtual.description}</p>
            )}
            {secaoAtual.fields.map((field) => {
              if (!isRespostaKey(field.key)) return null;

              const key = field.key;
              const value = respostas[key];

              if (field.type === "boolean") {
                return (
                  <CheckItem
                    key={field.key}
                    label={field.label}
                    checked={Boolean(value)}
                    onChange={(v) => set(key, v)}
                  />
                );
              }

              if (field.type === "select") {
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {field.label}
                    </label>
                    <select
                      value={String(value)}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione...</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                    value={String(value)}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Etapa 4: Revisão */}
        {etapa === ultimaEtapa && (
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
              {templateAtivo && (
                <p className="text-xs text-muted-foreground pt-1">
                  Template: {templateAtivo.templateNome} (v{templateAtivo.versao})
                </p>
              )}
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
        {etapa < etapas.length - 1 ? (
          <button
            onClick={() => setEtapa((e) => e + 1)}
            disabled={!canAdvance()}
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

      <ChecklistSuccessModal
        open={modalSucessoAberto}
        title="Checklist registrado"
        description="O checklist de recebimento foi salvo com sucesso."
        seconds={5}
        onFinish={() => {
          if (!modalSucessoAberto) return;
          setModalSucessoAberto(false);
          router.push("/mobile?sucesso=recebimento");
        }}
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
