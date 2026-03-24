"use client";

import { useState } from "react";
import Link from "next/link";

export default function SolicitarAcessoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"ANALISTA" | "OPERADOR">("OPERADOR");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, perfil }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErro(data.error ?? "Erro ao solicitar acesso");
        return;
      }

      setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="bg-green-50 border border-green-300 text-green-700 rounded-lg px-6 py-8">
            <h2 className="text-xl font-semibold mb-2">Solicitação enviada!</h2>
            <p className="text-sm">
              Sua solicitação de acesso foi recebida. Você será notificado por
              email quando sua conta for aprovada.
            </p>
          </div>
          <Link href="/login" className="text-primary hover:underline text-sm">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">SGER Químico</h1>
          <p className="mt-2 text-muted-foreground">Solicitar acesso ao sistema</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border shadow rounded-lg p-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-foreground">
            Criar conta
          </h2>

          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-foreground"
            >
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-foreground"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="perfil"
              className="block text-sm font-medium text-foreground"
            >
              Perfil desejado
            </label>
            <select
              id="perfil"
              value={perfil}
              onChange={(e) =>
                setPerfil(e.target.value as "ANALISTA" | "OPERADOR")
              }
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="OPERADOR">Operador</option>
              <option value="ANALISTA">Analista</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-2.5 rounded-md transition-colors"
          >
            {carregando ? "Enviando..." : "Solicitar acesso"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem acesso?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
