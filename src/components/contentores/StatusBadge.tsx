import { cn } from "@/lib/utils";
import type { StatusContentor } from "@/drizzle/schema";

const statusConfig: Record<
  StatusContentor,
  { label: string; className: string }
> = {
  APROVADO: {
    label: "Aprovado",
    className:
      "border border-emerald-700/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/14 dark:text-emerald-300",
  },
  APROVADO_SUJO: {
    label: "Aprovado (Sujo)",
    className:
      "border border-amber-700/40 bg-amber-700/8 text-amber-700 dark:border-amber-500/45 dark:bg-amber-500/12 dark:text-amber-300",
  },
  REPROVADO_VENCIDO: {
    label: "Reprovado — Vencido",
    className:
      "border border-rose-700/40 bg-rose-700/8 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/12 dark:text-rose-300",
  },
  REPROVADO_INTEGRIDADE: {
    label: "Reprovado — Integridade",
    className:
      "border border-rose-700/40 bg-rose-700/8 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/12 dark:text-rose-300",
  },
  RESERVADO_PRODUCAO: {
    label: "Reservado p/ Produção",
    className:
      "border border-primary/50 bg-primary/12 text-primary dark:border-primary/55 dark:bg-primary/16",
  },
  RESERVADO_PRODUCAO_EM_LIMPEZA: {
    label: "Reservado p/ Produção (Em Limpeza)",
    className:
      "border border-primary/50 bg-primary/12 text-primary dark:border-primary/55 dark:bg-primary/16",
  },
  EM_LIMPEZA: {
    label: "Em Limpeza",
    className:
      "border border-violet-700/40 bg-violet-700/8 text-violet-700 dark:border-violet-500/45 dark:bg-violet-500/12 dark:text-violet-300",
  },
  MANUTENCAO_INTERNA: {
    label: "Manutenção Interna",
    className:
      "border border-orange-700/40 bg-orange-700/8 text-orange-700 dark:border-orange-500/45 dark:bg-orange-500/12 dark:text-orange-300",
  },
  RESERVADO_USO_INTERNO: {
    label: "Reservado p/ Uso Interno",
    className:
      "border border-sky-700/40 bg-sky-700/8 text-sky-700 dark:border-sky-500/45 dark:bg-sky-500/12 dark:text-sky-300",
  },
  DISPONIVEL: {
    label: "Disponível",
    className:
      "border border-emerald-700/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/14 dark:text-emerald-300",
  },
  EM_CICLO: {
    label: "Em Ciclo",
    className:
      "border border-teal-700/40 bg-teal-700/8 text-teal-700 dark:border-teal-500/45 dark:bg-teal-500/12 dark:text-teal-300",
  },
  MANUTENCAO_EXTERNA: {
    label: "Manutenção Externa",
    className:
      "border border-orange-700/40 bg-orange-700/8 text-orange-700 dark:border-orange-500/45 dark:bg-orange-500/12 dark:text-orange-300",
  },
  RETIDO: {
    label: "Retido",
    className:
      "border border-rose-700/40 bg-rose-700/8 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/12 dark:text-rose-300",
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
