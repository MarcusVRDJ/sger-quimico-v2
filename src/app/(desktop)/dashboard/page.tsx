import { getServerSession } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import { db } from "@/lib/db";
import {
  contentores,
  checklistsRecebimento,
  usuarios,
} from "@/drizzle/schema";
import { desc, eq, or, count } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await getServerSession();

  // Busca estatísticas
  const [totalResult] = await db
    .select({ count: count() })
    .from(contentores);

  const [disponiveisResult] = await db
    .select({ count: count() })
    .from(contentores)
    .where(eq(contentores.status, "DISPONIVEL"));

  const [emLimpezaResult] = await db
    .select({ count: count() })
    .from(contentores)
    .where(eq(contentores.status, "EM_LIMPEZA"));

  const [reprovadosResult] = await db
    .select({ count: count() })
    .from(contentores)
    .where(
      or(
        eq(contentores.status, "REPROVADO_VENCIDO"),
        eq(contentores.status, "REPROVADO_INTEGRIDADE")
      )
    );

  // Últimos 10 checklists de recebimento
  const ultimosChecklists = await db
    .select({
      id: checklistsRecebimento.id,
      contentorId: checklistsRecebimento.contentorId,
      operadorNome: checklistsRecebimento.operadorNome,
      dataInspecao: checklistsRecebimento.dataInspecao,
      statusResultante: checklistsRecebimento.statusResultante,
      numeroSerieContentor: contentores.numeroSerie,
    })
    .from(checklistsRecebimento)
    .leftJoin(contentores, eq(checklistsRecebimento.contentorId, contentores.id))
    .orderBy(desc(checklistsRecebimento.dataInspecao))
    .limit(10);

  return (
    <div>
      <Header
        titulo="Dashboard"
        subtitulo="Visão geral do sistema"
        usuarioNome={session?.nome ?? ""}
        usuarioPerfil={session?.perfil ?? ""}
      />

      <main className="p-6 space-y-8">
        <StatsCards
          totalContentores={Number(totalResult.count)}
          disponiveis={Number(disponiveisResult.count)}
          emLimpeza={Number(emLimpezaResult.count)}
          reprovados={Number(reprovadosResult.count)}
        />

        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">
              Últimos Checklists de Recebimento
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3">Contentor</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status Resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ultimosChecklists.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {c.numeroSerieContentor ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.operadorNome}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.dataInspecao).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.statusResultante} />
                    </td>
                  </tr>
                ))}
                {ultimosChecklists.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Nenhum checklist registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
