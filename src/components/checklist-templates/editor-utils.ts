import type { ChecklistTemplateDefinition } from "@/lib/checklist-template-definition";
import type { TipoChecklist } from "@/components/checklist-templates/types";

export function defaultDefinition(tipo: TipoChecklist): ChecklistTemplateDefinition {
  if (tipo === "RECEBIMENTO") {
    return {
      schemaVersion: 1,
      title: "Checklist de Recebimento",
      sections: [
        {
          id: "inspecao-externa",
          title: "Inspeção Externa",
          fields: [
            { key: "avarias", label: "Há avarias físicas visíveis?", type: "boolean", required: true },
            { key: "lacreRoto", label: "Lacre roto ou ausente?", type: "boolean", required: true },
          ],
        },
        {
          id: "inspecao-interna",
          title: "Inspeção Interna",
          fields: [
            { key: "produtoAnterior", label: "Presença de produto anterior?", type: "boolean", required: true },
            { key: "residuos", label: "Presença de resíduos?", type: "boolean", required: true },
          ],
        },
        {
          id: "validade",
          title: "Validades",
          fields: [
            { key: "testesVencidos", label: "Testes técnicos vencidos?", type: "boolean", required: true },
            { key: "dataValidade", label: "Data de validade", type: "date", required: false },
            { key: "dataUltimaInspecao", label: "Data da última inspeção", type: "date", required: false },
          ],
        },
      ],
    };
  }

  return {
    schemaVersion: 1,
    title: "Checklist de Expedição",
    sections: [
      {
        id: "inspecao",
        title: "Inspeção",
        fields: [
          { key: "tampaOk", label: "Tampa OK?", type: "boolean", required: true },
          { key: "vedacaoOk", label: "Vedação OK?", type: "boolean", required: true },
          { key: "lacresIntactos", label: "Lacres intactos?", type: "boolean", required: true },
        ],
      },
      {
        id: "produto",
        title: "Produto",
        fields: [
          { key: "nomeProduto", label: "Nome do Produto", type: "text", required: false },
          { key: "numeroLote", label: "Número do Lote", type: "text", required: false },
          { key: "quantidadeKg", label: "Quantidade (kg)", type: "number", required: false },
          { key: "numeroNfSaida", label: "Nº NF Saída", type: "text", required: false },
        ],
      },
      {
        id: "destino",
        title: "Destino",
        fields: [
          {
            key: "tipoDestino",
            label: "Tipo de destino",
            type: "select",
            required: true,
            options: [
              { value: "CLIENTE", label: "Cliente" },
              { value: "MANUTENCAO_EXTERNA", label: "Manutenção Externa" },
            ],
          },
          { key: "clienteNome", label: "Nome do Cliente", type: "text", required: false },
          { key: "observacoes", label: "Observações", type: "text", required: false },
        ],
      },
    ],
  };
}

export function validateEditorDefinition(definicao: ChecklistTemplateDefinition): string | null {
  if (!definicao.title.trim()) return "Título do template é obrigatório.";
  if (definicao.sections.length === 0) return "Adicione ao menos uma seção.";

  for (const section of definicao.sections) {
    if (!section.id.trim()) return "Toda seção precisa de ID.";
    if (!section.title.trim()) return "Toda seção precisa de título.";
    if (section.fields.length === 0) return `A seção ${section.title} precisa de ao menos um campo.`;

    for (const field of section.fields) {
      if (!field.key.trim()) return "Todo campo precisa de chave.";
      if (!field.label.trim()) return "Todo campo precisa de rótulo.";
      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        return `Campo ${field.label} precisa de opções.`;
      }
    }
  }

  return null;
}
