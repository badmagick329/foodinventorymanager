import type { AgentMsg, Tool } from "../../core/agent";
import type { ConfirmationPort } from "../../ports/confirmation";
import { identifyItemsToDelete, listFoods, type FoodItem } from "../tool.foods";
import { ollamaChat } from "./helpers";

export type DeletionPlan = {
  itemsToDelete: FoodItem[];
  reason: string;
  planResponse: string;
};

const toolV1 = {
  type: "function",
  function: {
    name: "identify_items_to_delete",
    description:
      "Identify which food items match the user's deletion request based on name, expiry date, storage location, or other criteria.",
    parameters: {
      type: "object",
      properties: {
        item_ids: {
          type: "array",
          items: { type: "number" },
          description:
            "Array of food item IDs that match the deletion criteria",
        },
        reason: {
          type: "string",
          description:
            "Brief explanation of why these items were selected for deletion",
        },
      },
      required: ["item_ids", "reason"],
    },
  },
};

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "includes_texts",
      description:
        "Identify which food items match the user's deletion request based on whether their names include any of the provided text strings, optionally filtered by storage location.",
      parameters: {
        type: "object",
        properties: {
          texts: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of text strings to match against food item names",
          },
          storage: {
            type: "string",
            description:
              "Storage location to filter by (fridge, pantry, freezer, any)",
          },
        },
        required: ["texts", "storage"],
      },
    },
  },
];

const SYSTEM_PROMPT = [
  "You are an assistant that helps users identify food items to delete from their inventory.",
  "You have access to a tool `identify_items_to_delete` that marks items for deletion by ID.",
  "When the user asks to delete items (e.g., 'delete expired milk', 'remove items in the fridge', 'delete the bread'),",
  "analyze the provided food list and identify matching items based on:",
  "- Name (case-insensitive, partial matches acceptable)",
  "- Expiry date (if they mention 'expired' or specific dates)",
  "- Storage location (fridge, pantry, freezer, etc.)",
  "- Quantity or unit criteria",
  "If multiple items match, include all of them.",
  "If no items match, call the tool with an empty array and explain why nothing was found.",
  "Be precise in your reasoning about why each item was selected.",
].join(" ");

const SYSTEM_PROMPT_V2 = [
  "You are an assistant that helps users identify food items to delete from their inventory.",
  "You have access to a tool called `includes_texts`. ",
  "This will mark food items for deletion by IDs which include any of the strings in the list of strings you provide it.",
  "You can also narrow down the search by storage location if specified by user.",
  "Read the user query carefully then decide which terms you should filter the food items by.",
  "Storage location options are: (fridge, pantry, freezer, any). Pick any if the user hasn't specified a storage location.",
  "Examples:",
  "User: Remove all chicken.",
  "You call the tool with ['chicken'] as list of strings and 'any' as storage location.",
  "---",
  "User: Remove chicken in fridge.",
  "You call the tool with ['chicken'] as list of strings and 'fridge' as storage location.",
  "---",
  "User: Remove carrots and bannanas.",
  "You call the tool with ['bannana', 'carrot'] as list of strings and 'any' as storage location.",
].join(" ");

export async function createDeletionPlan(
  instruction: string,
  foodList: FoodItem[]
): Promise<DeletionPlan> {
  const messages: AgentMsg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT_V2,
    },
    { role: "user", content: instruction },
  ];

  const resp = await ollamaChat({ messages, tools });

  if (resp.message.tool_calls && resp.message.tool_calls.length > 0) {
    console.log(`[delete-tool] ${JSON.stringify(resp.message)}`);

    const toolCall = resp.message.tool_calls[0];
    if (toolCall?.function.name === "includes_texts") {
      const args = toolCall.function.arguments as {
        texts: string[];
        storage: string;
      };
      const filteredItems = foodList.filter((item) => {
        const nameMatch = args.texts.some((text) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        );
        const storageMatch =
          args.storage === "any" ||
          item.storage.toLowerCase() === args.storage.toLowerCase();
        return nameMatch && storageMatch;
      });
      const itemIds = filteredItems.map((item) => item.id);

      const itemsToDelete = foodList.filter((item) =>
        itemIds.includes(item.id)
      );
      const reason = `Searched with ${JSON.stringify(args.texts)} in storage: ${
        args.storage
      }`;

      if (itemsToDelete.length === 0) {
        return {
          itemsToDelete: [],
          reason,
          planResponse: `❌ No items found matching your request.\n\n${reason}`,
        };
      }

      const itemList = itemsToDelete
        .map(
          (item) =>
            `- **${item.name}** (${item.quantity} ${item.unit}, ${
              item.storage
            }${
              item.expiry
                ? `, expires: ${new Date(item.expiry).toLocaleDateString()}`
                : ""
            })`
        )
        .join("\n");

      const confirmationText = [
        `🗑️ **Delete Confirmation**\n`,
        `Found **${itemsToDelete.length}** item(s) matching your request:`,
        `"${instruction}"\n`,
        itemList,
        `\n📝 Reason: ${reason}\n`,
        `**Are you sure you want to delete ${
          itemsToDelete.length === 1 ? "this item" : "these items"
        }?**`,
      ].join("\n");

      return {
        itemsToDelete,
        reason,
        planResponse: confirmationText,
      };
    }
  }

  return {
    itemsToDelete: [],
    reason: "Unable to process deletion request",
    planResponse:
      "❌ I couldn't understand your deletion request. Please try rephrasing.",
  };
}

