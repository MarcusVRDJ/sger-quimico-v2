"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  codigo: string;
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

export default function ExpedicaoPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState<FormData>({
    codigo: "",
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

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
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
      router.push("/mobile?sucesso=expedicao");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-gray-900">
          Checklist Expedição
        </h1>
        <p className="text-sm text-gray-500 mt-1">EXPED-001</p>
      </div>

      <form onSubmit={enviar} className="px-4 py-6 space-y-6 pb-24">
        {erro && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        {/* Identificação */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Identificação
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código do Contentor *
            </label>
            <input
              type="text"
              required
              value={form.codigo}
              onChange={(e) => set("codigo", e.target.value)}
              placeholder="Ex: IBC-001"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Inspeção */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Inspeção</h2>
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

        {/* Produto */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Produto</h2>
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

        {/* Destino */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Destino</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Destino *
            </label>
            <select
              required
              value={form.tipoDestino}
              onChange={(e) =>
                set("tipoDestino", e.target.value as FormData["tipoDestino"])
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Observações */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            rows={3}
            placeholder="Alguma observação adicional..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </section>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-green-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-base"
        >
          {enviando ? "Enviando..." : "Finalizar Expedição"}
        </button>
      </form>
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
        checked ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
      }`}
    >
      <span className="text-base font-medium text-gray-800">{label}</span>
      <span
        className={`text-sm font-semibold ${
          checked ? "text-green-600" : "text-gray-400"
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
