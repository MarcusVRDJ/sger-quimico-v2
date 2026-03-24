interface StatCardProps {
  titulo: string;
  valor: number | string;
  descricao?: string;
  cor?: "blue" | "green" | "yellow" | "red";
}

function StatCard({ titulo, valor, descricao, cor = "blue" }: StatCardProps) {
  const styleMap = {
    blue: {
      surface: "bg-primary/10 dark:bg-primary/14",
      border: "border-primary/80 dark:border-primary/70",
      value: "text-primary",
    },
    green: {
      surface: "bg-emerald-600/8 dark:bg-emerald-500/12",
      border: "border-emerald-700/55 dark:border-emerald-500/60",
      value: "text-emerald-700 dark:text-emerald-300",
    },
    yellow: {
      surface: "bg-amber-700/7 dark:bg-amber-500/11",
      border: "border-amber-700/55 dark:border-amber-500/60",
      value: "text-amber-700 dark:text-amber-300",
    },
    red: {
      surface: "bg-rose-700/7 dark:bg-rose-500/11",
      border: "border-rose-700/55 dark:border-rose-500/60",
      value: "text-rose-700 dark:text-rose-300",
    },
  };

  const tone = styleMap[cor];

  return (
    <div
      className={`rounded-xl border p-6 shadow-sm backdrop-blur-[1px] ${tone.surface} ${tone.border}`}
    >
      <p className="text-sm font-medium text-foreground/75 dark:text-foreground/80">
        {titulo}
      </p>
      <p className={`text-3xl font-bold mt-2 ${tone.value}`}>{valor}</p>
      {descricao && (
        <p className="text-sm text-foreground/60 dark:text-foreground/65 mt-1">
          {descricao}
        </p>
      )}
    </div>
  );
}

interface StatsCardsProps {
  totalContentores: number;
  disponiveis: number;
  emLimpeza: number;
  reprovados: number;
}

export function StatsCards({
  totalContentores,
  disponiveis,
  emLimpeza,
  reprovados,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        titulo="Total de Contentores"
        valor={totalContentores}
        descricao="cadastrados no sistema"
        cor="blue"
      />
      <StatCard
        titulo="Disponíveis"
        valor={disponiveis}
        descricao="prontos para uso"
        cor="green"
      />
      <StatCard
        titulo="Em Limpeza"
        valor={emLimpeza}
        descricao="em processo de limpeza"
        cor="yellow"
      />
      <StatCard
        titulo="Reprovados"
        valor={reprovados}
        descricao="requerem atenção"
        cor="red"
      />
    </div>
  );
}
