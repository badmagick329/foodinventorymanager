import { AppError } from "@/server/errors";

const REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export function assistantConfiguration() {
  return {
    model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
    reasoningEffort: process.env.OPENAI_REASONING_EFFORT ?? "low",
  };
}

export type AssistantSettings = {
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
};

export function requireAssistantSettings(): AssistantSettings {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError("OPENAI_API_KEY is not configured.", 503);

  const { model, reasoningEffort } = assistantConfiguration();
  if (!REASONING_EFFORTS.includes(reasoningEffort as ReasoningEffort)) {
    throw new AppError(
      `OPENAI_REASONING_EFFORT must be one of: ${REASONING_EFFORTS.join(", ")}.`,
      500
    );
  }
  return {
    apiKey,
    model,
    reasoningEffort: reasoningEffort as ReasoningEffort,
  };
}
