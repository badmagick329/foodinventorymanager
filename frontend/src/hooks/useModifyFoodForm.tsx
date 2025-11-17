"use client";
import { API_FOODS_URL, HOME } from "@/lib/urls";
import { ModifyFoodFormInput } from "@/lib/types";
import { Food } from "@prisma/client";
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

  return {
    saveMutation,
    deleteMutation,
  };
}
