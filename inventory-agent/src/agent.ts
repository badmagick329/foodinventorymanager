import { listFoods } from "./tool.foods";
import type { FoodItem } from "./tool.foods";

type Msg =
  | { role: "system" | "user" | "assistant"; content: string }
  // Ollama accepts a 'tool' role to return tool outputs
  | { role: "tool"; content: string; name: string };

type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

type ToolCall = {
  function: { name: string; arguments?: Record<string, unknown> };
};

type ChatResp = {
  message: {
    role: "assistant";
    content: string;
    tool_calls?: ToolCall[];
  };
  done: boolean;
};

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
        properties: {}, // no params needed for this
        additionalProperties: false,
      },
    },
  },
];

async function ollamaChat(messages: Msg[], { tools }: { tools?: Tool[] } = {}) {
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

export const SYSTEM_PROMPT = [
  "You are an assistant that answers questions about quantities of foods the user has.",
  "You have access to a tool `list_foods` that returns a JSON array of items with keys:",
  "name (string), amount (number), unit (string), expiry (ISO string or null), storage (string).",
  "When the user asks about an item (e.g., 'how much milk do I have?'), you SHOULD call `list_foods`,",
  "sum quantities for matching item names (case-insensitive), report the total + unit,",
  "mention the soonest expiry date for that item if present, and list storage location of the items.",
  "If the item is not found, say so clearly.",
  "Be concise and factual.",
  "When asked about which items have expired, DO NOT TRY TO ANSWER THIS.",
  "You do not have the tool for calculating this yet. Tell the user that you cannot do this yet!",
].join(" ");

export async function answerInstruction(instruction: string) {
  const messages: Msg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    { role: "user", content: instruction },
  ];

  let resp = await ollamaChat(messages, { tools });

  // If it called a tool:
  if (resp.message.tool_calls && resp.message.tool_calls.length > 0) {
    console.log(`[model] ${JSON.stringify(resp.message)}`);
    messages.push(resp.message); // include the model's tool_calls message

    for (const call of resp.message.tool_calls) {
      if (call.function.name === "list_foods") {
        const items: FoodItem[] = await listFoods();

        // Ollama's docs: provide tool results via messages with the 'tool' role.
        messages.push({
          role: "tool",
          name: "list_foods",
          content: JSON.stringify({ items }),
        });
      } else {
        // Unknown tool - reply with an error payload so the model can handle it.
        messages.push({
          role: "tool",
          name: call.function.name,
          content: JSON.stringify({ error: "Unknown tool" }),
        });
      }
    }

    // ask the model to use the tool outputs and craft the final answer
    resp = await ollamaChat(messages);
  }

  return {
    answer: resp.message.content?.trim() || "",
  };
}
