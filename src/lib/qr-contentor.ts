export interface ParsedQrContentor {
  numeroSerie: string;
  fabricante: string;
  capacidadeLitros?: number;
  tara?: string;
}

export interface ParsedQrResult {
  ok: boolean;
  data?: ParsedQrContentor;
  error?: string;
}

function normalizeNumericValue(value: string): string {
  const compact = value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/(litros?|l|kgs?|kg)$/i, "");

  if (compact.includes(".") && compact.includes(",")) {
    // pt-BR comum: 1.234,56
    return compact.replace(/\./g, "").replace(",", ".");
  }

  if (compact.includes(",")) {
    return compact.replace(",", ".");
  }

  return compact;
}

function parsePositiveNumber(value: string): number | undefined {
  if (!value) return undefined;

  const normalized = normalizeNumericValue(value);
  const numericMatch = normalized.match(/\d+(?:\.\d+)?/);
  if (!numericMatch) return undefined;

  const parsed = Number(numericMatch[0]);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseTara(value: string): string | undefined {
  if (!value) return undefined;

  const normalized = normalizeNumericValue(value);
  const numericMatch = normalized.match(/\d+(?:\.\d+)?/);
  if (!numericMatch) return undefined;

  const parsed = Number(numericMatch[0]);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed.toFixed(2);
}

export function parseQrContentor(rawValue: string): ParsedQrResult {
  const parts = rawValue.split(",").map((part) => part.trim());

  if (parts.length !== 4) {
    return {
      ok: false,
      error:
        "Formato inválido. O QR deve ter: numeroSerie,fabricante,capacidade,tara",
    };
  }

  const [numeroSerie, fabricante, capacidade, tara] = parts;

  if (!numeroSerie) {
    return { ok: false, error: "Número de série não informado no QR." };
  }

  if (!fabricante) {
    return { ok: false, error: "Fabricante não informado no QR." };
  }

  const capacidadeLitros = parsePositiveNumber(capacidade);
  const taraNormalizada = parseTara(tara);

  return {
    ok: true,
    data: {
      numeroSerie,
      fabricante,
      capacidadeLitros,
      tara: taraNormalizada,
    },
  };
}
