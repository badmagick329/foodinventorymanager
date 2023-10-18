import { z, ZodType } from "zod";
import { StorageType, MeasurementUnit } from "@prisma/client";

const foodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["l", "ml", "g", "kg", "unit"], {
    errorMap: (issue, ctx) => ({
      message: "Unit must be one of: l, ml, g, kg, unit",
    }),
  }),
  amount: z
    .string()
    .transform(Number)
    .refine((value) => value > 0, { message: "Amount must be greater than 0" }),
  expiry: z
    .string()
    .nullable()
    .refine((value) => value === null || !isNaN(Date.parse(value)), {
      message: "Expiry must be a valid date",
    }),
  storage: z.enum(["fridge", "freezer", "pantry", "spices"], {
    errorMap: (issue, ctx) => ({
      message: "Storage must be one of: fridge, freezer, pantry, spices",
    }),
  }),
});

const partialFoodSchema = foodSchema.partial();

export function validateFood(
  data: Record<string, string | null>,
): string | null {
  const result = foodSchema.safeParse(data);

  if (result.success) {
    return null;
  } else {
    return result.error.message;
  }
}

export function validatePartialFood(
  data: Record<string, string | null>,
): string | null {
  const result = partialFoodSchema.safeParse(data);

  if (result.success) {
    return null;
  } else {
    return result.error.message;
  }
}
