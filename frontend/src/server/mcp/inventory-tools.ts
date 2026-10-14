import type { McpServer } from "@modelcontextprotocol/server";
import { FoodRemovalSource } from "@prisma/client";
import { z } from "zod";
import {
  createFoods,
  getFood,
  listFoods,
  moveFood,
  removeFoods,
  updateFood,
  useFoodAmount,
} from "@/server/inventory/foods";
import {
  consolidateAllMatchingFoods,
  consolidateSelectedFoods,
  findConsolidationCandidates,
} from "@/server/inventory/consolidation";
import { todayIsoDate } from "@/server/inventory/expiry";
import { InvalidInputError } from "@/server/errors";
import { EXPIRING_SOON_DAYS, presentFood, toolHandler } from "./results";
import {
  amount,
  expiryDate,
  id,
  removalReason,
  storage,
  unit,
} from "./schemas";

const source = FoodRemovalSource.mcp;

const newFood = z.object({
  name: z.string().trim().min(1),
  amount,
  unit,
  storage,
  expiry: expiryDate
    .nullable()
    .optional()
    .describe("YYYY-MM-DD, or null/omitted when it has no expiry date."),
});

export function registerInventoryTools(server: McpServer) {
  server.registerTool(
    "list_foods",
    {
      title: "List food inventory",
      description:
        "List food currently in stock, soonest expiry first. Each food includes daysUntilExpiry and a status (expired, expiring_soon, fresh, no_expiry). Use the filters to narrow large inventories.",
      inputSchema: z.object({
        storage: z
          .array(storage)
          .optional()
          .describe("Only foods kept in these storage locations."),
        search: z
          .string()
          .optional()
          .describe("Case-insensitive text the food name must contain."),
        expiring_within_days: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe(
            "Only foods that expire within this many days from today, including already expired foods."
          ),
      }),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async ({ storage, search, expiring_within_days }) => {
      const today = todayIsoDate();
      const needle = search?.trim().toLowerCase();
      const foods = (await listFoods())
        .map((food) => presentFood(food, today))
        .filter(
          (food) =>
            (!storage?.length || storage.includes(food.storage)) &&
            (!needle || food.name.toLowerCase().includes(needle)) &&
            (expiring_within_days === undefined ||
              (food.daysUntilExpiry !== null &&
                food.daysUntilExpiry <= expiring_within_days))
        );
      return { today, count: foods.length, foods };
    })
  );

  server.registerTool(
    "get_food",
    {
      title: "Get food",
      description: "Get one food by id.",
      inputSchema: z.object({ id }),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async ({ id }) =>
      presentFood(await getFood(id), todayIsoDate())
    )
  );

  server.registerTool(
    "expiry_report",
    {
      title: "Expiry report",
      description:
        "Summarise what has expired and what expires soon, so food can be used before it is wasted.",
      inputSchema: z.object({
        within_days: z
          .number()
          .int()
          .min(0)
          .default(EXPIRING_SOON_DAYS)
          .describe("How many days ahead counts as expiring soon."),
      }),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async ({ within_days }) => {
      const today = todayIsoDate();
      const foods = (await listFoods()).map((food) => presentFood(food, today));
      const expired = foods.filter((food) => food.status === "expired");
      const expiringSoon = foods.filter(
        (food) =>
          food.daysUntilExpiry !== null &&
          food.daysUntilExpiry >= 0 &&
          food.daysUntilExpiry <= within_days
      );
      return {
        today,
        withinDays: within_days,
        expired,
        expiringSoon,
        itemsInStock: foods.length,
        itemsWithoutExpiry: foods.filter((food) => food.status === "no_expiry")
          .length,
      };
    })
  );

  server.registerTool(
    "add_foods",
    {
      title: "Add foods",
      description:
        "Add one or more new foods to the inventory. All are added or none are. Returns the created foods with their ids. Check list_foods first to avoid adding a duplicate of something already in stock; prefer update_food to change an existing food's amount.",
      inputSchema: z.object({ items: z.array(newFood).min(1).max(100) }),
    },
    toolHandler(async ({ items }) => {
      const today = todayIsoDate();
      const created = await createFoods(items);
      return { created: created.map((food) => presentFood(food, today)) };
    })
  );

  server.registerTool(
    "update_food",
    {
      title: "Update food",
      description:
        "Change fields of an existing food. Only the fields given are changed. Lowering the amount (same unit) records the difference as used (reason consumed) in history; use use_food when the user says they used some of a food, and move_food to change storage.",
      inputSchema: z.object({
        id,
        name: z.string().trim().min(1).optional(),
        amount: amount.optional(),
        unit: unit.optional(),
        storage: storage.optional(),
        expiry: expiryDate
          .nullable()
          .optional()
          .describe("New expiry as YYYY-MM-DD, or null to clear it."),
      }),
      annotations: { idempotentHint: true },
    },
    toolHandler(async ({ id, ...changes }) => {
      if (Object.values(changes).every((value) => value === undefined)) {
        throw new InvalidInputError("Provide at least one field to change.");
      }
      return presentFood(await updateFood(id, changes, source), todayIsoDate());
    })
  );

  server.registerTool(
    "use_food",
    {
      title: "Use some of a food",
      description:
        "Record that an amount of a food was used (in the food's own unit). The used amount is logged in history with reason consumed. Using the whole remaining amount or more removes the food.",
      inputSchema: z.object({
        id,
        amount: amount.describe("How much was used, in the food's unit."),
      }),
    },
    toolHandler(async ({ id, amount }) => {
      const result = await useFoodAmount(id, { amount }, source);
      return {
        usedAmount: result.usedAmount,
        removed: result.remainingFood === null,
        remainingFood:
          result.remainingFood &&
          presentFood(result.remainingFood, todayIsoDate()),
      };
    })
  );

  server.registerTool(
    "remove_foods",
    {
      title: "Remove foods",
      description:
        "Remove whole foods from the inventory and record why in history. If the reason is unclear, ask the user before calling. Fails without removing anything if any id no longer exists.",
      inputSchema: z.object({
        ids: z.array(id).min(1),
        reason: removalReason,
      }),
      annotations: { destructiveHint: true },
    },
    toolHandler(async ({ ids, reason }) => {
      const removed = await removeFoods(ids, reason, source);
      return {
        removed: removed.map((food) => ({
          id: food.id,
          name: food.name,
          amount: food.amount,
          unit: food.unit,
        })),
        reason,
      };
    })
  );

  server.registerTool(
    "move_food",
    {
      title: "Move food to another storage",
      description:
        "Move a food to another storage location, e.g. freezing something. Without amount (or with the full amount) all of it moves. With a smaller amount only that portion moves and becomes a new food. Optionally set the moved food's new expiry.",
      inputSchema: z.object({
        id,
        storage,
        amount: amount
          .optional()
          .describe("Portion to move, in the food's unit. Omit to move all."),
        expiry: expiryDate
          .nullable()
          .optional()
          .describe(
            "Expiry for the moved food (YYYY-MM-DD or null). Omit to keep the current expiry."
          ),
      }),
    },
    toolHandler(async ({ id, ...move }) => {
      const today = todayIsoDate();
      const { sourceFood, movedFood } = await moveFood(id, move, source);
      return {
        movedFood: presentFood(movedFood, today),
        remainingSourceFood: sourceFood && presentFood(sourceFood, today),
      };
    })
  );

  server.registerTool(
    "list_consolidation_candidates",
    {
      title: "Find duplicate foods",
      description:
        "Find groups of duplicate foods (same name, unit, storage and expiry) that could be consolidated into one.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async () => ({ groups: await findConsolidationCandidates() }))
  );

  server.registerTool(
    "consolidate_foods",
    {
      title: "Consolidate specific foods",
      description:
        "Consolidate two or more foods with the same name, unit and storage into one, summing their amounts. The kept food takes the earliest expiry. Foods with different expiry dates are only consolidated when allow_different_expiry is true.",
      inputSchema: z.object({
        ids: z.array(id).min(2),
        keep_id: id
          .optional()
          .describe("Entry to keep; defaults to the lowest id."),
        allow_different_expiry: z.boolean().default(false),
      }),
      annotations: { destructiveHint: true },
    },
    toolHandler(async ({ ids, keep_id, allow_different_expiry }) => {
      const { updatedFood, removedFoodIds } = await consolidateSelectedFoods(
        ids,
        { primaryFoodId: keep_id, allowDifferentExpiry: allow_different_expiry }
      );
      return {
        keptFood: presentFood(updatedFood, todayIsoDate()),
        removedFoodIds,
      };
    })
  );

  server.registerTool(
    "consolidate_all_matching",
    {
      title: "Consolidate all duplicates",
      description:
        "Consolidate every group returned by list_consolidation_candidates in one step.",
      inputSchema: z.object({}),
      annotations: { destructiveHint: true },
    },
    toolHandler(() => consolidateAllMatchingFoods())
  );
}
