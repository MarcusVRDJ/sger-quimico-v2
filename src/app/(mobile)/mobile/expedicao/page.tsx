"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { ChecklistSuccessModal } from "@/components/mobile/ChecklistSuccessModal";
import { QrScannerModal } from "@/components/mobile/QrScannerModal";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import { parseQrContentor } from "@/lib/qr-contentor";

interface FormData {
  numeroSerie: string;
  tampaOk: boolean;
  vedacaoOk: boolean;
  lacresIntactos: boolean;
  nomeProduto: string;
  numeroLote: string;
  quantidadeKg: string;
  numeroNfSaida: string;
  tipoDestino: "CLIENTE" | "MANUTENCAO_EXTERNA" | "";
  clienteNome: string;
  observacoes: string;
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

function isFormKey(key: string): key is keyof FormData {
  const allowed: Array<keyof FormData> = [
    "tampaOk",
    "vedacaoOk",
    "lacresIntactos",
    "nomeProduto",
    "numeroLote",
    "quantidadeKg",
    "numeroNfSaida",
    "tipoDestino",
    "clienteNome",
    "observacoes",
  ];
  return allowed.includes(key as keyof FormData);
}

export default function ExpedicaoPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [carregandoTemplate, setCarregandoTemplate] = useState(true);
  const [templateAtivo, setTemplateAtivo] = useState<TemplateAtivoResponse | null>(
    null
  );
  const [form, setForm] = useState<FormData>({
    numeroSerie: "",
    tampaOk: false,
    vedacaoOk: false,
    lacresIntactos: false,
    nomeProduto: "",
    numeroLote: "",
    quantidadeKg: "",
    numeroNfSaida: "",
    tipoDestino: "",
    clienteNome: "",
    observacoes: "",
  });

