"use client";
import { apiFetch } from "@/lib/api-client";
import { API_RECEIPT, API_RECEIPT_JSON } from "@/lib/urls";
import { foodSchema, formatZodError } from "@/lib/validators";
import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { StorageType } from "@prisma/client";
import { useState } from "react";

/** Form-editable copy of a parsed receipt line; fields stay raw until submit. */
export type ReceiptDraft = {
  key: string;
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: StorageType;
};

export default function useFoodsFromReceipt() {
  const [drafts, setDrafts] = useState<ReceiptDraft[] | null>(null);
  const [readError, setReadError] = useState("");

  async function readFile(file: File) {
    setReadError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const { data } = await apiFetch<{ data: FoodFromReceipt[] }>(
        API_RECEIPT,
        { method: "POST", body }
      );
      setDrafts(data.map(toDraft));
    } catch (error) {
      setDrafts(null);
      setReadError(error instanceof Error ? error.message : String(error));
    }
  }

  function updateDraft(key: string, changes: Partial<ReceiptDraft>) {
    setDrafts(
      (current) =>
        current?.map((draft) =>
          draft.key === key ? { ...draft, ...changes } : draft
        ) ?? null
    );
  }

  function removeDraft(key: string) {
    setDrafts(
      (current) => current?.filter((draft) => draft.key !== key) ?? null
    );
  }

  /** Returns an error message, or nothing once every item was imported. */
  async function submit(): Promise<string | undefined> {
    if (!drafts || drafts.length === 0) return "There are no items to import.";

    const foods = [];
    for (const [index, draft] of drafts.entries()) {
      const result = foodSchema.safeParse({
        name: draft.name,
        amount: draft.amount,
        unit: draft.unit,
        expiry: draft.expiry,
        storage: draft.storage,
      });
      if (!result.success) {
        return `${draft.name.trim() || `Item ${index + 1}`}: ${formatZodError(result.error)}`;
      }
      foods.push(result.data);
    }

    try {
      await apiFetch(API_RECEIPT_JSON, { method: "POST", json: foods });
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  return { drafts, readError, readFile, updateDraft, removeDraft, submit };
}

function toDraft(food: FoodFromReceipt, index: number): ReceiptDraft {
  return {
    key: `${index}-${food.name}`,
    name: food.name,
    amount: String(food.amount),
    unit: food.unit,
    expiry: food.expiry ?? "",
    storage: food.storage,
  };
}
