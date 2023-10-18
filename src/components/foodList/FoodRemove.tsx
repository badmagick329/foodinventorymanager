"use client";
import { revalidateTag } from "next/cache";
import { removeFood } from "@/actions/serverActions";
import { useTransition } from "react";

interface FoodRemoveProps {
  id: number;
}

export default function FoodRemove({ id }: FoodRemoveProps) {
  // const [isPending, startTransition] = useTransition();
  return (
    <form
      className="w-full"
      action={async (e) => {
        // const remove = confirm("Are you sure you want to remove this food?");
        // if (!remove) return;
        // console.log("removing food");
        // startTransition(() => {
        //   removeFood(e);
        // });
        await removeFood(e);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input
        className="btn btn-outline btn-error"
        type="submit"
        // value={isPending ? "......" : "Remove"}
        value="Remove"
      />
    </form>
  );
}
