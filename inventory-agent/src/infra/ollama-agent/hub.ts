import { handleInventoryQuery } from "./inventory-tool";
import { handleExpiryQuery } from "./expiry-tool";
import type { AgentChatParams, AgentMsg, ChatResp } from "../../core/agent";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/chat";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";

async function ollamaChat({ messages }: AgentChatParams) {
  const body = {
    model: MODEL,
    stream: false,
    messages,
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

const ROUTER_SYSTEM_PROMPT = [
  "You are a routing assistant that categorizes user questions about food inventory.",
  "Analyze the user's question and determine which tool should handle it:",
  "",
  "Choose 'expiry' if the question is about:",
  "- Which items have expired or are expiring",
  "- Expiration dates or shelf life",
  "- What needs to be used soon",
  "- What has gone bad",
  "",
  "Choose 'inventory' for all other questions about:",
  "- How much of an item they have",
  "- What items are in storage",
  "- Quantities and locations",
  "- General food inventory queries",
  "",
  "Respond with ONLY one word: either 'expiry' or 'inventory'.",
].join("\n");

async function routeQuery(
  instruction: string
): Promise<"expiry" | "inventory"> {
  const messages: AgentMsg[] = [
    {
      role: "system",
      content: ROUTER_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: instruction,
    },
  ];

  const resp = await ollamaChat({ messages });
  const response = resp.message.content?.trim().toLowerCase() || "";

  console.log(
    `[hub] Routing decision: "${response}" for query: "${instruction}"`
  );

  if (response.includes("expiry")) {
    return "expiry";
  }
  return "inventory";
}

async function answerInstruction(instruction: string) {
  const route = await routeQuery(instruction);

  let answer: string;
  if (route === "expiry") {
    console.log("[hub] Delegating to expiry-tool");
    answer = await handleExpiryQuery(instruction);
  } else {
    console.log("[hub] Delegating to inventory-tool");
    answer = await handleInventoryQuery(instruction);
  }

  return { answer };
}

export { answerInstruction };
