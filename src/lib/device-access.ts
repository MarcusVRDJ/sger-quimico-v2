import { NextRequest } from "next/server";
import type { Perfil } from "@/drizzle/schema";

export function isMobileRequest(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
  return /android|iphone|ipad|ipod|iemobile|opera mini|mobile/.test(ua);
}

export function isDeviceAllowedForPerfil(
  perfil: Perfil,
  mobileRequest: boolean
): boolean {
  if (perfil === "ADMIN") return true;
  if (perfil === "ANALISTA") return !mobileRequest;
  if (perfil === "OPERADOR") return mobileRequest;
  return false;
}

export function deviceAccessErrorMessage(perfil: Perfil): string {
  if (perfil === "ANALISTA") {
    return "Usuários ANALISTA só podem acessar via computador (interface desktop).";
  }

  if (perfil === "OPERADOR") {
    return "Usuários OPERADOR só podem acessar via dispositivo móvel (telefone).";
  }

  return "Este perfil não pode acessar usando este tipo de dispositivo.";
}