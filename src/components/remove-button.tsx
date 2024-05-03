"use client";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";

export default function RemoveButton({
  id,
  removeCallback,
}: {
  id: number;
  removeCallback: CallableFunction;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <form className="flex justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <CancelButton confirm={confirm} setConfirm={setConfirm} />
      <ConfirmRemoveButton
        confirm={confirm}
        setConfirm={setConfirm}
        removeCallback={removeCallback}
      />
    </form>
  );
}

function CancelButton({
  confirm,
  setConfirm,
}: {
  confirm: boolean;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  if (confirm) {
    return (
      <button
        className="btn btn-outline btn-warning"
        onClick={() => {
          setConfirm(false);
        }}
      >
        <RxCross1 />
      </button>
    );
  }
  return null;
}

function ConfirmRemoveButton({
  confirm,
  setConfirm,
  removeCallback,
}: {
  confirm: boolean;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  removeCallback: CallableFunction;
}) {
  const buttonColor = confirm ? "btn-error" : "btn-warning";

  return (
    <button
      className={`btn btn-outline ${buttonColor}`}
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
  );
}
