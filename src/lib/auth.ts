import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { sessions, usuarios } from "@/drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import type { Perfil } from "@/drizzle/schema";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return new TextEncoder().encode(
    secret ?? "fallback-secret-change-me-in-development"
  );
}

const COOKIE_NAME = "sge-token";
const JWT_EXPIRY = "8h";

function resolveCookieSecure(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (override === "true") return true;
  if (override === "false") return false;

  return process.env.NODE_ENV === "production";
}

export interface JWTPayload {
  sub: string;
  email: string;
  nome: string;
  perfil: Perfil;
  sessionId: string;
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function getSession(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token =
    request.cookies.get(COOKIE_NAME)?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);
  const now = new Date();

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!session) return null;

  return payload;
}

export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return session;
}

export async function requireRole(
  roles: Perfil[],
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  if (!roles.includes(session.perfil)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return session;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: resolveCookieSecure(),
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8h
    path: "/",
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: resolveCookieSecure(),
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ─── Server component session ─────────────────────────────────────────────────

export async function getServerSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);
  const now = new Date();

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!session) return null;
  return payload;
}

// ─── Create / revoke session ──────────────────────────────────────────────────

export async function createSession(
  userId: string,
  token: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
