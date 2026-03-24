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

function parsePositiveNumber(value: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseTara(value: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);

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
