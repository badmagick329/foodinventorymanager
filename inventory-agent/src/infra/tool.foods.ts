export type FoodItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  storage: string;
};
import type { Tool, ToolCall } from "../core/agent";

const apiUrl = process.env.API_BASE_URL;

export async function listFoods(): Promise<FoodItem[]> {
  if (!apiUrl) {
    throw new Error("API_BASE_URL not set");
  }
  const result = await fetch(apiUrl);
  if (!result.ok) {
    console.error("Failed to fetch food list");
    throw new Error(`API error ${result.status}: ${await result.text()}`);
  }

  try {
    const foods = (await result.json()) as FoodItem[];
    return foods;
  } catch (e) {
    console.error("Failed to parse food list", e);
    throw e;
  }
}

export function identifyItemsToDelete(toolCall: ToolCall) {
  const args =
    typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  const itemIds: number[] = args.item_ids || [];
  const reason: string = args.reason || "No reason provided";
  return {
    itemIds,
    reason,
  };
}
