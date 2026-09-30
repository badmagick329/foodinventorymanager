import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  addShoppingItems,
  clearShoppingList,
  listShoppingItems,
  removeShoppingItem,
} from "@/server/inventory/shopping";
import { InvalidInputError } from "@/server/errors";
import processPdf from "@/receipt-reader/reader";
import { toolHandler } from "./results";
import { id } from "./schemas";

/** Ocado receipts are a few hundred KB; this only guards against abuse. */
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export function registerShoppingTools(server: McpServer) {
  server.registerTool(
    "list_shopping",
    {
      title: "List shopping list",
      description: "List everything on the shopping list.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async () => ({ items: await listShoppingItems() }))
  );

  server.registerTool(
    "add_shopping_items",
    {
      title: "Add to shopping list",
      description:
        "Add items to the shopping list. Names already on the list are skipped and reported in alreadyListed. A name may include a product URL.",
      inputSchema: z.object({
        names: z.array(z.string().trim().min(1)).min(1).max(100),
      }),
    },
    toolHandler(({ names }) => addShoppingItems(names))
  );

  server.registerTool(
    "remove_shopping_item",
    {
      title: "Remove from shopping list",
      description: "Remove one item from the shopping list by id.",
      inputSchema: z.object({ id }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    toolHandler(async ({ id }) => {
      await removeShoppingItem(id);
      return { removed: id };
    })
  );

  server.registerTool(
    "clear_shopping_list",
    {
      title: "Clear shopping list",
      description:
        "Remove every item from the shopping list. Confirm with the user first.",
      inputSchema: z.object({}),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    toolHandler(async () => ({ removed: await clearShoppingList() }))
  );
}

export function registerReceiptTools(server: McpServer) {
  server.registerTool(
    "parse_receipt",
    {
      title: "Read an Ocado receipt",
      description:
        "Extract food items (name, amount, unit, storage, expiry) from an Ocado receipt PDF. Nothing is saved: review the items with the user, then call add_foods.",
      inputSchema: z.object({
        pdf_base64: z
          .string()
          .min(1)
          .describe("The receipt PDF, base64 encoded."),
      }),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async ({ pdf_base64 }) => {
      const pdf = Buffer.from(pdf_base64, "base64");
      if (pdf.length === 0 || pdf.length > MAX_RECEIPT_BYTES) {
        throw new InvalidInputError("Provide a base64 PDF of up to 10 MB.");
      }
      try {
        const items = await processPdf(pdf);
        return { count: items.length, items };
      } catch (error) {
        console.error(error);
        throw new InvalidInputError("Could not read that receipt PDF.");
      }
    })
  );
}
