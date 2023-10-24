import { NextRequest, NextResponse } from "next/server";
import { validateFood } from "@/lib/validators";
import { MeasurementUnit, StorageType } from "@prisma/client";
import prisma from "../../../../../prisma/client";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const data = (await request.json())["foodItems"];
  // return NextResponse.json({ status: 200 });
  console.log(JSON.stringify(data, null, 2));
  const createErrors = [];
  let created = 0;
  for (const foodItem of data) {
    console.log(`Processing foodItem: ${JSON.stringify(foodItem, null, 2)}`);
    console.log(`Name: ${foodItem.name} ${typeof foodItem.name}`);
    console.log(`Amount: ${foodItem.amount} ${typeof foodItem.amount}`);
    console.log(`Unit: ${foodItem.unit} ${typeof foodItem.unit}`);
    console.log(`Expiry: ${foodItem.expiry} ${typeof foodItem.expiry}`);
    console.log(`Storage: ${foodItem.storage} ${typeof foodItem.storage}`);
    let name = foodItem.name.trim() as string;
    let amount = String(foodItem.amount).trim() as string;
    let unit = foodItem.unit.toLowerCase().trim() as string;
    let expiry = foodItem.expiry === null ? null : foodItem.expiry.trim();
    let storage = foodItem.storage.trim() as string;
    console.log("After trimming:");
    console.log(`Name: ${name} ${typeof name}`);
    console.log(`Amount: ${amount} ${typeof amount}`);
    console.log(`Unit: ${unit} ${typeof unit}`);
    console.log(`Expiry: ${expiry} ${typeof expiry}`);
    console.log(`Storage: ${storage} ${typeof storage}`);
    const validationError = validateFood({
      name,
      unit,
      amount,
      expiry,
      storage,
    });
    if (validationError) {
      console.log(`Validation failed: ${validationError}`);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    unit = unit as MeasurementUnit;
    try {
      const food = await prisma.food.create({
        data: {
          name,
          amount: Number(amount),
          unit: unit as MeasurementUnit,
          expiry,
          storage: storage as StorageType,
        },
      });
      created++;
    } catch (error: any) {
      createErrors.push(error);
    }
  }
  if (createErrors.length > 0) {
    for (const error of createErrors) {
      console.log(error);
    }
  }
  if (created === 0) {
    return NextResponse.json({ error: "No items created" }, { status: 400 });
  }
  revalidateTag("foods");
  return NextResponse.json({ status: 201 });
}
