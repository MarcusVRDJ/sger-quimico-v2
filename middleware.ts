import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isMobileRequest, isDeviceAllowedForPerfil } from "@/lib/device-access";

const PUBLIC_PATHS = [
  "/login",
  "/solicitar-acesso",
  "/recuperar-senha",
  "/redefinir-senha",
  "/api/auth/login",
  "/api/auth/primeiro-acesso",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
];

const ADMIN_ONLY_PATHS = ["/usuarios"];
const MOBILE_PATHS = ["/mobile"];

function redirectToLoginWithDeviceError(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("erro", "dispositivo_invalido");

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set("sge-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const mobileRequest = isMobileRequest(request);

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    // Redirect authenticated users away from auth pages
    if (
      pathname === "/login" ||
      pathname === "/solicitar-acesso" ||
      pathname === "/recuperar-senha" ||
      pathname === "/redefinir-senha"
    ) {
      const session = await getSession(request);
      if (session) {
        if (!isDeviceAllowedForPerfil(session.perfil, mobileRequest)) {
          return redirectToLoginWithDeviceError(request);
        }

        const dest =
          session.perfil === "OPERADOR"
            ? new URL("/mobile", request.url)
            : new URL("/dashboard", request.url);
        return NextResponse.redirect(dest);
      }
    }
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isDeviceAllowedForPerfil(session.perfil, mobileRequest)) {
    return redirectToLoginWithDeviceError(request);
  }

  // /usuarios → ADMIN only
  if (
    ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p)) &&
    session.perfil !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /mobile → OPERADOR or ADMIN
  if (MOBILE_PATHS.some((p) => pathname.startsWith(p))) {
    if (session.perfil !== "OPERADOR" && session.perfil !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout).*)",
  ],
};
