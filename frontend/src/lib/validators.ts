import {
  receiptStorageValues,
  unitValues,
} from "@/receipt-reader/parser/types";
import { MeasurementUnit, StorageType } from "@prisma/client";
import { z } from "zod";

const expiryValidator = z
  .string()
  .nullable()
  .transform((val) => {
    if (val === null || val === "") {
      return null;
    }
    return String(val).trim();
  })
  .refine(
    (val) => {
      if (val === null) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(val);
    },
    { message: "Expiry must be in YYYY-MM-DD format or empty" }
  )
  .refine(
    (val) => {
      if (val === null) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Expiry must be a valid date or null" }
  )
  .transform((val) => {
    if (val === null) return null;
    const date = new Date(val);
    return date.toISOString().slice(0, 10);
  });

export const foodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.nativeEnum(MeasurementUnit, {
    errorMap: (issue, ctx) => ({
      message: `Unit must be one of: ${Object.values(MeasurementUnit).join(", ")}`,
    }),
  }),
  amount: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((value) => value > 0, { message: "Amount must be greater than 0" }),
  expiry: expiryValidator,
  storage: z.nativeEnum(StorageType, {
    errorMap: (issue, ctx) => ({
      message: `Storage must be one of: ${Object.values(StorageType).join(", ")}`,
    }),
  }),
});

const partialFoodSchema = foodSchema.partial();

export const patchFoodSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  unit: z
    .nativeEnum(MeasurementUnit, {
      errorMap: (issue, ctx) => ({
        message: `Unit must be one of: ${Object.values(MeasurementUnit).join(", ")}`,
      }),
    })
    .optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((value) => value >= 0, {
      message: "Amount must be greater than or equal to 0",
    })
    .optional(),
  expiry: expiryValidator.optional(),
  storage: z
    .nativeEnum(StorageType, {
      errorMap: (issue, ctx) => ({
        message: `Storage must be one of: ${Object.values(StorageType).join(", ")}`,
      }),
    })
    .optional(),
});

export function validateFood(
  data: Record<string, string | null>
): string | null {
  const result = foodSchema.safeParse(data);

  if (result.success) {
    return null;
  } else {
    return result.error.message;
  }
}

export function validatePartialFood(
  data: Record<string, string | null>
): string | null {
  const result = partialFoodSchema.safeParse(data);

  if (result.success) {
    return null;
  } else {
    return result.error.message;
  }
}

export const foodFromReceiptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  expiry: z
    .string()
    .nullable()
    .refine((value) => value === null || !isNaN(Date.parse(value)), {
      message: "Expiry must be a valid date",
    }),
  storage: z.enum(receiptStorageValues),
  amount: z
    .number()
    .refine((value) => value > 0, { message: "Amount must be greater than 0" }),
  unit: z.enum(unitValues, {
    errorMap: (issue, ctx) => ({
      message: "Storage must be one of: fridge, freezer, pantry, spices",
    }),
  }),
});
