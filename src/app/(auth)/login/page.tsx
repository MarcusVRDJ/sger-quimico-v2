"use client";

import { Suspense, useState } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (searchParams.get("erro") === "dispositivo_invalido") {
      setErro(
        "Este perfil não pode acessar usando este tipo de dispositivo."
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json() as { error?: string; perfil?: string };

      if (!res.ok) {
        setErro(data.error ?? "Erro ao fazer login");
        return;
      }

      const meRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!meRes.ok) {
        setErro(
          "Login validado, mas a sessão não foi persistida neste navegador. Verifique se está acessando por HTTPS ou ajuste AUTH_COOKIE_SECURE no ambiente de teste local."
        );
        return;
      }

      if (data.perfil === "OPERADOR") {
        router.replace("/mobile");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
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
          <h1 className="text-3xl font-bold text-foreground">SGE Químico v2</h1>
          <p className="mt-2 text-muted-foreground">
            Sistema de Gerenciamento de Contentores IBC
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border shadow rounded-lg p-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-foreground">Entrar</h2>

          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {erro}
            </div>
          )}

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
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-2.5 rounded-md transition-colors"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem acesso?{" "}
            <Link
              href="/solicitar-acesso"
              className="text-primary hover:underline font-medium"
            >
              Solicitar acesso
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
