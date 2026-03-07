import { cn } from "@/lib/utils";
import type { StatusContentor } from "@/drizzle/schema";

const statusConfig: Record<
  StatusContentor,
  { label: string; className: string }
> = {
  APROVADO: {
    label: "Aprovado",
    className: "bg-green-100 text-green-800",
  },
  APROVADO_SUJO: {
    label: "Aprovado (Sujo)",
    className: "bg-yellow-100 text-yellow-800",
  },
  REPROVADO_VENCIDO: {
    label: "Reprovado — Vencido",
    className: "bg-red-100 text-red-800",
  },
  REPROVADO_INTEGRIDADE: {
    label: "Reprovado — Integridade",
    className: "bg-red-100 text-red-800",
  },
  RESERVADO_PRODUCAO: {
    label: "Reservado p/ Produção",
    className: "bg-blue-100 text-blue-800",
  },
  RESERVADO_PRODUCAO_EM_LIMPEZA: {
    label: "Reservado p/ Produção (Em Limpeza)",
    className: "bg-blue-100 text-blue-800",
  },
  EM_LIMPEZA: {
    label: "Em Limpeza",
    className: "bg-purple-100 text-purple-800",
  },
  MANUTENCAO_INTERNA: {
    label: "Manutenção Interna",
    className: "bg-orange-100 text-orange-800",
  },
  RESERVADO_USO_INTERNO: {
    label: "Reservado p/ Uso Interno",
    className: "bg-indigo-100 text-indigo-800",
  },
  DISPONIVEL: {
    label: "Disponível",
    className: "bg-green-100 text-green-800",
  },
  EM_CICLO: {
    label: "Em Ciclo",
    className: "bg-teal-100 text-teal-800",
  },
  MANUTENCAO_EXTERNA: {
    label: "Manutenção Externa",
    className: "bg-orange-100 text-orange-800",
  },
  RETIDO: {
    label: "Retido",
    className: "bg-red-100 text-red-800",
  },
};

interface StatusBadgeProps {
  status: StatusContentor;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
