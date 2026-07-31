import { estimateAssistantCost, getAssistantUsage } from "../assistant-cost";

describe("assistant cost tracking", () => {
  const usage = { inputTokens: 1_000_000, cachedInputTokens: 200_000, outputTokens: 100_000, reasoningTokens: 10_000, totalTokens: 1_100_000 };

  it("reads streamed Responses API usage", () => {
    expect(getAssistantUsage({ input_tokens: 10, output_tokens: 4, total_tokens: 14, input_tokens_details: { cached_tokens: 3 }, output_tokens_details: { reasoning_tokens: 2 } })).toEqual({ inputTokens: 10, cachedInputTokens: 3, outputTokens: 4, reasoningTokens: 2, totalTokens: 14 });
  });

  it("uses the known Terra rates when no overrides are configured", () => {
    expect(estimateAssistantCost(usage, "gpt-5.6-terra", {})).toBeCloseTo(3.55);
  });

  it("uses configured rates for another model", () => {
    expect(estimateAssistantCost(usage, "custom", { OPENAI_INPUT_COST_PER_MILLION: "3", OPENAI_CACHED_INPUT_COST_PER_MILLION: "0.3", OPENAI_OUTPUT_COST_PER_MILLION: "12" })).toBeCloseTo(3.66);
  });

  it("does not invent a cost for an unknown unconfigured model", () => {
    expect(estimateAssistantCost(usage, "custom", {})).toBeNull();
  });
});
