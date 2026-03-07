interface StatCardProps {
  titulo: string;
  valor: number | string;
  descricao?: string;
  cor?: "blue" | "green" | "yellow" | "red";
}

function StatCard({ titulo, valor, descricao, cor = "blue" }: StatCardProps) {
  const colors = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    yellow: "border-yellow-500 bg-yellow-50",
    red: "border-red-500 bg-red-50",
  };

  const textColors = {
    blue: "text-blue-700",
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
  };

  return (
    <div className={`rounded-lg border-l-4 p-6 ${colors[cor]} shadow-sm`}>
      <p className="text-sm font-medium text-gray-600">{titulo}</p>
      <p className={`text-3xl font-bold mt-2 ${textColors[cor]}`}>{valor}</p>
      {descricao && (
        <p className="text-sm text-gray-500 mt-1">{descricao}</p>
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
