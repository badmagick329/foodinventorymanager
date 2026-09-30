import { NextResponse } from "next/server";
import { apiRoute, readJson } from "@/server/http";
import { resolveProposal } from "@/server/assistant/proposals";

export const POST = apiRoute(async (request) =>
  NextResponse.json({ message: await resolveProposal(await readJson(request)) })
);
