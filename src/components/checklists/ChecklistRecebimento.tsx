import { StatusBadge } from "@/components/contentores/StatusBadge";
import type { ChecklistRecebimento } from "@/drizzle/schema";

interface ChecklistRecebimentoCardProps {
  checklist: ChecklistRecebimento;
}

export function ChecklistRecebimentoCard({
  checklist,
}: ChecklistRecebimentoCardProps) {
  const respostas = checklist.respostas as Record<string, boolean>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {checklist.operadorNome}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(checklist.dataInspecao).toLocaleString("pt-BR")}
          </p>
        </div>
        <StatusBadge status={checklist.statusResultante} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <RespostaItem label="Avarias" valor={respostas.avarias} />
        <RespostaItem label="Lacre Roto" valor={respostas.lacreRoto} />
        <RespostaItem label="Testes Vencidos" valor={respostas.testesVencidos} />
        <RespostaItem label="Produto Anterior" valor={respostas.produtoAnterior} />
        <RespostaItem label="Resíduos" valor={respostas.residuos} />
      </div>

      {checklist.observacoes && (
        <p className="text-xs text-gray-600 italic">{checklist.observacoes}</p>
      )}
    </div>
  );
}

function RespostaItem({
  label,
  valor,
}: {
  label: string;
  valor: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${valor ? "bg-red-500" : "bg-green-500"}`}
      />
      <span className="text-gray-600">{label}:</span>
      <span className={valor ? "text-red-600 font-medium" : "text-green-600"}>
        {valor ? "Sim" : "Não"}
      </span>
    </div>
  );
}
