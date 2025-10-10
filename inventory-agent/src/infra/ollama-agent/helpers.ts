import type { AgentChatParams, ChatResp } from "../../core/agent";

const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/chat";

export async function ollamaChat({ messages, tools }: AgentChatParams) {
  const body = {
    model: MODEL,
    stream: false,
    messages,
    tools: tools,
  };

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as ChatResp;
  return json;
}
