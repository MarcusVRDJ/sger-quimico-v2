"use client";

import { useEffect, useState } from "react";
import type { Usuario } from "@/drizzle/schema";

type UsuarioComAcoes = Omit<Usuario, "senhaHash">;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioComAcoes[]>([]);
  const [pendentes, setPendentes] = useState<UsuarioComAcoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"ativos" | "pendentes">("ativos");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function buscar() {
    const [resAtivos, resPendentes] = await Promise.all([
      fetch("/api/usuarios"),
      fetch("/api/usuarios/pendentes"),
    ]);
    if (resAtivos.ok) setUsuarios(await resAtivos.json() as UsuarioComAcoes[]);
    if (resPendentes.ok) setPendentes(await resPendentes.json() as UsuarioComAcoes[]);
    setCarregando(false);
  }

  useEffect(() => {
    void buscar();
  }, []);

  async function aprovar(id: string) {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: true }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      setErro(data?.error ?? "Não foi possível aprovar a solicitação.");
      return;
    }

    setMensagem("Solicitação aprovada. A senha temporária foi enviada por email.");
    void buscar();
  }

  async function reprovar(id: string) {
    setErro("");
    setMensagem("");

    const motivo = window.prompt("Informe o motivo da reprovação:");
    if (!motivo) return;

    const res = await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      setErro(data?.error ?? "Não foi possível reprovar a solicitação.");
      return;
    }

    setMensagem("Solicitação reprovada e email enviado ao solicitante.");
    void buscar();
  }

  const perfilLabel: Record<string, string> = {
    ADMIN: "Admin",
    ANALISTA: "Analista",
    OPERADOR: "Operador",
  };

  return (
    <div>
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerenciamento de contas de usuário
        </p>
      </div>

      <main className="p-6">
        {mensagem && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAbaAtiva("ativos")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === "ativos"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            Usuários Ativos ({usuarios.length})
          </button>
          <button
            onClick={() => setAbaAtiva("pendentes")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === "pendentes"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            Pendentes ({pendentes.length})
          </button>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm">
          {carregando ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : abaAtiva === "ativos" ? (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-muted text-foreground text-xs px-2 py-0.5 rounded-full">
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.ativo
                            ? "border border-emerald-700/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/14 dark:text-emerald-300"
                            : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuário ativo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Perfil Solicitado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendentes.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-muted text-foreground text-xs px-2 py-0.5 rounded-full">
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => void aprovar(u.id)}
                        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-700"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => void reprovar(u.id)}
                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-red-700"
                      >
                        Reprovar
                      </button>
                    </td>
                  </tr>
                ))}
                {pendentes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma solicitação pendente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
