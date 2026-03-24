import { StatusBadge } from "@/components/contentores/StatusBadge";
import type { ChecklistExpedicao } from "@/drizzle/schema";

interface ChecklistExpedicaoCardProps {
  checklist: ChecklistExpedicao;
}

export function ChecklistExpedicaoCard({
  checklist,
}: ChecklistExpedicaoCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {checklist.operadorNome}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(checklist.dataInspecao).toLocaleString("pt-BR")}
          </p>
        </div>
        <StatusBadge status={checklist.statusResultante} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <CheckItem label="Tampa OK" ok={checklist.tampaOk} />
        <CheckItem label="Vedação OK" ok={checklist.vedacaoOk} />
        <CheckItem label="Lacres Intactos" ok={checklist.lacresIntactos} />
      </div>

      {checklist.nomeProduto && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Produto:</span>{" "}
            {checklist.nomeProduto}
          </p>
          {checklist.clienteNome && (
            <p>
              <span className="font-medium">Cliente:</span>{" "}
              {checklist.clienteNome}
            </p>
          )}
        </div>
      )}

      {checklist.observacoes && (
        <p className="text-xs text-muted-foreground italic">{checklist.observacoes}</p>
      )}
    </div>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
      />
      <span className="text-muted-foreground">{label}:</span>
      <span className={ok ? "text-green-600 font-medium" : "text-red-600"}>
        {ok ? "Sim" : "Não"}
      </span>
    </div>
  );
}
