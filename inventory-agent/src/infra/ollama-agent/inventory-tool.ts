import { listFoods } from "../tool.foods";
import type { FoodItem } from "../tool.foods";
import type {
  AgentChatParams,
  Tool,
  ChatResp,
  AgentMsg,
} from "../../core/agent";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/chat";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "list_foods",
      description:
        "Return the current list of food items with name, quantity, unit, expiry, and storage location.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

async function ollamaChat({ messages, tools }: AgentChatParams) {
  const body: any = {
    model: MODEL,
    stream: false,
    messages,
  };
  if (tools) body.tools = tools;

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
  "You are an assistant that answers questions about quantities of foods the user has.",
  "You have access to a tool `list_foods` that returns a JSON array of items with keys:",
  "name (string), quantity (number), unit (string), expiry (ISO string or null), storage (string).",
  "When the user asks about an item (e.g., 'how much milk do I have?'), you SHOULD call `list_foods`,",
  "sum quantities for matching item names (case-insensitive), report the total + unit,",
  "mention the soonest expiry date for that item if present, and list storage location of the items.",
  "If the item is not found, say so clearly.",
  "Be concise and factual.",
].join(" ");

export async function handleInventoryQuery(
  instruction: string
): Promise<string> {
  const messages: AgentMsg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    { role: "user", content: instruction },
  ];

  let resp = await ollamaChat({ messages, tools });

  // If it called a tool:
  if (resp.message.tool_calls && resp.message.tool_calls.length > 0) {
    console.log(`[inventory-tool] ${JSON.stringify(resp.message)}`);
    messages.push(resp.message);

    for (const call of resp.message.tool_calls) {
      if (call.function.name === "list_foods") {
        const items: FoodItem[] = await listFoods();

        messages.push({
          role: "tool",
          name: "list_foods",
          content: JSON.stringify({ items }),
        });
      } else {
        messages.push({
          role: "tool",
          name: call.function.name,
          content: JSON.stringify({ error: "Unknown tool" }),
        });
      }
    }

    resp = await ollamaChat({ messages });
  }

  return resp.message.content?.trim() || "";
}
