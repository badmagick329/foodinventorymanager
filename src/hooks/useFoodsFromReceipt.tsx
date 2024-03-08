"use client";
import { useState } from "react";
import { isArrayOfFoodFromReceipt } from "@/lib/predicates";
import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { foodFromReceiptSchema } from "@/lib/validators";

export default function useFoodsFromReceipt() {
  const [foodsFromReceipt, setFoodsFromReceipt] = useState<
    FoodFromReceipt[] | null
  >(null);

  async function readFile(file: File): Promise<void> {
    try {
      const foods = await postReceipt(file);
      if (!foods) {
        return;
      }
      setFoodsFromReceipt(foods);
    } catch (error) {
      console.error(error);
    }
  }

  async function sendData() {
    if (!foodsFromReceipt) {
      return;
    }
    const nonEmptyFoods = foodsFromReceipt.filter(
      (food) => food.name.trim() !== ""
    );
    if (nonEmptyFoods.length === 0) {
      return;
    }
    const errorMessage = validateData(nonEmptyFoods);
    if (errorMessage) {
      return errorMessage;
    }

    try {
      const res = await fetch(`/api/receipt/json`, {
        method: "POST",
        body: JSON.stringify(nonEmptyFoods),
      });
      if (!res.ok) {
        const resp = await res.json();
        const errors = JSON.parse(resp.error);
        if (errors) {
          return errors[0].message;
        }
        return "Error parsing data. Are all the dates correct?";
      }
      const response = await res.json();
      if (response.status === 201) {
        return;
      } else {
        return response.error.message;
      }
    } catch (e: any) {
      console.error(e.message);
      return e.message;
    }
  }

  function validateData(foods: FoodFromReceipt[]) {
    for (const food of foods) {
      const result = foodFromReceiptSchema.safeParse(food);
      if (!result.success) {
        const parsedErrors = JSON.parse(result.error.message);
        if (parsedErrors.length > 0) {
          return parsedErrors[0].message;
        } else {
          return "Error parsing data";
        }
      }
    }
  }

  return { foodsFromReceipt, readFile, sendData };
}

async function postReceipt(file: File) {
  try {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/receipt", {
      method: "POST",
      body: data,
    });
    if (!res.ok) {
      console.error(await res.text());
    }
    const resp = (await res.json()).data;
    if (!isArrayOfFoodFromReceipt(resp)) {
      throw new Error("Invalid response");
    }
    return resp;
  } catch (e: any) {
    // TODO: Better error handling
    console.error(e.message);
  }
}
