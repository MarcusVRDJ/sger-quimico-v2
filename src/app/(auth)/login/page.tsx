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
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [trocaObrigatoria, setTrocaObrigatoria] = useState(false);
  const [salvandoNovaSenha, setSalvandoNovaSenha] = useState(false);
  const [sucessoTroca, setSucessoTroca] = useState("");

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
    setSucessoTroca("");
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json() as {
        error?: string;
        perfil?: string;
        code?: "TROCA_SENHA_OBRIGATORIA" | "SENHA_TEMPORARIA_EXPIRADA";
      };

      if (!res.ok) {
        if (data.code === "TROCA_SENHA_OBRIGATORIA") {
          setTrocaObrigatoria(true);
        }
        setErro(data.error ?? "Erro ao fazer login");
        return;
      }

      setTrocaObrigatoria(false);

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

  async function handlePrimeiroAcesso() {
    setErro("");
    setSucessoTroca("");

    if (!email || !senha) {
      setErro("Informe o email e a senha temporária para continuar.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }

    setSalvandoNovaSenha(true);

    try {
      const res = await fetch("/api/auth/primeiro-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senhaAtual: senha, novaSenha }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErro(data.error ?? "Não foi possível concluir o primeiro acesso.");
        return;
      }

      setSucessoTroca("Senha atualizada com sucesso. Faça login com a nova senha.");
      setTrocaObrigatoria(false);
      setSenha("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvandoNovaSenha(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">SGER Químico</h1>
          <p className="mt-2 text-muted-foreground">
            Sistema de Gerenciamento de Embalagens Retornáveis voltado à indústria química
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

          {sucessoTroca && (
            <div className="bg-green-50 border border-green-300 text-green-700 rounded px-4 py-3 text-sm">
              {sucessoTroca}
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

          <p className="text-center text-sm">
            <Link
              href="/recuperar-senha"
              className="text-primary hover:underline font-medium"
            >
              Esqueci minha senha
            </Link>
          </p>

          {trocaObrigatoria && (
            <div className="space-y-4 border border-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Primeiro acesso: defina sua nova senha
              </h3>
              <p className="text-xs text-muted-foreground">
                Use a senha temporária recebida no email e escolha uma nova senha com no mínimo 10 caracteres, incluindo maiúscula, minúscula e número.
              </p>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground" htmlFor="novaSenha">
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
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground" htmlFor="confirmarNovaSenha">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmarNovaSenha"
                  type="password"
                  required
                  minLength={10}
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                  className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  void handlePrimeiroAcesso();
                }}
                disabled={salvandoNovaSenha}
                className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-secondary-foreground font-medium py-2.5 rounded-md transition-colors"
              >
                {salvandoNovaSenha ? "Salvando..." : "Concluir primeiro acesso"}
              </button>
            </div>
          )}

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
