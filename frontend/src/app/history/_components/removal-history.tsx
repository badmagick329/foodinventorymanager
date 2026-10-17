"use client";

import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FoodRemovalReason,
  MeasurementUnit,
  StorageType,
  type FoodRemoval,
} from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatAmount } from "@/lib/utils";
import { apiFetch, queryKeys } from "@/lib/api-client";
import { API_FOOD_REMOVALS_URL } from "@/lib/urls";
import {
  filterFoodRemovals,
  outcomeLabel,
  removalAccentClass,
  type FoodRemovalOutcomeFilter,
} from "@/lib/food-removal-history";

function dateLabel(date: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(date));
}

type FoodRemovalEdit = Pick<
  FoodRemoval,
  "name" | "amount" | "unit" | "expiry" | "storage" | "reason"
>;

export default function RemovalHistory({
  removals,
}: {
  removals: FoodRemoval[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] =
    useState<FoodRemovalOutcomeFilter>("all");
  const [editingRemoval, setEditingRemoval] = useState<FoodRemoval | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState<{
    kind: "undo" | "delete";
    removal: FoodRemoval;
  } | null>(null);
  const editMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: FoodRemovalEdit }) =>
      apiFetch(`${API_FOOD_REMOVALS_URL}${id}`, {
        method: "PATCH",
        json: changes,
      }),
    onSuccess: () => {
      setEditingRemoval(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodRemovals });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${API_FOOD_REMOVALS_URL}${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodRemovals });
    },
  });
  const undoMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${API_FOOD_REMOVALS_URL}${id}/undo`, { method: "POST" }),
    onSuccess: () => {
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodRemovals });
      queryClient.invalidateQueries({ queryKey: queryKeys.foods });
    },
  });
  const rowBusy = deleteMutation.isPending || undoMutation.isPending;
  const actionMutation =
    pendingAction?.kind === "undo" ? undoMutation : deleteMutation;
  const displayedRemovals = useMemo(
    () => filterFoodRemovals(removals, search, outcomeFilter),
    [removals, search, outcomeFilter]
  );
  const hasFilters = search.trim() !== "" || outcomeFilter !== "all";

  return (
    <section className="w-full max-w-5xl px-2 pb-8 sm:px-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Food history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you have used or discarded.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-search">Search</Label>
            <Input
              id="history-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search food name"
              className="sm:w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-outcome-filter">Outcome</Label>
            <Select
              value={outcomeFilter}
              onValueChange={(value) =>
                setOutcomeFilter(value as FoodRemovalOutcomeFilter)
              }
            >
              <SelectTrigger id="history-outcome-filter" className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                {Object.values(FoodRemovalReason).map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {outcomeLabel(reason)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {displayedRemovals.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-muted-foreground">
          {hasFilters
            ? "No history entries match your filters."
            : "No food removals recorded yet."}
        </p>
      ) : (
        <Table className="bg-foreground/5 text-sm">
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead>Food</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">When</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRemovals.map((removal) => (
              <TableRow
                key={removal.id}
                className={`border-l-4 ${removalAccentClass(removal.reason)}`}
              >
                <TableCell className="font-medium">{removal.name}</TableCell>
                <TableCell>
                  {formatAmount(removal.amount)} {removal.unit}
                </TableCell>
                <TableCell>{outcomeLabel(removal.reason)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {dateLabel(removal.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        editMutation.reset();
                        setEditingRemoval(removal);
                      }}
                      disabled={rowBusy}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        undoMutation.reset();
                        setPendingAction({ kind: "undo", removal });
                      }}
                      disabled={rowBusy}
                    >
                      Undo
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        deleteMutation.reset();
                        setPendingAction({ kind: "delete", removal });
                      }}
                      disabled={rowBusy}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {pendingAction && (
        <ConfirmationModal
          title={
            pendingAction.kind === "undo"
              ? "Undo this entry?"
              : "Delete history entry?"
          }
          confirmLabel={
            pendingAction.kind === "undo" ? "Undo entry" : "Delete entry"
          }
          pendingLabel={
            pendingAction.kind === "undo" ? "Undoing..." : "Deleting..."
          }
          confirmVariant={
            pendingAction.kind === "delete" ? "destructive" : "default"
          }
          busy={actionMutation.isPending}
          error={actionMutation.isError ? actionMutation.error.message : undefined}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => actionMutation.mutate(pendingAction.removal.id)}
        >
          {pendingAction.kind === "undo" ? (
            <>
              {formatAmount(pendingAction.removal.amount)}{" "}
              {pendingAction.removal.unit} of {pendingAction.removal.name} goes
              back into your inventory and the entry is removed.
            </>
          ) : (
            <>
              Delete the history entry for {pendingAction.removal.name}? This
              will not change your live inventory.
            </>
          )}
        </ConfirmationModal>
      )}
      {editingRemoval && (
        <EditRemovalModal
          removal={editingRemoval}
          busy={editMutation.isPending}
          error={editMutation.isError ? editMutation.error.message : undefined}
          onCancel={() => {
            editMutation.reset();
            setEditingRemoval(null);
          }}
          onSave={(changes) =>
            editMutation.mutate({ id: editingRemoval.id, changes })
          }
        />
      )}
    </section>
  );
}

function EditRemovalModal({
  removal,
  busy,
  error,
  onCancel,
  onSave,
}: {
  removal: FoodRemoval;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (changes: FoodRemovalEdit) => void;
}) {
  // Amount stays the raw input text until save. Held as a number, clearing the
  // field became 0, React wrote "0" back into it, and the next digit typed
  // produced "05" (FDI-4).
  const [changes, setChanges] = useState<
    Omit<FoodRemovalEdit, "amount"> & { amount: string }
  >({
    name: removal.name,
    amount: String(removal.amount),
    unit: removal.unit,
    expiry: removal.expiry,
    storage: removal.storage,
    reason: removal.reason,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <form
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-history-entry-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...changes, amount: Number(changes.amount) });
        }}
      >
        <h2 id="edit-history-entry-title" className="text-xl font-semibold">
          Edit history entry
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These changes affect history only. Your live inventory will not
          change.
        </p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="history-name">Food</Label>
            <Input
              id="history-name"
              value={changes.name}
              onChange={(event) =>
                setChanges((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-amount">Amount</Label>
            <Input
              id="history-amount"
              type="number"
              min="0.01"
              step="any"
              value={changes.amount}
              onChange={(event) =>
                setChanges((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-unit">Unit</Label>
            <Select
              value={changes.unit}
              onValueChange={(unit) =>
                setChanges((current) => ({
                  ...current,
                  unit: unit as MeasurementUnit,
                }))
              }
            >
              <SelectTrigger id="history-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MeasurementUnit).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-expiry">Expiry</Label>
            <Input
              id="history-expiry"
              type="date"
              value={changes.expiry ?? ""}
              onChange={(event) =>
                setChanges((current) => ({
                  ...current,
                  expiry: event.target.value || null,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-storage">Storage</Label>
            <Select
              value={changes.storage}
              onValueChange={(storage) =>
                setChanges((current) => ({
                  ...current,
                  storage: storage as StorageType,
                }))
              }
            >
              <SelectTrigger id="history-storage" className="capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StorageType).map((storage) => (
                  <SelectItem
                    key={storage}
                    value={storage}
                    className="capitalize"
                  >
                    {storage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="history-outcome">Outcome</Label>
            <Select
              value={changes.reason}
              onValueChange={(reason) =>
                setChanges((current) => ({
                  ...current,
                  reason: reason as FoodRemovalReason,
                }))
              }
            >
              <SelectTrigger id="history-outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FoodRemovalReason).map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {outcomeLabel(reason)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
