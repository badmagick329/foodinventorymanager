/**
 * Every API route answers failures with `{ error }`, so callers only need to
 * handle a thrown Error whose message is ready to show.
 */
export async function apiFetch<T>(
  url: string,
  { json, ...init }: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    ...(json !== undefined && {
      body: JSON.stringify(json),
      headers: { "Content-Type": "application/json", ...init.headers },
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : "Something went wrong."
    );
  }
  return body as T;
}

export const queryKeys = {
  foods: ["foods"],
  food: (id: number | string) => ["food", String(id)],
  shopping: ["shopping"],
  foodRemovals: ["food-removals"],
  consolidationCandidates: ["food-consolidation-candidates"],
} as const;
