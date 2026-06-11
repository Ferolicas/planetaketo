import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Healthcheck estándar del holding: usado por deploy/monitorización.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
