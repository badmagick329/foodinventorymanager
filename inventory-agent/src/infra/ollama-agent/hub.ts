import { handleInventoryQuery } from "./inventory-tool";
import { handleExpiryQuery } from "./expiry-tool";
import type { AgentMsg } from "../../core/agent";
import type { ConfirmationPort } from "../../core/confirmation";
import {
  createDeletionPlan,
  executeDeletion,
  handleDeletionQuery,
} from "./delete-tool";
import { ollamaChat } from "./helpers";
import { listFoods } from "../tool.foods";

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
  "Choose 'delete' if the question is about:",
  "- Removing / Deleting one or more item from the invetory",
  "",
  "Choose 'inventory' for all other questions about:",
  "- How much of an item they have",
  "- What items are in storage",
  "- Quantities and locations",
  "- General food inventory queries",
  "",
  "Respond with ONLY one word: either 'expiry' or 'delete' or 'inventory'.",
].join("\n");

async function routeQuery(
  instruction: string
): Promise<"expiry" | "delete" | "inventory"> {
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
  if (response.includes("delete")) {
    return "delete";
  }
  return "inventory";
}

async function answerInstruction(
  instruction: string,
  options?: {
    confirmationPort?: ConfirmationPort;
    sourceId?: string;
  }
) {
  const route = await routeQuery(instruction);

  let answer: string;

  switch (route) {
    case "delete":
      console.log("[hub] Delegating to delete-tool");
      answer = await handleDeletionQuery(
        instruction,
        options?.sourceId,
        options?.confirmationPort
      );
      break;
    case "expiry":
      console.log("[hub] Delegating to expiry-tool");
      answer = await handleExpiryQuery(instruction);
      break;
    case "inventory":
      console.log("[hub] Delegating to inventory-tool");
      answer = await handleInventoryQuery(instruction);
      break;
    default:
      console.error(
        `[hub] Unknown route: ${route}, defaulting to inventory-tool`
      );
      answer = await handleInventoryQuery(instruction);
      break;
  }

  return { answer };
}

export { answerInstruction };
