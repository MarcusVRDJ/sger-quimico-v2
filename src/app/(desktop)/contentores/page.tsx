"use client";

import { useEffect, useState } from "react";
import { ContentorTable } from "@/components/contentores/ContentorTable";
import type { Contentor, StatusContentor } from "@/drizzle/schema";

const STATUS_OPTIONS: { value: StatusContentor | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos os status" },
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "APROVADO_SUJO", label: "Aprovado (Sujo)" },
  { value: "EM_LIMPEZA", label: "Em Limpeza" },
  { value: "RESERVADO_PRODUCAO", label: "Reservado p/ Produção" },
  { value: "RESERVADO_PRODUCAO_EM_LIMPEZA", label: "Reservado (Em Limpeza)" },
  { value: "RESERVADO_USO_INTERNO", label: "Reservado Uso Interno" },
  { value: "MANUTENCAO_INTERNA", label: "Manutenção Interna" },
  { value: "MANUTENCAO_EXTERNA", label: "Manutenção Externa" },
  { value: "EM_CICLO", label: "Em Ciclo" },
  { value: "RETIDO", label: "Retido" },
  { value: "REPROVADO_VENCIDO", label: "Reprovado — Vencido" },
  { value: "REPROVADO_INTEGRIDADE", label: "Reprovado — Integridade" },
];

export default function ContentoresPage() {
  const [contentores, setContentores] = useState<Contentor[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusContentor | "TODOS">(
    "TODOS"
  );
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      const params = new URLSearchParams();
      if (filtroStatus !== "TODOS") params.set("status", filtroStatus);
      const res = await fetch(`/api/contentores?${params}`);
      if (res.ok) {
        const data = await res.json() as Contentor[];
        setContentores(data);
      }
      setCarregando(false);
    }
    void buscar();
  }, [filtroStatus]);

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Contentores</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestão do ciclo de vida dos contentores IBC
        </p>
      </div>

      <main className="p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-4">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-gray-700"
            >
              Filtrar por status:
            </label>
            <select
              id="status-filter"
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as StatusContentor | "TODOS")
              }
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {carregando ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : (
            <ContentorTable contentores={contentores} />
          )}
        </div>
      </main>
    </div>
  );
}
