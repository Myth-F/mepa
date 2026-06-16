import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";

// Readiness probe for operator checks. This verifies that the application can
// reach PostgreSQL, but it is not used as the Docker liveness healthcheck.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", db: "up" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
