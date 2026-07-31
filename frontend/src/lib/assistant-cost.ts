export type AssistantUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
};

type CostRates = {
  input: number;
  cachedInput: number;
  output: number;
};

const defaultRatesByModel: Record<string, CostRates> = {
  "gpt-5.6-terra": { input: 2.5, cachedInput: 0.25, output: 15 },
  "gpt-5.6-luna": { input: 1, cachedInput: 0.1, output: 6 },
};

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function configuredRate(value: string | undefined, fallback: number | undefined) {
  if (value === undefined || value === "") return fallback ?? null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function getAssistantUsage(value: unknown): AssistantUsage | null {
  if (!value || typeof value !== "object") return null;
  const usage = value as Record<string, unknown>;
  const inputTokens = numberOrNull(usage.input_tokens);
  const outputTokens = numberOrNull(usage.output_tokens);
  if (inputTokens === null || outputTokens === null) return null;
  const inputDetails = usage.input_tokens_details as Record<string, unknown> | undefined;
  const outputDetails = usage.output_tokens_details as Record<string, unknown> | undefined;
  const cachedInputTokens = numberOrNull(inputDetails?.cached_tokens) ?? 0;
  const reasoningTokens = numberOrNull(outputDetails?.reasoning_tokens) ?? 0;
  const totalTokens = numberOrNull(usage.total_tokens) ?? inputTokens + outputTokens;
  return { inputTokens, cachedInputTokens, outputTokens, reasoningTokens, totalTokens };
}

export function estimateAssistantCost(usage: AssistantUsage, model: string, environment: Record<string, string | undefined> = process.env) {
  const defaults = defaultRatesByModel[model];
  const input = configuredRate(environment.OPENAI_INPUT_COST_PER_MILLION, defaults?.input);
  const cachedInput = configuredRate(environment.OPENAI_CACHED_INPUT_COST_PER_MILLION, defaults?.cachedInput);
  const output = configuredRate(environment.OPENAI_OUTPUT_COST_PER_MILLION, defaults?.output);
  if (input === null || cachedInput === null || output === null || usage.cachedInputTokens > usage.inputTokens) return null;
  return ((usage.inputTokens - usage.cachedInputTokens) * input + usage.cachedInputTokens * cachedInput + usage.outputTokens * output) / 1_000_000;
}

export function formatAssistantCost(cost: number) {
  if (cost < 0.01) return `~$${cost.toFixed(4)}`;
  return `~$${cost.toFixed(2)}`;
}
