"use client";
import { Food } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getHoverColorByStorage,
  getColorByStorage,
  daysUntilExpiryToBorderColor,
  daysUntil,
  formatAmount,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FOOD_FORM_URL } from "@/lib/urls";
import { canConsolidateFoods } from "@/lib/food-consolidation";
import { Button } from "@/components/ui/button";

export default function FoodTable({ foods }: { foods: Food[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const selectedFoods = useMemo(
    () =>
      foods
        .filter((food) => selectedIds.includes(food.id))
        .sort((first, second) => first.id - second.id),
    [foods, selectedIds]
  );
  const canConsolidate = canConsolidateFoods(selectedFoods);
  const consolidateMutation = useMutation({
    mutationFn: async (foodIds: number[]) => {
      const response = await fetch("/api/foods/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodIds }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Could not consolidate food items.");
      }
    },
    onSuccess: async () => {
      setSelectedIds([]);
      setIsPreviewOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => foods.some((food) => food.id === id))
    );
  }, [foods]);

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  return (
    <>
      <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedFoods.length > 0
            ? `${selectedFoods.length} item${selectedFoods.length === 1 ? "" : "s"} selected`
            : "Select matching items to consolidate them."}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!canConsolidate}
          onClick={() => {
            consolidateMutation.reset();
            setIsPreviewOpen(true);
          }}
        >
          Consolidate selected
        </Button>
      </div>
      {selectedFoods.length >= 2 && !canConsolidate && (
        <p className="mb-3 text-sm text-muted-foreground">
          Selected items must have the same name, unit, storage, and expiry.
        </p>
      )}
      {consolidateMutation.isError && (
        <p className="mb-3 text-sm text-red-500">
          {consolidateMutation.error.message}
        </p>
      )}
      <Table className="md:text-md bg-foreground/5 text-xs sm:text-sm lg:text-lg [&_tr:last-child]:border-l-4 [&_tr:last-child]:border-r-4">
        <TableHeader className="bg-black">
          <TableRow>
            <TableHead className="w-10" aria-label="Select" />
            <TableHead className="max-w-2/3 min-w-[80px]">Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Storage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {foods.map((f) => {
            const borderColor =
              f.expiry !== null
                ? daysUntilExpiryToBorderColor(daysUntil(f.expiry))
                : "";
            const isSelected = selectedIds.includes(f.id);
            return (
              <TableRow
                key={f.id}
                className={`select-none ${getColorByStorage(
                  f.storage
                )} ${getHoverColorByStorage(f.storage)} border-l-4 border-r-4 ${borderColor} ${
                  isSelected ? "ring-2 ring-inset ring-primary" : ""
                }`}
                onDoubleClick={() => {
                  router.push(`${FOOD_FORM_URL}${f.id}/`);
                }}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    aria-label={`Select ${f.name}`}
                    onChange={() => toggleSelected(f.id)}
                    onClick={(event) => event.stopPropagation()}
                    onDoubleClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
                <TableCell>{f.name}</TableCell>
                <TableCell>{formatAmount(f.amount)}</TableCell>
                <TableCell>{f.unit}</TableCell>
                <TableCell className="">{f.expiry}</TableCell>
                <TableCell className="text-right capitalize">
                  {f.storage}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {isPreviewOpen && (
        <ConsolidationPreview
          foods={selectedFoods}
          busy={consolidateMutation.isPending}
          error={
            consolidateMutation.isError
              ? consolidateMutation.error.message
              : undefined
          }
          onCancel={() => setIsPreviewOpen(false)}
          onConfirm={() => consolidateMutation.mutate(selectedIds)}
        />
      )}
    </>
  );
}

function ConsolidationPreview({
  foods,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  foods: Food[];
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const firstFood = foods[0];
  const totalAmount = foods.reduce((total, food) => total + food.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consolidate-food-title"
      >
        <h2 id="consolidate-food-title" className="text-xl font-semibold">
          Consolidate food items?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These entries will become one item. No history event will be created.
        </p>
        <div className="mt-4 rounded-md border p-3 text-sm">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex justify-between gap-4 border-b py-2 last:border-0"
            >
              <span className="truncate">{food.name}</span>
              <span className="shrink-0">
                {formatAmount(food.amount)} {food.unit}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm">
          Result: <strong>{formatAmount(totalAmount)}</strong>{" "}
          <strong>{firstFood.unit}</strong> of <strong>{firstFood.name}</strong>{" "}
          in <strong className="capitalize">{firstFood.storage}</strong>
          {firstFood.expiry ? `, expiring ${firstFood.expiry}` : ", no expiry"}.
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
