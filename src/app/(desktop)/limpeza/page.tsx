"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import type { RequisicaoLimpeza } from "@/drizzle/schema";

interface RequisicaoComContentor extends RequisicaoLimpeza {
  codigoContentor?: string;
}

export default function LimpezaPage() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoComContentor[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      const res = await fetch("/api/limpeza");
      if (res.ok) {
        const data = await res.json() as RequisicaoComContentor[];
        setRequisicoes(data);
      }
      setCarregando(false);
    }
    void buscar();
  }, []);

  const prioridadeLabel: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  const prioridadeColor: Record<string, string> = {
    BAIXA: "bg-gray-100 text-gray-700",
    MEDIA: "bg-blue-100 text-blue-700",
    ALTA: "bg-orange-100 text-orange-700",
    URGENTE: "bg-red-100 text-red-700",
  };

  const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em Andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Requisições de Limpeza
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestão das requisições de limpeza de contentores
        </p>
      </div>

      <main className="p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {carregando ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Contentor</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data Solicitação</th>
                    <th className="px-4 py-3">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requisicoes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {r.codigoContentor ?? r.contentorId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.usuarioSolicitanteNome}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridadeColor[r.prioridade] ?? ""}`}
                        >
                          {prioridadeLabel[r.prioridade] ?? r.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {statusLabel[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(r.dataSolicitacao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {r.tipoOrigem === "REQUISICAO_FORMAL"
                          ? "Requisição Formal"
                          : "Limpeza Direta"}
                      </td>
                    </tr>
                  ))}
                  {requisicoes.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma requisição de limpeza encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
