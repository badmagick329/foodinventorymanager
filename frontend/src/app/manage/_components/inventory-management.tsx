"use client";

import { Button } from "@/components/ui/button";
import ErrorBlock from "@/app/_components/error-block";
import LoadingCat from "@/components/loading-cat";
import type { Food } from "@prisma/client";
import type { FoodConsolidationGroup } from "@/lib/food-consolidation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatAmount } from "@/lib/utils";

type CandidateResponse = { groups: FoodConsolidationGroup[] };

export default function InventoryManagement() {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const candidatesQuery = useQuery({
    queryKey: ["food-consolidation-candidates"],
    queryFn: async () => {
      const response = await fetch("/api/foods/consolidation-candidates");
      if (!response.ok) {
        throw new Error("Could not load consolidation candidates.");
      }
      return response.json() as Promise<CandidateResponse>;
    },
  });
  const consolidateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/foods/consolidate", {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Could not consolidate food items.");
      }
      return body as {
        groupsConsolidated: number;
        duplicateItemsRemoved: number;
      };
    },
    onSuccess: async () => {
      setIsConfirmOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["food-consolidation-candidates"],
        }),
        queryClient.invalidateQueries({ queryKey: ["foods"] }),
      ]);
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
        <h2 className="text-xl font-semibold">Consolidate duplicate items</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Matching entries are found automatically when they have the same name,
          unit, storage, and expiry date.
        </p>

        {groups.length === 0 ? (
          <p className="mt-6 rounded-md border p-5 text-center text-muted-foreground">
            No items can currently be consolidated.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                {groups.length} matching group{groups.length === 1 ? "" : "s"}{" "}
                found ({itemCount} entries).
              </p>
              <Button
                type="button"
                onClick={() => {
                  consolidateMutation.reset();
                  setIsConfirmOpen(true);
                }}
              >
                Consolidate all matching items
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
          groupCount={groups.length}
          duplicateItemCount={itemCount - groups.length}
          busy={consolidateMutation.isPending}
          error={
            consolidateMutation.isError
              ? consolidateMutation.error.message
              : undefined
          }
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => consolidateMutation.mutate()}
        />
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
            <span>Entry {food.id}</span>
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

function ConfirmationModal({
  groupCount,
  duplicateItemCount,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  groupCount: number;
  duplicateItemCount: number;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consolidate-all-title"
      >
        <h2 id="consolidate-all-title" className="text-xl font-semibold">
          Consolidate all matching items?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This will merge {groupCount} group{groupCount === 1 ? "" : "s"} and
          remove {duplicateItemCount} duplicate entr
          {duplicateItemCount === 1 ? "y" : "ies"}. No history events will be
          created.
        </p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Consolidating..." : "Confirm consolidation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
