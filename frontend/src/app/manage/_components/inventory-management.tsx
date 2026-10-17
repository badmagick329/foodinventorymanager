"use client";

import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import ErrorBlock from "@/app/_components/error-block";
import LoadingCat from "@/components/loading-cat";
import type { Food } from "@prisma/client";
import type { FoodConsolidationGroup } from "@/lib/food-consolidation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatAmount } from "@/lib/utils";
import { apiFetch, queryKeys } from "@/lib/api-client";
import {
  API_CONSOLIDATE_URL,
  API_CONSOLIDATION_CANDIDATES_URL,
} from "@/lib/urls";

type CandidateResponse = { groups: FoodConsolidationGroup[] };

export default function InventoryManagement() {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const candidatesQuery = useQuery({
    queryKey: queryKeys.consolidationCandidates,
    queryFn: () =>
      apiFetch<CandidateResponse>(API_CONSOLIDATION_CANDIDATES_URL),
  });
  const consolidateMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ groupsConsolidated: number; duplicateItemsRemoved: number }>(
        API_CONSOLIDATE_URL,
        { method: "POST" }
      ),
    onSuccess: async () => {
      setIsConfirmOpen(false);
      await queryClient.invalidateQueries();
    },
  });

  if (candidatesQuery.isPending) return <LoadingCat />;
  if (candidatesQuery.error)
    return <ErrorBlock error={candidatesQuery.error} />;

  const groups = candidatesQuery.data.groups;
  const itemCount = groups.reduce(
    (total, group) => total + group.foods.length,
    0
  );

  return (
    <section className="w-full max-w-5xl px-2 pb-8 sm:px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventory management</h1>
        <p className="mt-1 text-muted-foreground">
          Review and clean up your inventory without changing the main list.
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <h2 className="text-xl font-semibold">Consolidate duplicate foods</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Matching foods are found automatically when they have the same name,
          unit, storage, and expiry date.
        </p>

        {groups.length === 0 ? (
          <p className="mt-6 rounded-md border p-5 text-center text-muted-foreground">
            No foods can currently be consolidated.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                {groups.length} matching group{groups.length === 1 ? "" : "s"}{" "}
                found ({itemCount} foods).
              </p>
              <Button
                type="button"
                onClick={() => {
                  consolidateMutation.reset();
                  setIsConfirmOpen(true);
                }}
              >
                Consolidate all matching foods
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              {groups.map((group) => (
                <ConsolidationGroupPreview
                  key={group.foods[0].id}
                  group={group}
                />
              ))}
            </div>
          </>
        )}

        {consolidateMutation.isSuccess && (
          <p className="mt-4 text-sm text-green-500">
            Consolidated {consolidateMutation.data.groupsConsolidated} group
            {consolidateMutation.data.groupsConsolidated === 1 ? "" : "s"} and
            removed {consolidateMutation.data.duplicateItemsRemoved} duplicate
            {consolidateMutation.data.duplicateItemsRemoved === 1 ? "" : "s"}.
          </p>
        )}
        {consolidateMutation.isError && (
          <p className="mt-4 text-sm text-red-500">
            {consolidateMutation.error.message}
          </p>
        )}
      </div>

      {isConfirmOpen && (
        <ConfirmationModal
          title="Consolidate all matching foods?"
          confirmLabel="Confirm consolidation"
          pendingLabel="Consolidating..."
          busy={consolidateMutation.isPending}
          error={
            consolidateMutation.isError
              ? consolidateMutation.error.message
              : undefined
          }
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => consolidateMutation.mutate()}
        >
          This will consolidate {groups.length} group
          {groups.length === 1 ? "" : "s"} and remove {itemCount - groups.length}{" "}
          duplicate food{itemCount - groups.length === 1 ? "" : "s"}. No history
          entries will be created.
        </ConfirmationModal>
      )}
    </section>
  );
}

function ConsolidationGroupPreview({
  group,
}: {
  group: FoodConsolidationGroup;
}) {
  const firstFood = group.foods[0];

  return (
    <div className="rounded-md border bg-foreground/5 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="font-medium">{firstFood.name}</h3>
        <span className="text-sm capitalize text-muted-foreground">
          {firstFood.storage} · {firstFood.expiry ?? "No expiry"}
        </span>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
        {group.foods.map((food) => (
          <div key={food.id} className="flex justify-between gap-4">
            <span>Food {food.id}</span>
            <span>
              {formatAmount(food.amount)} {food.unit}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t pt-3 text-sm">
        Result:{" "}
        <strong>
          {formatAmount(group.totalAmount)} {firstFood.unit}
        </strong>
      </p>
    </div>
  );
}
