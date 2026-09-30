import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/**
 * The MCP endpoint can change the inventory, so it stays disabled until a
 * token is configured and every request must present it as a bearer token.
 * Returns an error response to send, or null when the request is allowed.
 */
export function checkMcpAuthorization(request: Request): Response | null {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected) {
    return Response.json(
      {
        error: "The MCP endpoint is disabled. Set MCP_API_TOKEN to enable it.",
      },
      { status: 503 }
    );
  }

  const provided =
    request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  // Hashing first gives equal-length buffers, as timingSafeEqual requires.
  if (!timingSafeEqual(digest(provided), digest(expected))) {
    return Response.json(
      { error: "Invalid or missing bearer token." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }
  return null;
}
