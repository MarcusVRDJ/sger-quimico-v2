"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import {
  defaultDefinition,
  moveFieldAcrossSectionsInDefinition,
  reorderFieldsInDefinitionSection,
  reorderSectionsInDefinition,
  suggestUniqueFieldKey,
  validateEditorDefinition,
} from "@/components/checklist-templates/editor-utils";
import type {
  PendenteRow,
  RevisaoRow,
  TemplateField,
  TemplateRow,
  TemplateSection,
  TipoChecklist,
} from "@/components/checklist-templates/types";
import { TemplateListSection } from "@/components/checklist-templates/TemplateListSection";
import { RevisionListSection } from "@/components/checklist-templates/RevisionListSection";
import { RevisionEditorSection } from "@/components/checklist-templates/RevisionEditorSection";
import { PendingReviewsSection } from "@/components/checklist-templates/PendingReviewsSection";
import { ChecklistPreviewPanel } from "@/components/checklist-templates/ChecklistPreviewPanel";

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [pendentes, setPendentes] = useState<PendenteRow[]>([]);
  const [revisoes, setRevisoes] = useState<RevisaoRow[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateRow | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoChecklist>("RECEBIMENTO");
  const [editorResumo, setEditorResumo] = useState("");
  const [editorDefinition, setEditorDefinition] =
    useState<ChecklistTemplateDefinition | null>(null);
  const [editorSourceRevisionId, setEditorSourceRevisionId] = useState<string>("");
  const [salvandoRevisao, setSalvandoRevisao] = useState(false);

  async function obterDefinicaoBasePorTipo(
    tipo: TipoChecklist
  ): Promise<ChecklistTemplateDefinition> {
    const templateTipo = templates.find((item) => item.tipoChecklist === tipo);
    if (!templateTipo) return defaultDefinition(tipo);

    const res = await fetch(`/api/checklist-templates/${templateTipo.id}`);
    if (!res.ok) return defaultDefinition(tipo);

    const data = (await res.json()) as { revisoes: RevisaoRow[] };
    const ultimaRevisao = data.revisoes[0];

    if (!ultimaRevisao?.definicao) return defaultDefinition(tipo);
    return ultimaRevisao.definicao;
  }

  async function carregar() {
    setCarregando(true);
    const [resTemplates, resPendentes] = await Promise.all([
      fetch("/api/checklist-templates"),
      fetch("/api/checklist-templates/revisoes/pendentes"),
    ]);

    if (resTemplates.ok) setTemplates((await resTemplates.json()) as TemplateRow[]);
    if (resPendentes.ok) setPendentes((await resPendentes.json()) as PendenteRow[]);
    setCarregando(false);
  }

  async function carregarRevisoes(template: TemplateRow) {
    setTemplateSelecionado(template);
    setRevisoes([]);

    const res = await fetch(`/api/checklist-templates/${template.id}`);
    if (!res.ok) {
      setErro("Não foi possível carregar revisões do template.");
      return;
    }

    const data = (await res.json()) as { revisoes: RevisaoRow[] };
    setRevisoes(data.revisoes);

    const base = data.revisoes[0]?.definicao ?? defaultDefinition(template.tipoChecklist);
    setEditorDefinition(base);
    setEditorSourceRevisionId(data.revisoes[0]?.id ?? "");
    setEditorResumo("");
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function criarTemplateBase() {
    setErro("");
    setMensagem("");

    const definicaoBase = await obterDefinicaoBasePorTipo(novoTipo);

    const res = await fetch("/api/checklist-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: "Revisão criada pelo painel admin",
        tipoChecklist: novoTipo,
        definicao: definicaoBase,
        resumoMudancas: "Revisão criada via painel",
      }),
    });

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setErro(data?.error ?? "Falha ao criar template");
      return;
    }

    setMensagem("Revisão criada com sucesso.");
    await carregar();

    const templateTipo = templates.find((item) => item.tipoChecklist === novoTipo);
    if (templateTipo) {
      await carregarRevisoes(templateTipo);
    }
  }

  function carregarRevisaoNoEditor(revisaoId: string) {
    const revisao = revisoes.find((item) => item.id === revisaoId);
    if (!revisao?.definicao) return;

    setEditorSourceRevisionId(revisao.id);
    setEditorDefinition(revisao.definicao);
    setEditorResumo("");
  }

  function updateDefinition(mutator: (prev: ChecklistTemplateDefinition) => ChecklistTemplateDefinition) {
    setEditorDefinition((prev) => {
      if (!prev) return prev;
      return mutator(prev);
    });
  }

  function updateSection(sectionIndex: number, mutator: (section: TemplateSection) => TemplateSection) {
    updateDefinition((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === sectionIndex ? mutator(section) : section
      ),
    }));
  }

  function updateField(
    sectionIndex: number,
    fieldIndex: number,
    mutator: (field: TemplateField) => TemplateField
  ) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      fields: section.fields.map((field, idx) =>
        idx === fieldIndex ? mutator(field) : field
      ),
    }));
  }

  function addSection() {
    updateDefinition((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `secao-${Date.now()}`,
          title: "Nova Seção",
          description: "",
          fields: [
            {
              key: `campo_${Date.now()}`,
              label: "Novo campo",
              type: "text",
              required: false,
            },
          ],
        },
      ],
    }));
  }

  function removeSection(sectionIndex: number) {
    updateDefinition((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex),
    }));
  }

  function addField(sectionIndex: number) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      fields: [
        ...section.fields,
        {
          key: `campo_${Date.now()}`,
          label: "Novo campo",
          type: "text",
          required: false,
        },
      ],
    }));
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      fields: section.fields.filter((_, idx) => idx !== fieldIndex),
    }));
  }

  function reorderSections(fromIndex: number, toIndex: number) {
    updateDefinition((prev) => reorderSectionsInDefinition(prev, fromIndex, toIndex));
  }

  function reorderFields(sectionIndex: number, fromIndex: number, toIndex: number) {
    updateDefinition((prev) =>
      reorderFieldsInDefinitionSection(prev, sectionIndex, fromIndex, toIndex)
    );
  }

  function moveFieldAcrossSections(
    fromSectionIndex: number,
    fromFieldIndex: number,
    toSectionIndex: number,
    toFieldIndex: number
  ) {
    updateDefinition((prev) =>
      moveFieldAcrossSectionsInDefinition(
        prev,
        fromSectionIndex,
        fromFieldIndex,
        toSectionIndex,
        toFieldIndex
      )
    );
  }

  function updateFieldLabel(sectionIndex: number, fieldIndex: number, label: string) {
    if (!editorDefinition) return;

    const generatedKey = suggestUniqueFieldKey(editorDefinition, label, {
      sectionIndex,
      fieldIndex,
    });

    updateField(sectionIndex, fieldIndex, (prev) => ({
      ...prev,
      label,
      key: generatedKey,
    }));
  }

  async function salvarNovaRevisao(submeterAposSalvar: boolean) {
    if (!templateSelecionado || !editorDefinition) {
      setErro("Selecione um template para editar.");
      return;
    }

    const validationError = validateEditorDefinition(editorDefinition);
    if (validationError) {
      setErro(validationError);
      return;
    }

    setErro("");
    setMensagem("");
    setSalvandoRevisao(true);

    try {
      const res = await fetch(`/api/checklist-templates/${templateSelecionado.id}/revisoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          definicao: editorDefinition,
          resumoMudancas: editorResumo || "Revisão criada via editor visual",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!res.ok || !data?.id) {
        setErro(data?.error ?? "Falha ao criar revisão.");
        return;
      }

      if (submeterAposSalvar) {
        const submitRes = await fetch(
          `/api/checklist-templates/revisoes/${data.id}/submeter`,
          { method: "PATCH" }
        );
        const submitData = (await submitRes.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!submitRes.ok) {
          setErro(submitData?.error ?? "Revisão criada, mas falhou ao submeter.");
        } else {
          setMensagem("Revisão criada e submetida para aprovação.");
        }
      } else {
        setMensagem("Nova revisão criada em rascunho.");
      }

      await carregar();
      await carregarRevisoes(templateSelecionado);
    } finally {
      setSalvandoRevisao(false);
    }
  }

  async function submeterRevisao(revisaoId: string) {
    setErro("");
    const res = await fetch(`/api/checklist-templates/revisoes/${revisaoId}/submeter`, {
      method: "PATCH",
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setErro(data?.error ?? "Falha ao submeter revisão");
      return;
    }

    setMensagem("Revisão submetida para aprovação.");
    await carregar();
    if (templateSelecionado) await carregarRevisoes(templateSelecionado);
  }

  async function aprovar(revisaoId: string) {
    setErro("");
    const res = await fetch(`/api/checklist-templates/revisoes/${revisaoId}/aprovar`, {
      method: "PATCH",
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setErro(data?.error ?? "Falha ao aprovar revisão");
      return;
    }

    setMensagem("Revisão aprovada.");
    await carregar();
    if (templateSelecionado) await carregarRevisoes(templateSelecionado);
  }

  async function rejeitar(revisaoId: string) {
    setErro("");
    const motivo = window.prompt("Informe o motivo da rejeição:");
    if (!motivo) return;

    const res = await fetch(`/api/checklist-templates/revisoes/${revisaoId}/rejeitar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setErro(data?.error ?? "Falha ao rejeitar revisão");
      return;
    }

    setMensagem("Revisão rejeitada.");
    await carregar();
    if (templateSelecionado) await carregarRevisoes(templateSelecionado);
  }

  const pendenciasTexto = useMemo(() => {
    return `${pendentes.length} revisão(ões) pendente(s)`;
  }, [pendentes.length]);

  return (
    <div>
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Checklist Templates</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestão de templates, revisões e aprovações
        </p>
      </div>

      <main className="p-6 space-y-6">
        {mensagem && (
          <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <section className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Nova Revisão</h3>
          <div className="flex gap-3">
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as TipoChecklist)}
              className="flex-1 border border-border bg-background rounded-md px-3 py-2 text-sm"
            >
              <option value="RECEBIMENTO">Recebimento</option>
              <option value="EXPEDICAO">Expedição</option>
            </select>
            <button
              onClick={() => void criarTemplateBase()}
              className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md"
            >
              Criar Revisão
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            O sistema usa numeração sequencial por tipo (v1, v2, v3...).
          </p>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] gap-6 items-start">
          <ChecklistPreviewPanel definition={editorDefinition} />

          <RevisionEditorSection
            templateSelecionado={templateSelecionado}
            editorDefinition={editorDefinition}
            editorSourceRevisionId={editorSourceRevisionId}
            editorResumo={editorResumo}
            revisoes={revisoes}
            salvandoRevisao={salvandoRevisao}
            onChangeRevisionSource={carregarRevisaoNoEditor}
            onChangeResumo={setEditorResumo}
            onChangeTitle={(value) => updateDefinition((prev) => ({ ...prev, title: value }))}
            onChangeDescription={(value) =>
              updateDefinition((prev) => ({
                ...prev,
                description: value || undefined,
              }))
            }
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onUpdateSection={updateSection}
            onAddField={addField}
            onRemoveField={removeField}
            onUpdateField={updateField}
            onUpdateFieldLabel={updateFieldLabel}
            onReorderSections={reorderSections}
            onReorderFields={reorderFields}
            onMoveFieldAcrossSections={moveFieldAcrossSections}
            onSaveDraft={() => void salvarNovaRevisao(false)}
            onSaveAndSubmit={() => void salvarNovaRevisao(true)}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <TemplateListSection
            carregando={carregando}
            templates={templates}
            pendenciasTexto={pendenciasTexto}
            onSelectTemplate={(template) => void carregarRevisoes(template)}
          />

          <RevisionListSection
            templateSelecionado={templateSelecionado}
            revisoes={revisoes}
            onSubmitRevision={(revisaoId) => void submeterRevisao(revisaoId)}
            onApproveRevision={(revisaoId) => void aprovar(revisaoId)}
            onRejectRevision={(revisaoId) => void rejeitar(revisaoId)}
          />
        </section>

        <PendingReviewsSection
          pendentes={pendentes}
          onApprove={(revisaoId) => void aprovar(revisaoId)}
          onReject={(revisaoId) => void rejeitar(revisaoId)}
        />
      </main>
    </div>
  );
}
