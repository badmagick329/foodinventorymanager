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
import type { FoodRemoval, FoodRemovalReason } from "@prisma/client";
import { useMemo, useState } from "react";

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

export default function RemovalHistory({
  removals,
}: {
  removals: FoodRemoval[];
}) {
  const [showAccidentalEntries, setShowAccidentalEntries] = useState(false);
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRemovals.map((removal) => (
              <TableRow key={removal.id}>
                <TableCell className="font-medium">{removal.name}</TableCell>
                <TableCell>
                  {removal.amount} {removal.unit}
                </TableCell>
                <TableCell>{labelForReason(removal.reason)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {dateLabel(removal.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
