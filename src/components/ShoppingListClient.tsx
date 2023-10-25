"use client";
import { removeShoppingItem } from "@/actions/serverActions";
import { useState } from "react";
import { ShoppingItem } from "@prisma/client";
import { useRouter } from "next/navigation";
import RemoveButton from "./RemoveButton";

interface ShoppingListClientProps {
  baseUrl: string | undefined;
  shoppingItems: ShoppingItem[] | null;
}

export default function ShoppingListClient({
  shoppingItems,
  baseUrl,
}: ShoppingListClientProps) {
  const [item, setItem] = useState("");
  const router = useRouter();
  async function createShoppingItem() {
    if (!item.trim()) {
      return;
    }
    const trimmedName = item.trim();
    try {
      const res = await fetch(`${baseUrl}/api/shoppingitems`, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
          name: trimmedName,
        }),
      });
      if (res.status === 201) {
        console.log("Item created");
        setItem("");
        router.refresh();
      } else {
        const resp = await res.json();
        // TODO: alternative alert
        alert(resp.message);
      }
    } catch (error) {
      console.log("Error posting item");
      console.log(error);
    }
  }

  return (
    <div className="flex flex-col items-start p-2 w-full sm:w-3/4 lg:w-1/2">
      {shoppingItems?.map((item) => (
        <div
          key={item.id}
          className="flex w-full px-2 space-y-2 justify-between items-center"
        >
          <span className="w-full text-xl">{item.name}</span>
          <RemoveButton id={item.id} removeCallback={removeShoppingItem} />
        </div>
      ))}
      <div className="flex w-full p-2 space-x-2">
        <input
          className="input input-primary w-full"
          type="text"
          name="name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          autoComplete="off"
        />
        <button
          className="btn bg-color-1 hover:bg-cyan-600"
          onClick={createShoppingItem}
        >
          Add
        </button>
      </div>
    </div>
  );
}
