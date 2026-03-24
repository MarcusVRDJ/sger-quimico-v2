"use client";

import { useEffect, useState } from "react";
import type { RequisicaoLimpeza } from "@/drizzle/schema";

interface RequisicaoComContentor extends RequisicaoLimpeza {
  numeroSerieContentor?: string;
}

export default function MobileLimpezaPage() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoComContentor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  async function buscar() {
    const res = await fetch("/api/limpeza?status=PENDENTE,EM_ANDAMENTO");
    if (res.ok) {
      const data = await res.json() as RequisicaoComContentor[];
      setRequisicoes(data);
    }
    setCarregando(false);
  }

  useEffect(() => {
    void buscar();
  }, []);

  async function iniciar(id: string) {
    setAtualizando(id);
    await fetch(`/api/limpeza/${id}/iniciar`, { method: "PATCH" });
    await buscar();
    setAtualizando(null);
  }

  async function concluir(id: string) {
    setAtualizando(id);
    await fetch(`/api/limpeza/${id}/concluir`, { method: "PATCH" });
    await buscar();
    setAtualizando(null);
  }

  const prioridadeColor: Record<string, string> = {
    BAIXA: "border border-border bg-muted text-muted-foreground",
    MEDIA: "border border-primary/50 bg-primary/12 text-primary",
    ALTA:
      "border border-amber-700/40 bg-amber-700/8 text-amber-700 dark:border-amber-500/45 dark:bg-amber-500/12 dark:text-amber-300",
    URGENTE:
      "border border-rose-700/40 bg-rose-700/8 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/12 dark:text-rose-300",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-foreground">Limpeza</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Requisições pendentes e em andamento
        </p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {carregando ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : requisicoes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma requisição de limpeza.</p>
          </div>
        ) : (
          requisicoes.map((r) => (
            <div
              key={r.id}
              className="bg-card rounded-xl border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {r.numeroSerieContentor ?? r.contentorId.slice(0, 8)}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${prioridadeColor[r.prioridade] ?? ""}`}
                >
                  {r.prioridade}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                Solicitado por: {r.usuarioSolicitanteNome}
              </p>

              <p className="text-xs text-muted-foreground">
                {new Date(r.dataSolicitacao).toLocaleString("pt-BR")}
              </p>

              {r.observacoes && (
                <p className="text-sm text-muted-foreground italic">{r.observacoes}</p>
              )}

              <div className="pt-1">
                {r.status === "PENDENTE" && (
                  <button
                    onClick={() => void iniciar(r.id)}
                    disabled={atualizando === r.id}
                    className="w-full bg-primary disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl"
                  >
                    {atualizando === r.id ? "Atualizando..." : "Iniciar Limpeza"}
                  </button>
                )}
                {r.status === "EM_ANDAMENTO" && (
                  <button
                    onClick={() => void concluir(r.id)}
                    disabled={atualizando === r.id}
                    className="w-full bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
                  >
                    {atualizando === r.id
                      ? "Atualizando..."
                      : "Concluir Limpeza"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
