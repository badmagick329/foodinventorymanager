"use client";
import { Button } from "@/components/ui/button";
import { API_SHOPPING_URL } from "@/lib/urls";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";

export default function RemoveButton({ id }: { id: number }) {
  const [confirm, setConfirm] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_SHOPPING_URL}${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove shopping item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
    },
    onError: (error: Error) => {
      console.error("Failed to remove shopping item:", error.message);
    },
  });

  return (
    <form className="flex justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <CancelButton confirm={confirm} setConfirm={setConfirm} />
      <ConfirmRemoveButton
        confirm={confirm}
        setConfirm={setConfirm}
        removeCallback={mutation.mutate}
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
      <Button
        variant={"warning"}
        onClick={() => {
          setConfirm(false);
        }}
      >
        <RxCross1 />
      </Button>
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
  return (
    <Button
      variant={confirm ? "destructive" : "default"}
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
    </Button>
  );
}
