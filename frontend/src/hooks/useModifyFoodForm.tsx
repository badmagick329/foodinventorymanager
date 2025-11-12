"use client";
import { FOODS_URL, V2_HOME } from "@/lib/urls";
import { ModifyFoodFormInput } from "@/lib/types";
import { Food } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function useModifyFoodForm(food: Food) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const targetUrl = `${FOODS_URL}${food.id}/`;

  const editMutation = useMutation({
    mutationFn: async (data: ModifyFoodFormInput) => {
      const response = await fetch(targetUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update food");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      queryClient.invalidateQueries({ queryKey: ["food", food.id.toString()] });
    },
    onError: (error: Error) => {
      console.error("Failed to update food:", error.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(targetUrl, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete food");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      queryClient.invalidateQueries({ queryKey: ["food", food.id.toString()] });
      router.push(V2_HOME);
    },
    onError: (error: Error) => {
      console.error("Failed to delete food:", error.message);
    },
  });

  return {
    editMutation,
    deleteMutation,
  };
}
