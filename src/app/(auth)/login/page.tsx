"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json() as { error?: string; perfil?: string };

      if (!res.ok) {
        setErro(data.error ?? "Erro ao fazer login");
        return;
      }

      if (data.perfil === "OPERADOR") {
        router.push("/mobile");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SGE Químico v2</h1>
          <p className="mt-2 text-gray-600">
            Sistema de Gerenciamento de Contentores IBC
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-800">Entrar</h2>

          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-md transition-colors"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Não tem acesso?{" "}
            <Link
              href="/solicitar-acesso"
              className="text-blue-600 hover:underline font-medium"
            >
              Solicitar acesso
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
