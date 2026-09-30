import {
  FoodRemovalReason,
  MeasurementUnit,
  StorageType,
} from "@prisma/client";
import { z, ZodError } from "zod";

export const foodSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  unit: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum(MeasurementUnit, {
        message: "Invalid measurement unit",
      })
    ),
  amount: z.coerce
    .number("Amount must be a number")
    .gt(0, { message: "Amount must be greater than 0" }),
  // A missing or blank expiry means the item has none.
  expiry: z.preprocess(
    (val) =>
      val === undefined || (typeof val === "string" && val.trim() === "")
        ? null
        : val,
    z.iso.date().nullable()
  ),
  storage: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(StorageType, { message: "Invalid storage type" })),
});

export const foodTransferSchema = foodSchema.pick({
  amount: true,
  expiry: true,
  storage: true,
});

export const foodRemovalSchema = foodSchema.extend({
  reason: z.enum(FoodRemovalReason, { message: "Invalid removal outcome" }),
});

export function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message
    )
    .join("; ");
}
