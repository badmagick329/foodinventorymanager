import { createMcpHandler } from "@modelcontextprotocol/server";
import { NextRequest } from "next/server";
import { checkMcpAuthorization } from "@/server/mcp/auth";
import { createInventoryMcpServer } from "@/server/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stateless: every request gets a fresh server, for current and 2025-era clients.
const handler = createMcpHandler(() => createInventoryMcpServer(), {
  onerror: (error) => console.error("MCP request failed", error),
});

async function handle(request: NextRequest) {
  return checkMcpAuthorization(request) ?? handler.fetch(request);
}

export { handle as GET, handle as POST, handle as DELETE };
