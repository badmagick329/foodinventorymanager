import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { listFoods } from "@/server/inventory/foods";
import { listShoppingItems } from "@/server/inventory/shopping";
import { todayIsoDate } from "@/server/inventory/expiry";
import { registerInventoryTools } from "./inventory-tools";
import { registerHistoryTools } from "./history-tools";
import { registerReceiptTools, registerShoppingTools } from "./shopping-tools";
import { presentFood } from "./results";

const INSTRUCTIONS = `Household food inventory for one home.

- Items have a name, amount, unit (g, kg, ml, l, or unit = a count of packs), storage (fridge, freezer, pantry, spices) and an optional expiry date (YYYY-MM-DD).
- The same food can have several entries, e.g. with different expiry dates or storage. Look items up with list_foods (search filter) before changing them, and use their ids.
- When the user used part of something, call use_food. When something is finished, thrown away or was entered by mistake, call remove_foods with the matching reason; ask if the reason is unclear. History keeps a record of both.
- To freeze or relocate food use move_food (it can split off a portion).
- Changes apply immediately. Ask the user before destructive or bulk changes (removing several items, merging entries, clearing the shopping list).
- Amounts in different units are never converted; keep the item's unit.`;

export function createInventoryMcpServer() {
  const server = new McpServer(
    { name: "foodinventory", version: "1.0.0" },
    { instructions: INSTRUCTIONS }
  );

  registerInventoryTools(server);
  registerHistoryTools(server);
  registerShoppingTools(server);
  registerReceiptTools(server);

  server.registerResource(
    "inventory",
    "foodinventory://inventory",
    {
      title: "Current inventory",
      description: "Every item in stock with its expiry status.",
      mimeType: "application/json",
    },
    async (uri) => {
      const today = todayIsoDate();
      const foods = (await listFoods()).map((food) => presentFood(food, today));
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ today, foods }),
          },
        ],
      };
    }
  );

  server.registerResource(
    "shopping-list",
    "foodinventory://shopping-list",
    {
      title: "Shopping list",
      description: "Everything on the shopping list.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(await listShoppingItems()),
        },
      ],
    })
  );

  server.registerPrompt(
    "use_it_up",
    {
      title: "Meals from expiring food",
      description:
        "Suggest meals that use food which is expired or expiring soon.",
      argsSchema: z.object({
        meals: z.string().optional().describe("How many meal ideas, e.g. 3."),
      }),
    },
    ({ meals }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Call expiry_report with within_days 7 and list_foods. Suggest ${meals || "3"} realistic meals that use the soonest-expiring food first. For each meal list what I already have and what is missing, then offer to add missing ingredients with add_shopping_items. Mention anything already expired so I can check it before use.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "waste_review",
    {
      title: "Food waste review",
      description: "Review what was thrown away over a period.",
      argsSchema: z.object({
        since: z
          .string()
          .optional()
          .describe("Start date YYYY-MM-DD; defaults to 30 days ago."),
      }),
    },
    ({ since }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review my food waste${since ? ` since ${since}` : " over the last 30 days"}. Use history_summary and list_history with reason discarded. Point out foods I repeatedly throw away and suggest buying less of them or freezing them sooner.`,
          },
        },
      ],
    })
  );

  return server;
}
