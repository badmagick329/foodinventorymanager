import createFood from "@/scripts/importfoods";
import fs from "fs";
import { NextResponse } from "next/server";

type Food = {
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: string;
};

export async function GET() {
  const foodJson = fs.readFileSync("src/scripts/data/food_data.json", "utf8");
  const foods = JSON.parse(foodJson);
  for (const food of foods) {
    const response = await createFood(food);
    if (response.status !== 201) {
      return response;
    }
  }
  return NextResponse.json({ status: 200 });
}
