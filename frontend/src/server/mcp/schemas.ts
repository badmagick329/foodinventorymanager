import {
  FoodRemovalReason,
  MeasurementUnit,
  StorageType,
} from "@prisma/client";
import { z } from "zod";

export const id = z.number().int().positive();
export const storage = z
  .enum(StorageType)
  .describe("Where the item is kept: fridge, freezer, pantry or spices.");
export const unit = z
  .enum(MeasurementUnit)
  .describe(
    "g, kg, ml, l, or unit (a count of packs/items). Amounts in different units are never converted."
  );
export const amount = z.number().positive();
export const expiryDate = z.iso.date().describe("Expiry date as YYYY-MM-DD.");
export const removalReason = z
  .enum(FoodRemovalReason)
  .describe(
    "consumed = eaten or used; discarded = thrown away; accidental_entry = it was entered by mistake."
  );
export const isoDate = z.iso.date();

/** Start of a calendar day in the server's time zone. */
export function startOfDay(date: string) {
  return new Date(`${date}T00:00:00`);
}

/** Exclusive upper bound for an inclusive `until` date. */
export function endOfDay(date: string) {
  const end = startOfDay(date);
  end.setDate(end.getDate() + 1);
  return end;
}
