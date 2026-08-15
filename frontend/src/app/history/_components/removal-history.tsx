"use client";

import { Button } from "@/components/ui/button";
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

const visibleReasons = [
  "consumed",
  "discarded",
] as const satisfies readonly FoodRemovalReason[];

function labelForReason(reason: FoodRemovalReason) {
  if (reason === "consumed") return "Consumed";
  if (reason === "discarded") return "Thrown away";
  return "Accidental entry";
}

function dateLabel(date: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
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
  const [showAccidentalEntries, setShowAccidentalEntries] = useState(false);
  const [editingRemoval, setEditingRemoval] = useState<FoodRemoval | null>(
    null
  );
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      changes: FoodRemovalEdit;
    }) => {
      const response = await fetch(`/api/food-removals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Could not update history entry.");
      }
    },
    onSuccess: () => {
      setEditingRemoval(null);
      queryClient.invalidateQueries({ queryKey: ["food-removals"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/food-removals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Could not delete history entry.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-removals"] });
    },
  });
  const displayedRemovals = useMemo(
    () =>
      removals.filter(
        (removal) =>
          showAccidentalEntries ||
          visibleReasons.includes(
            removal.reason as (typeof visibleReasons)[number]
          )
      ),
    [removals, showAccidentalEntries]
  );

  return (
    <section className="w-full max-w-5xl px-2 pb-8 sm:px-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Food history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you have used or thrown away.
          </p>
        </div>
        <Button
          type="button"
          variant={showAccidentalEntries ? "secondary" : "outline"}
          onClick={() => setShowAccidentalEntries((current) => !current)}
        >
          {showAccidentalEntries
            ? "Hide accidental entries"
            : "Show accidental entries"}
        </Button>
      </div>
      {displayedRemovals.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-muted-foreground">
          No food removals recorded yet.
        </p>
      ) : (
        <Table className="bg-foreground/5 text-sm">
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">When</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRemovals.map((removal) => (
              <TableRow key={removal.id}>
                <TableCell className="font-medium">{removal.name}</TableCell>
                <TableCell>
                  {formatAmount(removal.amount)} {removal.unit}
                </TableCell>
                <TableCell>{labelForReason(removal.reason)}</TableCell>
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
                      disabled={deleteMutation.isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete the history entry for ${removal.name}? This will not change your live inventory.`
                          )
                        ) {
                          deleteMutation.mutate(removal.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
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
      {(editMutation.isError || deleteMutation.isError) && (
        <p className="mt-3 text-sm text-red-500">
          {editMutation.error?.message ?? deleteMutation.error?.message}
        </p>
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
  const [changes, setChanges] = useState<FoodRemovalEdit>({
    name: removal.name,
    amount: removal.amount,
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
          onSave(changes);
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
            <Label htmlFor="history-name">Item</Label>
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
                  amount: Number(event.target.value),
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
                    {labelForReason(reason)}
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
