"use client";
import { removeFood } from "@/actions/serverActions";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { GiCancel } from "react-icons/gi";

interface FoodRemoveProps {
  id: number;
}

export default function FoodRemove({ id }: FoodRemoveProps) {
  const [confirm, setConfirm] = useState(false);
  return (
    <form className="flex w-full justify-end gap-2 m-2">
      <input type="hidden" name="id" value={id} />
      {confirm ? (
        <button
          className="btn btn-outline btn-warning"
          onClick={() => {
            setConfirm(false);
          }}
        >
          <GiCancel />
        </button>
      ) : null}
      <button
        className={`btn btn-outline ${confirm ? "btn-error" : "btn-warning"}`}
        type="submit"
        value="Remove"
        formAction={async (e) => {
          if (!confirm) {
            setConfirm(true);
            return;
          }
          await removeFood(e);
        }}
      >
        <FaRegTrashAlt />
      </button>
    </form>
  );
}
