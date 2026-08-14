"use client";
import { API_FOODS_URL, HOME } from "@/lib/urls";
import { FoodTransferInput, ModifyFoodFormInput } from "@/lib/types";
import { Food, FoodRemovalReason } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function useModifyFoodForm(food?: Food) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const targetUrl = food ? `${API_FOODS_URL}${food.id}/` : API_FOODS_URL;

  const saveMutation = useMutation({
    mutationFn: async (data: ModifyFoodFormInput) => {
      const response = await fetch(targetUrl, {
        method: food ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { error } = await response.json();

        throw new Error(error || "Failed to update food");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      food &&
        queryClient.invalidateQueries({
          queryKey: ["food", food.id.toString()],
        });
      food || router.push(HOME);
    },
    onError: (error: Error) => {
      console.error("Failed to save food:", error.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (removalReason: FoodRemovalReason) => {
      const response = await fetch(targetUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removalReason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete food");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      food &&
        queryClient.invalidateQueries({
          queryKey: ["food", food.id.toString()],
        });
      router.push(HOME);
    },
    onError: (error: Error) => {
      console.error("Failed to delete food:", error.message);
    },
  });
  const transferMutation = useMutation({
    mutationFn: async (data: FoodTransferInput) => {
      if (!food) throw new Error("Only an existing item can be moved.");
      const response = await fetch(`${targetUrl}transfer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to move food");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      food &&
        queryClient.invalidateQueries({
          queryKey: ["food", food.id.toString()],
        });
      router.push(HOME);
    },
    onError: (error: Error) => {
      console.error("Failed to move food:", error.message);
    },
  });

  return {
    saveMutation,
    deleteMutation,
    transferMutation,
  };
}
