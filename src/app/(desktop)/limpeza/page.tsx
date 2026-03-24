"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import type { RequisicaoLimpeza } from "@/drizzle/schema";

interface RequisicaoComContentor extends RequisicaoLimpeza {
  numeroSerieContentor?: string;
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
    BAIXA: "border border-border bg-muted text-muted-foreground",
    MEDIA: "border border-primary/50 bg-primary/12 text-primary",
    ALTA:
      "border border-amber-700/40 bg-amber-700/8 text-amber-700 dark:border-amber-500/45 dark:bg-amber-500/12 dark:text-amber-300",
    URGENTE:
      "border border-rose-700/40 bg-rose-700/8 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/12 dark:text-rose-300",
  };

  const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em Andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return (
    <div>
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">
          Requisições de Limpeza
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestão das requisições de limpeza de contentores
        </p>
      </div>

      <main className="p-6">
        <div className="bg-card rounded-lg border border-border shadow-sm">
          {carregando ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="px-4 py-3">Contentor</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data Solicitação</th>
                    <th className="px-4 py-3">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requisicoes.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">
                        {r.numeroSerieContentor ?? r.contentorId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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
                        <span className="text-sm text-foreground">
                          {statusLabel[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.dataSolicitacao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
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
                        className="px-4 py-8 text-center text-muted-foreground"
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
