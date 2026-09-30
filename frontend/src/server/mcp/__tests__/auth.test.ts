import { checkMcpAuthorization } from "../auth";

function request(authorization?: string) {
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

describe("checkMcpAuthorization", () => {
  const original = process.env.MCP_API_TOKEN;
  afterEach(() => {
    process.env.MCP_API_TOKEN = original;
  });

  it("keeps the endpoint disabled until a token is configured", () => {
    delete process.env.MCP_API_TOKEN;
    expect(checkMcpAuthorization(request("Bearer anything"))?.status).toBe(503);
  });

  it("rejects a missing or wrong token", () => {
    process.env.MCP_API_TOKEN = "secret-token";
    expect(checkMcpAuthorization(request())?.status).toBe(401);
    expect(checkMcpAuthorization(request("Bearer secret"))?.status).toBe(401);
  });

  it("allows the configured bearer token", () => {
    process.env.MCP_API_TOKEN = "secret-token";
    expect(checkMcpAuthorization(request("Bearer secret-token"))).toBeNull();
    expect(checkMcpAuthorization(request("bearer secret-token"))).toBeNull();
  });
});
