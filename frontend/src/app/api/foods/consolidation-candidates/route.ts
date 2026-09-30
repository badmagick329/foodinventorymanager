import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { findConsolidationCandidates } from "@/server/inventory/consolidation";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () =>
  NextResponse.json({ groups: await findConsolidationCandidates() })
);
