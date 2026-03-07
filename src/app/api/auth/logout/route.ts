import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, revokeSession } from "@/lib/auth";

const COOKIE_NAME = "sge-token";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);

  if (token) {
    await revokeSession(token);
  }

  return response;
}
