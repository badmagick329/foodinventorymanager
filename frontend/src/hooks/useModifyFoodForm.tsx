"use client";
import { API_FOODS_URL, HOME } from "@/lib/urls";
import { FoodTransferInput, ModifyFoodFormInput } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";
import { Food, FoodRemovalReason } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function useModifyFoodForm(food?: Food) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const targetUrl = food ? `${API_FOODS_URL}${food.id}/` : API_FOODS_URL;
  // Any food change can also affect history and consolidation views.
  const refreshInventory = () => queryClient.invalidateQueries();

  const saveMutation = useMutation({
    mutationFn: (data: ModifyFoodFormInput) =>
      apiFetch<Food>(targetUrl, {
        method: food ? "PATCH" : "POST",
        json: data,
      }),
    onSuccess: () => {
      refreshInventory();
      if (!food) router.push(HOME);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (removalReason: FoodRemovalReason) =>
      apiFetch(targetUrl, { method: "DELETE", json: { removalReason } }),
    onSuccess: () => {
      refreshInventory();
      router.push(HOME);
    },
  });
  const transferMutation = useMutation({
    mutationFn: (data: FoodTransferInput) =>
      apiFetch(`${targetUrl}transfer/`, { method: "POST", json: data }),
    onSuccess: () => {
      refreshInventory();
      router.push(HOME);
    },
  });

  return {
    saveMutation,
    deleteMutation,
    transferMutation,
  };
}
