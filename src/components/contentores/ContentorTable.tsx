"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import type { Contentor } from "@/drizzle/schema";

interface ContentorTableProps {
  contentores: Contentor[];
}

export function ContentorTable({ contentores }: ContentorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="px-4 py-3">Nº Série</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Última Inspeção</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contentores.map((c) => (
            <tr key={c.id} className="hover:bg-muted/40 transition-colors">
              <td className="px-4 py-3 font-medium text-foreground">
                {c.numeroSerie}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {tipoLabel(c.tipoContentor)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.dataUltimaInspecao
                  ? new Date(c.dataUltimaInspecao).toLocaleDateString("pt-BR")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/contentores/${c.id}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Ver detalhes
                </Link>
              </td>
            </tr>
          ))}
          {contentores.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                Nenhum contentor encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function tipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    OFFSHORE: "Offshore",
    ONSHORE_REFIL: "Onshore (Refil)",
    ONSHORE_BASE: "Onshore (Base)",
  };
  return labels[tipo] ?? tipo;
}