  useEffect(() => {
    async function carregarTemplateAtivo() {
      try {
        setCarregandoTemplate(true);
        const res = await fetch(
          "/api/checklist-templates/ativo?tipoChecklist=EXPEDICAO"
        );

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setErro(
            data?.error ??
              "Nenhum template ativo encontrado para checklist de expedição"
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

  const secoesDinamicas = useMemo(() => {
    if (!templateAtivo) return [];
    return templateAtivo.definicao.sections.filter((section) =>
      section.fields.some((field) => isFormKey(field.key))
    );
  }, [templateAtivo]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateRequiredFields(): string | null {
    if (!form.numeroSerie.trim()) return "Número de série é obrigatório.";

    if (secoesDinamicas.length === 0) {
      if (!form.tipoDestino) return "Tipo de destino é obrigatório.";
      return null;
    }

    for (const section of secoesDinamicas) {
      for (const field of section.fields) {
        if (!field.required || !isFormKey(field.key)) continue;

        const value = form[field.key];
        if (typeof value === "boolean") continue;
        if (typeof value === "string" && value.trim().length === 0) {
          return `Preencha o campo obrigatório: ${field.label}`;
        }
      }
    }

    return null;
  }

  function onQrLido(rawValue: string) {
    const parsed = parseQrContentor(rawValue);
    if (!parsed.ok || !parsed.data) {
      setErro(parsed.error ?? "QR inválido. Informe o número de série manualmente.");
      return;
    }

    setErro("");
    set("numeroSerie", parsed.data.numeroSerie);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    const validationError = validateRequiredFields();
    if (validationError) {
      setErro(validationError);
      setEnviando(false);
      return;
    }

    try {
      const res = await fetch("/api/checklists/expedicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Erro ao enviar checklist");
        return;
      }
      setModalSucessoAberto(true);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-foreground">
          Checklist Expedição
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {templateAtivo
            ? `${templateAtivo.templateNome} (v${templateAtivo.versao})`
            : "EXPED-001"}
        </p>
      </div>

      <form onSubmit={enviar} className="px-4 py-6 space-y-6 pb-24">
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

        {/* Identificação */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Identificação
          </h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Número de Série *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={form.numeroSerie}
                onChange={(e) => set("numeroSerie", e.target.value)}
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
          </div>
        </section>

        {secoesDinamicas.length === 0 ? (
          <>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Inspeção</h2>
              <ToggleRow
                label="Tampa OK?"
                checked={form.tampaOk}
                onChange={(v) => set("tampaOk", v)}
              />
              <ToggleRow
                label="Vedação OK?"
                checked={form.vedacaoOk}
                onChange={(v) => set("vedacaoOk", v)}
              />
              <ToggleRow
                label="Lacres intactos?"
                checked={form.lacresIntactos}
                onChange={(v) => set("lacresIntactos", v)}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Produto</h2>
              <InputField
                label="Nome do Produto"
                value={form.nomeProduto}
                onChange={(v) => set("nomeProduto", v)}
                placeholder="Ex: Produto Químico A"
              />
              <InputField
                label="Número do Lote"
                value={form.numeroLote}
                onChange={(v) => set("numeroLote", v)}
                placeholder="Ex: LOTE-2024-001"
              />
              <InputField
                label="Quantidade (kg)"
                value={form.quantidadeKg}
                onChange={(v) => set("quantidadeKg", v)}
                placeholder="Ex: 800"
                type="number"
              />
              <InputField
                label="Nº NF Saída"
                value={form.numeroNfSaida}
                onChange={(v) => set("numeroNfSaida", v)}
                placeholder="Ex: 123456"
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Destino</h2>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Destino *
                </label>
                <select
                  required
                  value={form.tipoDestino}
                  onChange={(e) =>
                    set("tipoDestino", e.target.value as FormData["tipoDestino"])
                  }
                  className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione...</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="MANUTENCAO_EXTERNA">Manutenção Externa</option>
                </select>
              </div>
              {form.tipoDestino === "CLIENTE" && (
                <InputField
                  label="Nome do Cliente"
                  value={form.clienteNome}
                  onChange={(v) => set("clienteNome", v)}
                  placeholder="Ex: Empresa XYZ"
                />
              )}
            </section>

            <section>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observações
              </label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                rows={3}
                placeholder="Alguma observação adicional..."
                className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </section>
          </>
        ) : (
          secoesDinamicas.map((section) => (
            <section key={section.id} className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}

              {section.fields.map((field) => {
                if (!isFormKey(field.key)) return null;

                const key = field.key;
                const value = form[key];

                if (field.type === "boolean") {
                  return (
                    <ToggleRow
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
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {field.label}
                        {field.required ? " *" : ""}
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

                if (key === "observacoes") {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      <textarea
                        value={String(value)}
                        onChange={(e) => set(key, e.target.value)}
                        rows={3}
                        placeholder={field.placeholder}
                        className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>
                  );
                }

                return (
                  <InputField
                    key={field.key}
                    label={`${field.label}${field.required ? " *" : ""}`}
                    value={String(value)}
                    onChange={(v) => set(key, v)}
                    placeholder={field.placeholder}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  />
                );
              })}

              {form.tipoDestino === "CLIENTE" &&
                !section.fields.some((field) => field.key === "clienteNome") && (
                  <InputField
                    label="Nome do Cliente"
                    value={form.clienteNome}
                    onChange={(v) => set("clienteNome", v)}
                    placeholder="Ex: Empresa XYZ"
                  />
                )}
            </section>
          ))
        )}

        <button
          type="submit"
          disabled={enviando || carregandoTemplate}
          className="w-full bg-green-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-base"
        >
          {enviando ? "Enviando..." : "Finalizar Expedição"}
        </button>
      </form>

      <QrScannerModal
        open={scannerAberto}
        onOpenChange={setScannerAberto}
        onDecoded={onQrLido}
      />

      <ChecklistSuccessModal
        open={modalSucessoAberto}
        title="Checklist registrado"
        description="O checklist de expedição foi salvo com sucesso."
        seconds={5}
        onFinish={() => {
          if (!modalSucessoAberto) return;
          setModalSucessoAberto(false);
          router.push("/mobile?sucesso=expedicao");
        }}
      />
    </div>
  );
}

function ToggleRow({
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
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left transition-colors ${
        checked ? "border-green-400 bg-green-50" : "border-border bg-card"
      }`}
    >
      <span className="text-base font-medium text-foreground">{label}</span>
      <span
        className={`text-sm font-semibold ${
          checked ? "text-green-600" : "text-muted-foreground"
        }`}
      >
        {checked ? "Sim" : "Não"}
      </span>
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border bg-background rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
