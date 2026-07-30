import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import { describeAction, isAssistantAction } from "@/lib/assistant";

export async function POST(request: NextRequest) {
  const { action, conversationId } = await request.json();
  if (!isAssistantAction(action) || action.kind === "none") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  const ids = action.kind === "update" ? [action.foodId] : action.foodIds;
  const foods = await prisma.food.findMany({ where: { id: { in: ids } } });
  if (foods.length !== new Set(ids).size) return NextResponse.json({ error: "One or more food items no longer exist." }, { status: 409 });

  if (action.kind === "update") {
    await prisma.food.update({ where: { id: action.foodId }, data: action.changes });
  } else if (action.kind === "delete") {
    await prisma.food.deleteMany({ where: { id: { in: action.foodIds } } });
  } else {
    const primary = foods.find((food) => food.id === action.primaryFoodId);
    if (!primary || foods.some((food) => food.unit !== primary.unit || food.storage !== primary.storage || food.name.trim().toLowerCase() !== primary.name.trim().toLowerCase())) {
      return NextResponse.json({ error: "Only entries with the same name, unit, and storage can be consolidated." }, { status: 400 });
    }
    const total = foods.reduce((sum, food) => sum + food.amount, 0);
    const expiry = foods.map((food) => food.expiry).filter((value): value is string => value !== null).sort()[0] ?? null;
    await prisma.$transaction([
      prisma.food.update({ where: { id: primary.id }, data: { amount: total, expiry } }),
      prisma.food.deleteMany({ where: { id: { in: foods.filter((food) => food.id !== primary.id).map((food) => food.id) } } }),
    ]);
  }
  const message = `Done — ${describeAction(action, foods)}`;
  if (typeof conversationId === "string") {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (conversation) await prisma.chatMessage.create({ data: { conversationId, role: "assistant", content: message } });
  }
  return NextResponse.json({ message });
}
