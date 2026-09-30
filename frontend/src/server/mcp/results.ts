import type { CallToolResult } from "@modelcontextprotocol/server";
import type { Food } from "@prisma/client";
import { AppError } from "@/server/errors";
import { describeExpiry } from "@/server/inventory/expiry";

/** Items expiring within this many days are "expiring_soon", matching the UI. */
export const EXPIRING_SOON_DAYS = 3;

export function presentFood(food: Food, today: string) {
  return {
    id: food.id,
    name: food.name,
    amount: food.amount,
    unit: food.unit,
    storage: food.storage,
    expiry: food.expiry,
    ...describeExpiry(food.expiry, today, EXPIRING_SOON_DAYS),
  };
}

function textResult(text: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text }], ...(isError && { isError }) };
}

/**
 * Runs a tool body and turns its outcome into a tool result. Expected
 * failures come back as `isError` results with the service's message so the
 * agent can correct itself; anything else is logged and reported generically.
 */
export function toolHandler<Args>(handler: (args: Args) => Promise<unknown>) {
  return async (args: Args): Promise<CallToolResult> => {
    try {
      return textResult(JSON.stringify(await handler(args)));
    } catch (error) {
      if (error instanceof AppError) return textResult(error.message, true);
      console.error("MCP tool failed", error);
      return textResult("Unexpected server error. Try again later.", true);
    }
  };
}
