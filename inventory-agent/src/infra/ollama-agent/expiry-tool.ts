import { listFoods } from "../tool.foods";
import { checkExpiry } from "./expiry-checker";
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

const SYSTEM_PROMPT = [
  "You are an assistant that reports on expired and expiring food items.",
  "The user will provide you with data about expired and expiring foods.",
  "Your job is to present this information in a clear, user-friendly way.",
  "Be concise and helpful. Suggest using expired items first or discarding them if too far gone.",
  "For expiring soon items, remind the user to use them within the next few days.",
].join(" ");

export async function handleExpiryQuery(instruction: string): Promise<string> {
  const foods = await listFoods();

  const { expired, expiringSoon, fresh } = checkExpiry(foods);

  const summary = {
    expired: expired.map((f) => ({
      name: f.name,
      quantity: f.quantity,
      unit: f.unit,
      storage: f.storage,
      expiry: f.expiry,
      daysOverdue: Math.abs(f.daysUntilExpiry || 0),
    })),
    expiringSoon: expiringSoon.map((f) => ({
      name: f.name,
      quantity: f.quantity,
      unit: f.unit,
      storage: f.storage,
      expiry: f.expiry,
      daysUntilExpiry: f.daysUntilExpiry,
    })),
    totalItems: foods.length,
    freshItems: fresh.length,
  };

  const messages: AgentMsg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `User question: "${instruction}"\n\nExpiry data:\n${JSON.stringify(
        summary,
        null,
        2
      )}`,
    },
  ];

  const resp = await ollamaChat({ messages });
  return resp.message.content?.trim() || "";
}
