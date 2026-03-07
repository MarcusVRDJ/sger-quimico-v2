"use client";

import { useEffect, useState } from "react";
import type { Usuario } from "@/drizzle/schema";

type UsuarioComAcoes = Omit<Usuario, "senhaHash">;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioComAcoes[]>([]);
  const [pendentes, setPendentes] = useState<UsuarioComAcoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"ativos" | "pendentes">("ativos");

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
    await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: true }),
    });
    void buscar();
  }

  async function reprovar(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    void buscar();
  }

  const perfilLabel: Record<string, string> = {
    ADMIN: "Admin",
    ANALISTA: "Analista",
    OPERADOR: "Operador",
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Usuários</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerenciamento de contas de usuário
        </p>
      </div>

      <main className="p-6">
        {/* Abas */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAbaAtiva("ativos")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === "ativos"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Usuários Ativos ({usuarios.length})
          </button>
          <button
            onClick={() => setAbaAtiva("pendentes")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              abaAtiva === "pendentes"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Pendentes ({pendentes.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {carregando ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : abaAtiva === "ativos" ? (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhum usuário ativo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Perfil Solicitado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendentes.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
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
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
