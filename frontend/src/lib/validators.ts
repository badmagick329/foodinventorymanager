import { MeasurementUnit, StorageType } from "@prisma/client";
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
  expiry: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z.iso.date().nullable()
  ),
  storage: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(StorageType, { message: "Invalid storage type" })),
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

export const foodFromReceiptSchema = foodSchema.pick({
  name: true,
  expiry: true,
  storage: true,
  unit: true,
});

export function formatZodError(error: ZodError) {
  const { fieldErrors } = z.flattenError(error);
  return (
    Object.entries(fieldErrors)
      //@ts-ignore
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ")
  );
}
