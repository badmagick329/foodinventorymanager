"use client";
import RemoveButton from "@/app/shopping/_components/remove-button";
import { ShoppingItem } from "@prisma/client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_SHOPPING_URL } from "@/lib/urls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ShoppingItemDisplay from "@/app/shopping/_components/shopping-item-display";

export default function ShoppingList({
  shoppingItems,
}: {
  shoppingItems: ShoppingItem[];
}) {
  const [formItem, setFormItem] = useState("");
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API_SHOPPING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: formItem }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add shopping item");
      }
    },
    onSuccess: () => {
      setFormItem("");
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
    },
    onError: (error: Error) => {
      console.error("Failed to add shopping item:", error.message);
      setFormError(error.message);
    },
  });

  return (
    <div className="flex w-full flex-col items-start gap-8 sm:max-w-xl lg:max-w-4xl xl:max-w-6xl">
      <h1 className="w-full text-center text-3xl font-bold">Shopping List</h1>
      <Table className="md:text-md bg-secondary text-xs sm:text-sm lg:text-lg">
        {/* <TableHeader className="bg-black">
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="min-w-[100px] max-w-[240px] text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader> */}
        <TableBody>
          {shoppingItems.map((item, idx) => (
            <TableRow
              className="border-foreground [&:not(:first-child)]:border-t"
              key={item.id}
            >
              <TableCell>
                <ShoppingItemDisplay item={item}></ShoppingItemDisplay>
              </TableCell>
              <TableCell className="min-w-[100px] max-w-[240px] text-right">
                <RemoveButton id={item.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {formError && (
        <span className="text-center text-red-500">{formError}</span>
      )}
      <form
        className="flex w-full space-x-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Input
          className="bg-black"
          value={formItem}
          onChange={(e) => setFormItem(e.target.value)}
          autoComplete="off"
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
