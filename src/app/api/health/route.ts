import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(
      {
        status: "ok",
        service: "sge-quimico-v2",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Falha no endpoint de health", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Health check falhou",
      },
      { status: 500 }
    );
  }
}