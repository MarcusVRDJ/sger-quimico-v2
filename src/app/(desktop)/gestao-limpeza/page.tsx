"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { RequisicaoLimpeza } from "@/drizzle/schema";

interface RequisicaoComContentor extends RequisicaoLimpeza {
  numeroSerieContentor?: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "ANALISTA" | "OPERADOR";
}

interface ContentorItem {
  id: string;
  numeroSerie: string;
  status: string;
}

type NovaRequisicaoForm = {
  contentorId: string;
  usuarioExecutorId: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  tipoOrigem: "REQUISICAO_FORMAL" | "LIMPEZA_DIRETA";
  reservadoParaProducao: boolean;
  observacoes: string;
};

const initialForm: NovaRequisicaoForm = {
  contentorId: "",
  usuarioExecutorId: "",
  prioridade: "MEDIA",
  tipoOrigem: "REQUISICAO_FORMAL",
  reservadoParaProducao: false,
  observacoes: "",
};

export default function GestaoLimpezaPage() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoComContentor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [contentores, setContentores] = useState<ContentorItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [formNova, setFormNova] = useState<NovaRequisicaoForm>(initialForm);

  async function buscarRequisicoes() {
    const url = new URL("/api/limpeza", window.location.origin);
    if (filtroStatus) url.searchParams.set("status", filtroStatus);

    const res = await fetch(url.toString());
    if (!res.ok) return;

    const data = (await res.json()) as RequisicaoComContentor[];
    setRequisicoes(data);
  }

  async function buscarUsuarios() {
    const res = await fetch("/api/usuarios");
    if (!res.ok) return;

    const data = (await res.json()) as Usuario[];
    setUsuarios(data);
  }

  async function buscarContentores() {
    const res = await fetch("/api/contentores");
    if (!res.ok) return;

    const data = (await res.json()) as ContentorItem[];
    setContentores(data);
  }

  async function carregarTudo() {
    setCarregando(true);
    await Promise.all([
      buscarRequisicoes(),
      buscarUsuarios(),
      buscarContentores(),
    ]);
    setCarregando(false);
  }

  useEffect(() => {
    void carregarTudo();
  }, []);

  useEffect(() => {
    void buscarRequisicoes();
  }, [filtroStatus]);

  const operadores = useMemo(
    () => usuarios.filter((u) => u.perfil === "OPERADOR"),
    [usuarios]
  );

  const requisicoesFiltradas = useMemo(() => {
    return requisicoes.filter((r) => {
      if (filtroPrioridade && r.prioridade !== filtroPrioridade) return false;
      return true;
    });
  }, [requisicoes, filtroPrioridade]);

  async function criarRequisicao(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!formNova.contentorId) {
      setErro("Selecione um contentor");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        contentorId: formNova.contentorId,
        usuarioExecutorId: formNova.usuarioExecutorId || undefined,
        prioridade: formNova.prioridade,
        tipoOrigem: formNova.tipoOrigem,
        reservadoParaProducao: formNova.reservadoParaProducao,
        observacoes: formNova.observacoes || undefined,
      };

      const res = await fetch("/api/limpeza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErro(data.error ?? "Erro ao criar requisição");
        return;
      }

      setModalNovaAberto(false);
      setFormNova(initialForm);
      await buscarRequisicoes();
    } catch {
      setErro("Erro de conexão ao criar requisição");
    } finally {
      setSalvando(false);
    }
  }

  async function designarOperador(requisicaoId: string, usuarioExecutorId: string) {
    const res = await fetch(`/api/limpeza/${requisicaoId}/designar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioExecutorId }),
    });

    if (res.ok) {
      await buscarRequisicoes();
    }
  }

  async function alterarPrioridade(
    requisicaoId: string,
    prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE"
  ) {
    const res = await fetch(`/api/limpeza/${requisicaoId}/prioridade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prioridade }),
    });

    if (res.ok) {
      await buscarRequisicoes();
    }
  }

  async function cancelarRequisicao(requisicaoId: string) {
    const ok = window.confirm("Cancelar esta requisição?");
    if (!ok) return;

    const res = await fetch(`/api/limpeza/${requisicaoId}/cancelar`, {
      method: "PATCH",
    });

    if (res.ok) {
      await buscarRequisicoes();
    }
  }

  const prioridadeClasses: Record<string, string> = {
    BAIXA: "bg-muted text-muted-foreground border border-border",
    MEDIA: "bg-primary/10 text-primary border border-primary/30",
    ALTA: "bg-amber-100 text-amber-700 border border-amber-300",
    URGENTE: "bg-rose-100 text-rose-700 border border-rose-300",
  };

  return (
    <div>
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestão de Limpeza</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crie, priorize e designe requisições para os operadores
          </p>
        </div>

        <button
          onClick={() => setModalNovaAberto(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Requisição
        </button>
      </div>

      <main className="p-6 space-y-4">
        <div className="flex gap-3">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-border bg-background rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="border border-border bg-background rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todas as prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
          {carregando ? (
            <div className="px-4 py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3">Contentor</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requisicoesFiltradas.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {r.numeroSerieContentor ?? r.contentorId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.usuarioSolicitanteNome}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.usuarioExecutorId ?? ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            void designarOperador(r.id, e.target.value);
                          }
                        }}
                        className="border border-border bg-background rounded px-2 py-1 text-xs min-w-[170px]"
                      >
                        <option value="">Não designado</option>
                        {operadores.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.prioridade}
                        onChange={(e) =>
                          void alterarPrioridade(
                            r.id,
                            e.target.value as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE"
                          )
                        }
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          prioridadeClasses[r.prioridade] ?? ""
                        }`}
                      >
                        <option value="BAIXA">BAIXA</option>
                        <option value="MEDIA">MEDIA</option>
                        <option value="ALTA">ALTA</option>
                        <option value="URGENTE">URGENTE</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">
                      {r.status !== "CANCELADA" && r.status !== "CONCLUIDA" && (
                        <button
                          onClick={() => void cancelarRequisicao(r.id)}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
                        >
                          <X className="h-3 w-3" />
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!carregando && requisicoesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma requisição encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modalNovaAberto && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Nova Requisição de Limpeza</h3>
              <button
                onClick={() => setModalNovaAberto(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void criarRequisicao(e)} className="p-5 space-y-4">
              {erro && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-sm px-3 py-2">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Contentor *</label>
                <select
                  required
                  value={formNova.contentorId}
                  onChange={(e) =>
                    setFormNova((prev) => ({ ...prev, contentorId: e.target.value }))
                  }
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione um contentor</option>
                  {contentores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numeroSerie} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Operador</label>
                <select
                  value={formNova.usuarioExecutorId}
                  onChange={(e) =>
                    setFormNova((prev) => ({ ...prev, usuarioExecutorId: e.target.value }))
                  }
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Não designar agora</option>
                  {operadores.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Prioridade</label>
                  <select
                    value={formNova.prioridade}
                    onChange={(e) =>
                      setFormNova((prev) => ({
                        ...prev,
                        prioridade: e.target.value as NovaRequisicaoForm["prioridade"],
                      }))
                    }
                    className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Origem</label>
                  <select
                    value={formNova.tipoOrigem}
                    onChange={(e) =>
                      setFormNova((prev) => ({
                        ...prev,
                        tipoOrigem: e.target.value as NovaRequisicaoForm["tipoOrigem"],
                      }))
                    }
                    className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="REQUISICAO_FORMAL">Requisição formal</option>
                    <option value="LIMPEZA_DIRETA">Limpeza direta</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={formNova.reservadoParaProducao}
                  onChange={(e) =>
                    setFormNova((prev) => ({
                      ...prev,
                      reservadoParaProducao: e.target.checked,
                    }))
                  }
                />
                Reservar para produção após limpeza
              </label>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Observações</label>
                <textarea
                  value={formNova.observacoes}
                  onChange={(e) =>
                    setFormNova((prev) => ({ ...prev, observacoes: e.target.value }))
                  }
                  rows={3}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaAberto(false)}
                  className="rounded-lg px-4 py-2 text-sm border border-border bg-background hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Criar Requisição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
