import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import { RefreshCw, Send, Droplets } from "lucide-react";

export default async function MobileHomePage() {
  const session = await getServerSession();

  const acoes = [
    {
      href: "/mobile/recebimento",
      label: "Checklist Recebimento",
      descricao: "Inspecionar contentor recebido",
      icon: RefreshCw,
      cor: "bg-primary",
    },
    {
      href: "/mobile/expedicao",
      label: "Checklist Expedição",
      descricao: "Liberar contentor para expedição",
      icon: Send,
      cor: "bg-green-600",
    },
    {
      href: "/mobile/limpeza",
      label: "Limpeza",
      descricao: "Executar limpeza de contentor",
      icon: Droplets,
      cor: "bg-purple-600",
    },
  ];

  return (
    <div className="px-4 pt-8 pb-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {session?.nome?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">O que você vai fazer hoje?</p>
      </div>

      <div className="space-y-4">
        {acoes.map((acao) => {
          const Icon = acao.icon;
          return (
            <Link
              key={acao.href}
              href={acao.href}
              className="flex items-center gap-4 bg-card rounded-xl p-5 shadow-sm border border-border active:scale-95 transition-transform"
            >
              <div className={`${acao.cor} p-3 rounded-xl text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{acao.label}</p>
                <p className="text-sm text-muted-foreground">{acao.descricao}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
