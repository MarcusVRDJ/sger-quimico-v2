import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  contentores,
  statusHistorico,
  checklistsRecebimento,
} from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { StatusBadge } from "@/components/contentores/StatusBadge";
import { Header } from "@/components/layout/Header";
import { getServerSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession();

  const [contentor] = await db
    .select()
    .from(contentores)
    .where(eq(contentores.id, id))
    .limit(1);

  if (!contentor) {
    notFound();
  }

  const historico = await db
    .select()
    .from(statusHistorico)
    .where(eq(statusHistorico.contentorId, id))
    .orderBy(desc(statusHistorico.dataMudanca))
    .limit(20);

  const checklists = await db
    .select()
    .from(checklistsRecebimento)
    .where(eq(checklistsRecebimento.contentorId, id))
    .orderBy(desc(checklistsRecebimento.dataInspecao))
    .limit(10);

  return (
    <div>
      <Header
        titulo={`Contentor ${contentor.codigo}`}
        subtitulo={`Nº Série: ${contentor.numeroSerie}`}
        usuarioNome={session?.nome ?? ""}
        usuarioPerfil={session?.perfil ?? ""}
      />

      <main className="p-6 space-y-6">
        {/* Informações gerais */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Informações Gerais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Código" value={contentor.codigo} />
            <Field label="Nº Série" value={contentor.numeroSerie} />
            <Field label="Status">
              <StatusBadge status={contentor.status} />
            </Field>
            <Field label="Tipo" value={tipoLabel(contentor.tipoContentor)} />
            <Field label="Material" value={contentor.material ?? "—"} />
            <Field
              label="Capacidade"
              value={
                contentor.capacidadeLitros
                  ? `${contentor.capacidadeLitros} L`
                  : "—"
              }
            />
            <Field label="Fabricante" value={contentor.fabricante ?? "—"} />
            <Field
              label="Tara"
              value={contentor.tara ? `${contentor.tara} kg` : "—"}
            />
            <Field
              label="Validade"
              value={
                contentor.dataValidade
                  ? new Date(contentor.dataValidade).toLocaleDateString("pt-BR")
                  : "—"
              }
            />
            <Field
              label="Última Inspeção"
              value={
                contentor.dataUltimaInspecao
                  ? new Date(contentor.dataUltimaInspecao).toLocaleDateString(
                      "pt-BR"
                    )
                  : "—"
              }
            />
            <Field
              label="Precisa Limpeza"
              value={contentor.precisaLimpeza ? "Sim" : "Não"}
            />
            {contentor.motivoReprovacao && (
              <Field
                label="Motivo Reprovação"
                value={contentor.motivoReprovacao}
              />
            )}
          </div>
          {contentor.observacoes && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Observações
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {contentor.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Histórico de status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Histórico de Status
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {historico.map((h) => (
              <div key={h.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {h.statusAnterior && (
                    <>
                      <StatusBadge status={h.statusAnterior} />
                      <span className="text-gray-400">→</span>
                    </>
                  )}
                  <StatusBadge status={h.statusNovo} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Por {h.usuarioNome} em{" "}
                  {new Date(h.dataMudanca).toLocaleString("pt-BR")}
                  {h.motivo && ` — ${h.motivo}`}
                </p>
              </div>
            ))}
            {historico.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                Sem histórico de status.
              </div>
            )}
          </div>
        </div>

        {/* Últimos checklists */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Checklists de Recebimento
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {checklists.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {c.operadorNome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.dataInspecao).toLocaleString("pt-BR")}
                  </p>
                </div>
                <StatusBadge status={c.statusResultante} />
              </div>
            ))}
            {checklists.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                Sem checklists registrados.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        {label}
      </p>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <p className="text-sm text-gray-800 mt-1">{value}</p>
      )}
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
