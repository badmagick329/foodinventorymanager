"use client";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";

interface RemoveProps {
  id: number;
  removeCallback: CallableFunction;
}

export default function RemoveButton({ id, removeCallback }: RemoveProps) {
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
          <RxCross1 />
        </button>
      ) : null}
      <button
        className={`btn btn-outline ${confirm ? "btn-error" : "btn-warning"}`}
        type="submit"
        formAction={async (e) => {
          if (!confirm) {
            setConfirm(true);
            return;
          }
          await removeCallback(e);
        }}
      >
        <FaRegTrashAlt />
      </button>
    </form>
  );
}
