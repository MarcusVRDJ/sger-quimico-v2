"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!token) {
      setErro("Token inválido. Solicite uma nova recuperação de senha.");
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro("A confirmação da senha não confere.");
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSucesso(true);
      setNovaSenha("");
      setConfirmacao("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Redefinir senha</h1>
          <p className="mt-2 text-muted-foreground">
            Defina sua nova senha para voltar a acessar o sistema.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border shadow rounded-lg p-8 space-y-6"
        >
          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border border-green-300 text-green-700 rounded px-4 py-3 text-sm">
              Senha redefinida com sucesso. Faça login com sua nova senha.
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="novaSenha" className="block text-sm font-medium text-foreground">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              required
              minLength={10}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mínimo 10 caracteres"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmacao" className="block text-sm font-medium text-foreground">
              Confirmar nova senha
            </label>
            <input
              id="confirmacao"
              type="password"
              required
              minLength={10}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Repita a nova senha"
            />
          </div>

          <button
            type="submit"
            disabled={carregando || sucesso}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-2.5 rounded-md transition-colors"
          >
            {carregando ? "Salvando..." : "Redefinir senha"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Voltar ao login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
