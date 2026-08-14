import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";
import {
  actionFoodIds,
  describeAction,
  isAssistantAction,
  type AssistantAction,
} from "@/lib/assistant";
import { foodSchema } from "@/lib/validators";
import { FoodRemovalSource } from "@prisma/client";
import {
  recordFoodRemovals,
  updateFoodAndRecordUsage,
} from "@/lib/food-removals";
import { FoodTransferError, transferFoodAmount } from "@/lib/food-transfers";

class ConfirmationConflictError extends Error {}

export async function POST(request: NextRequest) {
  const { messageId, conversationId, decision, selectedFoodIds } =
    await request.json();
  if (typeof messageId !== "string" || typeof conversationId !== "string") {
    return NextResponse.json(
      { error: "A proposed chat message is required." },
      { status: 400 }
    );
  }
  const proposal = await prisma.chatMessage.findFirst({
    where: { id: messageId, conversationId, role: "assistant" },
  });
  if (!proposal)
    return NextResponse.json(
      { error: "That proposed change could not be found." },
      { status: 404 }
    );
  if (proposal.actionStatus !== "pending")
    return NextResponse.json(
      { error: "That proposed change has already been resolved." },
      { status: 409 }
    );

  if (decision === "cancel") {
    const cancelled = await prisma.chatMessage.updateMany({
      where: { id: messageId, actionStatus: "pending" },
      data: { actionStatus: "cancelled" },
    });
    if (cancelled.count !== 1)
      return NextResponse.json(
        { error: "That proposed change has already been resolved." },
        { status: 409 }
      );
    return NextResponse.json({ message: "Change cancelled." });
  }

  if (!isAssistantAction(proposal.action) || proposal.action.kind === "none") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  let action = proposal.action as Exclude<AssistantAction, { kind: "none" }>;
  if (action.kind === "batch" && selectedFoodIds !== undefined) {
    const batch = action;
    if (
      !Array.isArray(selectedFoodIds) ||
      selectedFoodIds.length === 0 ||
      selectedFoodIds.some((id) => !Number.isInteger(id))
    ) {
      return NextResponse.json(
        { error: "Select at least one proposed change." },
        { status: 400 }
      );
    }
    const selectedIds = new Set(selectedFoodIds);
    if (
      selectedIds.size !== selectedFoodIds.length ||
      [...selectedIds].some(
        (id) => !batch.actions.some((item) => item.foodId === id)
      )
    ) {
      return NextResponse.json(
        { error: "Selected changes must belong to this proposal." },
        { status: 400 }
      );
    }
    action = {
      ...batch,
      actions: batch.actions.filter((item) => selectedIds.has(item.foodId)),
    };
  }
  const confirmedAction = action;
  const ids = actionFoodIds(confirmedAction);
  let foods: Awaited<ReturnType<typeof prisma.food.findMany>> = [];
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.chatMessage.updateMany({
        where: { id: messageId, conversationId, actionStatus: "pending" },
        data: { actionStatus: "confirmed" },
      });
      if (claimed.count !== 1)
        throw new ConfirmationConflictError(
          "That proposed change has already been resolved."
        );
      foods = await tx.food.findMany({ where: { id: { in: ids } } });
      if (foods.length !== new Set(ids).size)
        throw new ConfirmationConflictError(
          "One or more food items no longer exist."
        );

      if (confirmedAction.kind === "create") {
        await tx.food.create({ data: foodSchema.parse(confirmedAction.food) });
      } else if (confirmedAction.kind === "batch") {
        await Promise.all(
          confirmedAction.actions.map(async (item) => {
            if (item.kind === "update") {
              const result = await updateFoodAndRecordUsage(
                tx,
                item.foodId,
                item.changes,
                FoodRemovalSource.assistant
              );
              if (!result)
                throw new ConfirmationConflictError(
                  "One or more food items no longer exist."
                );
              return result.updatedFood;
            }
            const food = foods.find(
              (candidate) => candidate.id === item.foodId
            );
            if (!food)
              throw new ConfirmationConflictError(
                "One or more food items no longer exist."
              );
            await recordFoodRemovals(
              tx,
              [food],
              item.removalReason,
              FoodRemovalSource.assistant
            );
            return tx.food.delete({ where: { id: item.foodId } });
          })
        );
      } else if (confirmedAction.kind === "update") {
        const result = await updateFoodAndRecordUsage(
          tx,
          confirmedAction.foodId,
          confirmedAction.changes,
          FoodRemovalSource.assistant
        );
        if (!result)
          throw new ConfirmationConflictError(
            "One or more food items no longer exist."
          );
      } else if (confirmedAction.kind === "transfer") {
        const result = await transferFoodAmount(tx, confirmedAction.foodId, {
          amount: confirmedAction.amount,
          storage: confirmedAction.targetStorage,
          expiry: confirmedAction.targetExpiry,
        });
        if (!result)
          throw new ConfirmationConflictError(
            "One or more food items no longer exist."
          );
      } else if (confirmedAction.kind === "delete") {
        await recordFoodRemovals(
          tx,
          foods,
          confirmedAction.removalReason,
          FoodRemovalSource.assistant
        );
        await tx.food.deleteMany({
          where: { id: { in: confirmedAction.foodIds } },
        });
      } else if (confirmedAction.kind === "consolidate") {
        const primary = foods.find(
          (food) => food.id === confirmedAction.primaryFoodId
        );
        if (
          !primary ||
          foods.some(
            (food) =>
              food.unit !== primary.unit ||
              food.storage !== primary.storage ||
              food.name.trim().toLowerCase() !==
                primary.name.trim().toLowerCase()
          )
        ) {
          throw new Error(
            "Only entries with the same name, unit, and storage can be consolidated."
          );
        }
        const total = foods.reduce((sum, food) => sum + food.amount, 0);
        const expiry =
          foods
            .map((food) => food.expiry)
            .filter((value): value is string => value !== null)
            .sort()[0] ?? null;
        await tx.food.update({
          where: { id: primary.id },
          data: { amount: total, expiry },
        });
        await tx.food.deleteMany({
          where: {
            id: {
              in: foods
                .filter((food) => food.id !== primary.id)
                .map((food) => food.id),
            },
          },
        });
      }
    });
  } catch (error) {
    if (
      error instanceof ConfirmationConflictError ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025")
    ) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "One or more food items no longer exist.",
        },
        { status: 409 }
      );
    }
    if (
      error instanceof Error &&
      error.message ===
        "Only entries with the same name, unit, and storage can be consolidated."
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof FoodTransferError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
  const message = `Done — ${describeAction(confirmedAction, foods)}`;
  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: message,
      actionStatus: "confirmed",
    },
  });
  return NextResponse.json({ message });
}
