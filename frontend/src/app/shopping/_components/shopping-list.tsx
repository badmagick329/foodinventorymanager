"use client";
import RemoveButton from "@/app/shopping/_components/remove-button";
import { ShoppingItem } from "@prisma/client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_SHOPPING_URL } from "@/lib/urls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import ShoppingItemDisplay from "@/app/shopping/_components/shopping-item-display";

export default function ShoppingList({
  shoppingItems,
}: {
  shoppingItems: ShoppingItem[];
}) {
  const [formItem, setFormItem] = useState("");
  const [formError, setFormError] = useState("");
  const [isConfirmClearList, setIsConfirmClearList] = useState(false);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
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

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API_SHOPPING_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to clear shopping list");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
    },
    onError: (error: Error) => {
      console.error(error.message);
      setFormError(error.message);
    },
  });

  return (
    <div className="flex w-full flex-col items-start gap-8 px-2 sm:max-w-xl lg:max-w-4xl xl:max-w-6xl">
      <h1 className="w-full text-center text-3xl font-bold">Shopping List</h1>
      <Table className="md:text-md text-xs sm:text-sm lg:text-lg">
        <TableBody>
          {shoppingItems.map((item) => (
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
          addMutation.mutate();
        }}
      >
        <Input
          className="bg-black"
          value={formItem}
          onChange={(e) => {
            setFormError("");
            setFormItem(e.target.value);
          }}
          autoComplete="off"
          disabled={addMutation.isPending || clearMutation.isPending}
        />
        <Button type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending ? "Adding..." : "Add"}
        </Button>
      </form>
      <div className="flex w-full justify-end">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsConfirmClearList((prev) => !prev)}
            variant={isConfirmClearList ? "outline" : "warning"}
            className="w-24"
            disabled={addMutation.isPending || clearMutation.isPending}
          >
            {isConfirmClearList ? "Cancel" : "Clear List"}
          </Button>
          <Button
            className={`${isConfirmClearList ? "block" : "hidden"} w-24`}
            variant={"destructive"}
            disabled={addMutation.isPending || clearMutation.isPending}
            onClick={() => clearMutation.mutate()}
          >
            Yep
          </Button>
        </div>
      </div>
    </div>
  );
}