export async function createDeletionPlanV1(
  instruction: string,
  foodList: FoodItem[]
): Promise<DeletionPlan> {
  const messages: AgentMsg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT_V2,
    },
    {
      role: "system",
      content: `Here is the current list of food items:\n${JSON.stringify(
        foodList,
        null,
        2
      )}`,
    },
    { role: "user", content: instruction },
  ];

  const resp = await ollamaChat({ messages, tools });

  if (resp.message.tool_calls && resp.message.tool_calls.length > 0) {
    console.log(`[delete-tool] ${JSON.stringify(resp.message)}`);

    const toolCall = resp.message.tool_calls[0];
    if (toolCall?.function.name === "identify_items_to_delete") {
      const { itemIds, reason } = identifyItemsToDelete(toolCall);

      const itemsToDelete = foodList.filter((item) =>
        itemIds.includes(item.id)
      );

      if (itemsToDelete.length === 0) {
        return {
          itemsToDelete: [],
          reason,
          planResponse: `❌ No items found matching your request.\n\n${reason}`,
        };
      }

      const itemList = itemsToDelete
        .map(
          (item) =>
            `- **${item.name}** (${item.quantity} ${item.unit}, ${
              item.storage
            }${
              item.expiry
                ? `, expires: ${new Date(item.expiry).toLocaleDateString()}`
                : ""
            })`
        )
        .join("\n");

      const confirmationText = [
        `🗑️ **Delete Confirmation**\n`,
        `Found **${itemsToDelete.length}** item(s) matching your request:`,
        `"${instruction}"\n`,
        itemList,
        `\n📝 Reason: ${reason}\n`,
        `**Are you sure you want to delete ${
          itemsToDelete.length === 1 ? "this item" : "these items"
        }?**`,
      ].join("\n");

      return {
        itemsToDelete,
        reason,
        planResponse: confirmationText,
      };
    }
  }

  return {
    itemsToDelete: [],
    reason: "Unable to process deletion request",
    planResponse:
      "❌ I couldn't understand your deletion request. Please try rephrasing.",
  };
}

export async function executeDeletion(itemIds: number[]): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return {
      success: false,
      deletedCount: 0,
      error: "API_BASE_URL not configured",
    };
  }

  const deleteUrls = [] as string[];

  itemIds.forEach((id) => {
    deleteUrls.push(`${apiUrl}/${id}`);
  });
  let deletedCount = 0;
  const errors = [] as string[];

  for (const url of deleteUrls) {
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      errors.push(`API error ${response.status}: ${errorText}`);
    } else {
      deletedCount++;
    }
  }

  return {
    success: errors.length === 0,
    deletedCount,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}

export async function handleDeletionQuery(
  instruction: string,
  sourceId?: string,
  confirmationPort?: ConfirmationPort
): Promise<string> {
  const foodList = await listFoods();
  const plan = await createDeletionPlan(instruction, foodList);

  if (plan.itemsToDelete.length === 0) {
    return plan.planResponse;
  }

  if (confirmationPort && sourceId) {
    await confirmationPort.requestConfirmation({
      sourceId: sourceId,
      message: plan.planResponse,
      items: plan.itemsToDelete,
      onConfirm: async () => {
        const result = await executeDeletion(
          plan.itemsToDelete.map((item) => item.id)
        );
        console.log(
          `[hub] Deletion ${result.success ? "succeeded" : "failed"}:`,
          result
        );
        await confirmationPort?.sendResult({
          sourceId: sourceId!,
          text: `🗑️ Deletion ${result.success ? "succeeded" : "failed"}`,
        });
      },
    });
    return "";
  }

  return plan.planResponse;
}
