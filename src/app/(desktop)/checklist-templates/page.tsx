"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import {
  defaultDefinition,
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

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Templates</h3>
              <span className="text-xs text-muted-foreground">{pendenciasTexto}</span>
            </div>
            {carregando ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <div className="divide-y divide-border">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void carregarRevisoes(t)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {t.tipoChecklist === "RECEBIMENTO"
                        ? "Recebimento"
                        : "Expedição"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.tipoChecklist} • {new Date(t.updatedAt).toLocaleString("pt-BR")}
                    </p>
                  </button>
                ))}
                {templates.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">Nenhum template cadastrado.</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {templateSelecionado
                  ? `Revisões • ${
                      templateSelecionado.tipoChecklist === "RECEBIMENTO"
                        ? "Recebimento"
                        : "Expedição"
                    }`
                  : "Revisões"}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {revisoes.map((r) => (
                <div key={r.id} className="px-4 py-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    v{r.versao} • {r.status}
                  </p>
                  {r.resumoMudancas && (
                    <p className="text-xs text-muted-foreground">{r.resumoMudancas}</p>
                  )}
                  <div className="flex gap-2">
                    {(r.status === "RASCUNHO" || r.status === "REJEITADO") && (
                      <button
                        onClick={() => void submeterRevisao(r.id)}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md"
                      >
                        Submeter
                      </button>
                    )}
                    {r.status === "PENDENTE_APROVACAO" && (
                      <>
                        <button
                          onClick={() => void aprovar(r.id)}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => void rejeitar(r.id)}
                          className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md"
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {revisoes.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  Selecione um template para visualizar as revisões.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Editor de Revisão</h3>
              <p className="text-xs text-muted-foreground">
                Edite seções e campos e salve uma nova revisão sequencial.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void salvarNovaRevisao(false)}
                disabled={!templateSelecionado || !editorDefinition || salvandoRevisao}
                className="bg-primary disabled:opacity-50 text-primary-foreground text-xs px-3 py-1.5 rounded-md"
              >
                Salvar Revisão
              </button>
              <button
                onClick={() => void salvarNovaRevisao(true)}
                disabled={!templateSelecionado || !editorDefinition || salvandoRevisao}
                className="bg-blue-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-md"
              >
                Salvar e Submeter
              </button>
            </div>
          </div>

          {!templateSelecionado || !editorDefinition ? (
            <div className="p-4 text-sm text-muted-foreground">
              Selecione um template para começar a editar.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Revisão base
                  </label>
                  <select
                    value={editorSourceRevisionId}
                    onChange={(e) => carregarRevisaoNoEditor(e.target.value)}
                    className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                  >
                    {revisoes.map((r) => (
                      <option key={r.id} value={r.id}>
                        v{r.versao} • {r.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Resumo das mudanças
                  </label>
                  <input
                    value={editorResumo}
                    onChange={(e) => setEditorResumo(e.target.value)}
                    placeholder="Ex: Ajuste de perguntas da inspeção"
                    className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Título</label>
                  <input
                    value={editorDefinition.title}
                    onChange={(e) =>
                      updateDefinition((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Descrição
                  </label>
                  <input
                    value={editorDefinition.description ?? ""}
                    onChange={(e) =>
                      updateDefinition((prev) => ({
                        ...prev,
                        description: e.target.value || undefined,
                      }))
                    }
                    className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {editorDefinition.sections.map((section, sectionIndex) => (
                  <div key={section.id + sectionIndex} className="border border-border rounded-md p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        value={section.id}
                        onChange={(e) =>
                          updateSection(sectionIndex, (prev) => ({
                            ...prev,
                            id: e.target.value,
                          }))
                        }
                        placeholder="ID da seção"
                        className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(sectionIndex, (prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Título da seção"
                        className="border border-border bg-background rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => removeSection(sectionIndex)}
                        className="border border-red-300 text-red-600 text-xs rounded-md px-3 py-2"
                      >
                        Remover Seção
                      </button>
                    </div>

                    <input
                      value={section.description ?? ""}
                      onChange={(e) =>
                        updateSection(sectionIndex, (prev) => ({
                          ...prev,
                          description: e.target.value || undefined,
                        }))
                      }
                      placeholder="Descrição da seção (opcional)"
                      className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                    />

                    <div className="space-y-2">
                      {section.fields.map((field, fieldIndex) => (
                        <div key={field.key + fieldIndex} className="border border-border rounded-md p-2 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <input
                              value={field.key}
                              onChange={(e) =>
                                updateField(sectionIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  key: e.target.value,
                                }))
                              }
                              placeholder="Chave"
                              className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                            />
                            <input
                              value={field.label}
                              onChange={(e) =>
                                updateField(sectionIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  label: e.target.value,
                                }))
                              }
                              placeholder="Rótulo"
                              className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                            />
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateField(sectionIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  type: e.target.value as TemplateField["type"],
                                  options:
                                    e.target.value === "select"
                                      ? prev.options ?? [{ value: "OPCAO", label: "Opção" }]
                                      : undefined,
                                }))
                              }
                              className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                            >
                              <option value="boolean">boolean</option>
                              <option value="text">text</option>
                              <option value="number">number</option>
                              <option value="select">select</option>
                              <option value="date">date</option>
                            </select>
                            <label className="flex items-center gap-2 text-xs text-foreground border border-border rounded-md px-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(sectionIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    required: e.target.checked,
                                  }))
                                }
                              />
                              Obrigatório
                            </label>
                            <button
                              onClick={() => removeField(sectionIndex, fieldIndex)}
                              className="border border-red-300 text-red-600 text-xs rounded-md px-2 py-1.5"
                            >
                              Remover
                            </button>
                          </div>

                          {field.type === "select" && (
                            <div className="space-y-1">
                              {(field.options ?? []).map((option, optionIndex) => (
                                <div key={`${option.value}-${optionIndex}`} className="grid grid-cols-2 gap-2">
                                  <input
                                    value={option.value}
                                    onChange={(e) =>
                                      updateField(sectionIndex, fieldIndex, (prev) => ({
                                        ...prev,
                                        options: (prev.options ?? []).map((opt, idx) =>
                                          idx === optionIndex
                                            ? { ...opt, value: e.target.value }
                                            : opt
                                        ),
                                      }))
                                    }
                                    placeholder="valor"
                                    className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                                  />
                                  <input
                                    value={option.label}
                                    onChange={(e) =>
                                      updateField(sectionIndex, fieldIndex, (prev) => ({
                                        ...prev,
                                        options: (prev.options ?? []).map((opt, idx) =>
                                          idx === optionIndex
                                            ? { ...opt, label: e.target.value }
                                            : opt
                                        ),
                                      }))
                                    }
                                    placeholder="label"
                                    className="border border-border bg-background rounded-md px-2 py-1.5 text-xs"
                                  />
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  updateField(sectionIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    options: [
                                      ...(prev.options ?? []),
                                      { value: `OPCAO_${Date.now()}`, label: "Nova Opção" },
                                    ],
                                  }))
                                }
                                className="text-xs text-blue-700"
                              >
                                + Adicionar opção
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addField(sectionIndex)}
                      className="text-xs text-blue-700"
                    >
                      + Adicionar campo
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addSection}
                className="text-xs text-blue-700"
              >
                + Adicionar seção
              </button>
            </div>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Pendências de Aprovação</h3>
          </div>
          <div className="divide-y divide-border">
            {pendentes.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.tipoChecklist === "RECEBIMENTO" ? "Recebimento" : "Expedição"} • v{p.versao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Criada em {new Date(p.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void aprovar(p.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-md"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => void rejeitar(p.id)}
                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}

            {pendentes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                Nenhuma revisão pendente no momento.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
