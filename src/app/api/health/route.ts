import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";

// Liveness + readiness probe used by Docker Compose healthchecks and the VPS
// reverse proxy. Returns 200 only when the database is reachable.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
