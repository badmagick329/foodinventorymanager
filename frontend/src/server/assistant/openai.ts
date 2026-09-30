import type { AssistantSettings } from "./config";
import { PROPOSE_ACTION_TOOL } from "./action-tool";

type ResponsesEvent = {
  type?: string;
  delta?: string;
  response?: {
    output?: Array<{ type?: string; name?: string; arguments?: string }>;
    usage?: unknown;
  };
  error?: { message?: string };
};

export class AssistantUnavailableError extends Error {}

/**
 * Streams one Responses API turn, forwarding text deltas as they arrive, and
 * returns the full reply plus the proposed-action tool arguments, if any.
 */
export async function streamAssistantResponse({
  settings,
  systemPrompt,
  message,
  onDelta,
}: {
  settings: AssistantSettings;
  systemPrompt: string;
  message: string;
  onDelta: (delta: string) => void;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      reasoning: { effort: settings.reasoningEffort },
      stream: true,
      tools: [PROPOSE_ACTION_TOOL],
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        { role: "user", content: [{ type: "input_text", text: message }] },
      ],
    }),
  });
  if (!response.ok || !response.body) {
    console.error(
      "OpenAI response failed",
      response.status,
      await response.text()
    );
    throw new AssistantUnavailableError(
      "The assistant is temporarily unavailable."
    );
  }

  let reply = "";
  let completed: ResponsesEvent["response"];
  for await (const data of readServerSentData(response.body)) {
    if (data === "[DONE]") continue;
    const event = JSON.parse(data) as ResponsesEvent;
    if (event.type === "response.output_text.delta" && event.delta) {
      reply += event.delta;
      onDelta(event.delta);
    }
    if (event.type === "response.completed") completed = event.response;
    if (event.type === "error") {
      throw new Error(event.error?.message ?? "OpenAI streaming error");
    }
  }

  const toolCall = completed?.output?.find(
    (item) =>
      item.type === "function_call" && item.name === PROPOSE_ACTION_TOOL.name
  );
  return { reply, toolArguments: toolCall?.arguments, usage: completed?.usage };
}

async function* readServerSentData(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  while (true) {
    const { value, done } = await reader.read();
    pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const blocks = pending.split("\n\n");
    pending = done ? "" : (blocks.pop() ?? "");
    for (const block of blocks) {
      const data = block
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6);
      if (data) yield data;
    }
    if (done) return;
  }
}
