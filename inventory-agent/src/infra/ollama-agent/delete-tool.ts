import type { AgentMsg, Tool } from "../../core/agent";
import { identifyItemsToDelete, listFoods, type FoodItem } from "../tool.foods";
import { ollamaChat } from "./helpers";

export type DeletionPlan = {
  itemsToDelete: FoodItem[];
  reason: string;
  confirmationText: string;
};

const tools: Tool[] = [
  {
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

export async function createDeletionPlan(
  instruction: string,
  foodList: FoodItem[]
): Promise<DeletionPlan> {
  const messages: AgentMsg[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
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
          confirmationText: `❌ No items found matching your request.\n\n${reason}`,
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
        confirmationText,
      };
    }
  }

  return {
    itemsToDelete: [],
    reason: "Unable to process deletion request",
    confirmationText:
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
