import { NextResponse } from "next/server";

// Liveness probe used by Docker/Coolify. It intentionally does not touch
// PostgreSQL or object storage: dependency slowness should degrade readiness,
// not trigger an application restart loop.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
