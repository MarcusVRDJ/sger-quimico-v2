import { describe, expect, it } from "vitest";
import { buildChecklistPreviewModel } from "@/components/checklist-templates/preview-model";

describe("buildChecklistPreviewModel", () => {
  it("resume seções e campos com contagem correta", () => {
    const model = buildChecklistPreviewModel({
      schemaVersion: 2,
      title: "Checklist Forms",
      description: "Modelo de teste",
      sections: [
        {
          id: "sec-1",
          title: "Seção 1",
          fields: [
            { key: "a", label: "Campo A", type: "boolean", required: true },
            {
              key: "b",
              label: "Campo B",
              type: "select",
              required: false,
              options: [
                { value: "x", label: "X" },
                { value: "y", label: "Y" },
              ],
            },
          ],
        },
      ],
    });

    expect(model.title).toBe("Checklist Forms");
    expect(model.sectionCount).toBe(1);
    expect(model.fieldCount).toBe(2);
    expect(model.sections[0]?.fields[1]?.typeLabel).toBe("Lista");
    expect(model.sections[0]?.fields[1]?.optionCount).toBe(2);
  });
});
