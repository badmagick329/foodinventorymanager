"use client";
import { removeShoppingItem, addShoppingItem } from "@/actions/serverActions";
import { useState } from "react";
import { ShoppingItem } from "@prisma/client";
import RemoveButton from "@/components/remove-button";
import ShoppingItemDisplay from "./shopping-item-display";

interface ShoppingListProps {
  shoppingItems: ShoppingItem[] | null;
}

export default function ShoppingList({ shoppingItems }: ShoppingListProps) {
  const [item, setItem] = useState("");

  return (
    <div className="flex flex-col items-start p-2 w-full sm:w-3/4 lg:w-1/2">
      {shoppingItems?.map((item) => (
        <div
          key={item.id}
          className="flex w-full px-2 space-y-2 justify-between items-center"
        >
          <ShoppingItemDisplay item={item} />
          <RemoveButton id={item.id} removeCallback={removeShoppingItem} />
        </div>
      ))}
      <form
        className="flex w-full p-2 space-x-2"
        action={(e) => {
          setItem("");
          addShoppingItem(e);
        }}
      >
        <input
          className="input input-primary w-full"
          type="text"
          name="name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          autoComplete="off"
        />
        <button className="btn bg-color-1 hover:bg-cyan-600" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}
