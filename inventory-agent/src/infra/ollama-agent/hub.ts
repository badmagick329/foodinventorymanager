import { handleInventoryQuery } from "./inventory-tool";
import { handleExpiryQuery } from "./expiry-tool";
import type { AgentMsg } from "../../core/agent";
import type { ConfirmationPort } from "../../core/confirmation";
import { createDeletionPlan, executeDeletion } from "./delete-tool";
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

  if (route === "expiry") {
    console.log("[hub] Delegating to expiry-tool");
    answer = await handleExpiryQuery(instruction);
  } else if (route === "delete") {
    console.log("[hub] Delete selected");
    const foodList = await listFoods();
    const plan = await createDeletionPlan(instruction, foodList);

    if (plan.itemsToDelete.length === 0) {
      answer = plan.confirmationText;
    } else if (options?.confirmationPort && options?.sourceId) {
      await options.confirmationPort.requestConfirmation({
        sourceId: options.sourceId,
        message: plan.confirmationText,
        items: plan.itemsToDelete,
        onConfirm: async () => {
          const result = await executeDeletion(
            plan.itemsToDelete.map((item) => item.id)
          );
          console.log(
            `[hub] Deletion ${result.success ? "succeeded" : "failed"}:`,
            result
          );
          await options.confirmationPort?.sendResult({
            sourceId: options.sourceId!,
            text: `🗑️ Deletion ${result.success ? "succeeded" : "failed"}`,
          });
        },
      });
      answer = "";
    } else {
      answer = plan.confirmationText;
    }
  } else {
    console.log("[hub] Delegating to inventory-tool");
    answer = await handleInventoryQuery(instruction);
  }

  return { answer };
}

export { answerInstruction };
