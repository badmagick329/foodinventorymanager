import type { McpServer } from "@modelcontextprotocol/server";
import type { FoodRemoval } from "@prisma/client";
import { z } from "zod";
import {
  deleteFoodRemoval,
  listFoodRemovals,
  summarizeFoodRemovals,
  updateFoodRemoval,
  type FoodRemovalFilter,
} from "@/server/inventory/removals";
import { InvalidInputError } from "@/server/errors";
import { toolHandler } from "./results";
import {
  amount,
  endOfDay,
  expiryDate,
  isoDate,
  removalReason,
  startOfDay,
  storage,
  unit,
} from "./schemas";

const dateRange = {
  since: isoDate
    .optional()
    .describe("Only entries on or after this date (YYYY-MM-DD)."),
  until: isoDate
    .optional()
    .describe("Only entries on or before this date (YYYY-MM-DD)."),
};

function rangeFilter({ since, until }: { since?: string; until?: string }) {
  return {
    since: since ? startOfDay(since) : undefined,
    until: until ? endOfDay(until) : undefined,
  } satisfies FoodRemovalFilter;
}

function presentRemoval(removal: FoodRemoval) {
  return {
    id: removal.id,
    name: removal.name,
    amount: removal.amount,
    unit: removal.unit,
    storage: removal.storage,
    expiry: removal.expiry,
    reason: removal.reason,
    source: removal.source,
    recordedAt: removal.createdAt.toISOString(),
  };
}

export function registerHistoryTools(server: McpServer) {
  server.registerTool(
    "list_history",
    {
      title: "List usage and waste history",
      description:
        "List food that left the inventory, newest first: what was consumed, discarded, or removed as an accidental entry. Partial usage appears as its own entry with the used amount.",
      inputSchema: z.object({
        reason: removalReason.optional(),
        search: z
          .string()
          .optional()
          .describe("Case-insensitive text the item name must contain."),
        ...dateRange,
        limit: z.number().int().min(1).max(500).default(50),
      }),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async ({ reason, search, since, until, limit }) => {
      const entries = await listFoodRemovals({
        reason,
        search: search?.trim() || undefined,
        limit,
        ...rangeFilter({ since, until }),
      });
      return { count: entries.length, entries: entries.map(presentRemoval) };
    })
  );

  server.registerTool(
    "history_summary",
    {
      title: "Summarise usage and waste",
      description:
        "Totals of consumed, discarded and accidental entries per unit, e.g. to review food waste over a period.",
      inputSchema: z.object(dateRange),
      annotations: { readOnlyHint: true },
    },
    toolHandler(async (range) => ({
      ...range,
      totals: await summarizeFoodRemovals(rangeFilter(range)),
    }))
  );

  server.registerTool(
    "update_history_entry",
    {
      title: "Correct a history entry",
      description:
        "Correct a recorded history entry, e.g. change discarded to consumed. This never changes the live inventory.",
      inputSchema: z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).optional(),
        amount: amount.optional(),
        unit: unit.optional(),
        storage: storage.optional(),
        expiry: expiryDate.nullable().optional(),
        reason: removalReason.optional(),
      }),
      annotations: { idempotentHint: true },
    },
    toolHandler(async ({ id, ...changes }) => {
      if (Object.values(changes).every((value) => value === undefined)) {
        throw new InvalidInputError("Provide at least one field to change.");
      }
      return presentRemoval(await updateFoodRemoval(id, changes));
    })
  );

  server.registerTool(
    "delete_history_entry",
    {
      title: "Delete a history entry",
      description:
        "Permanently delete one history entry. This never changes the live inventory.",
      inputSchema: z.object({ id: z.string().min(1) }),
      annotations: { destructiveHint: true },
    },
    toolHandler(async ({ id }) => {
      await deleteFoodRemoval(id);
      return { deleted: id };
    })
  );
}
