"use client";
import { Button } from "@/components/ui/button";
import { apiFetch, queryKeys } from "@/lib/api-client";
import { API_SHOPPING_URL } from "@/lib/urls";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";

export default function RemoveButton({ id }: { id: number }) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`${API_SHOPPING_URL}${id}/`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.shopping }),
  });

  return (
    <div className="flex justify-end gap-2">
      {confirming && (
        <Button
          type="button"
          variant="warning"
          aria-label="Keep item"
          onClick={() => setConfirming(false)}
        >
          <RxCross1 />
        </Button>
      )}
      <Button
        type="button"
        variant={confirming ? "destructive" : "default"}
        aria-label={confirming ? "Confirm remove" : "Remove item"}
        disabled={mutation.isPending}
        onClick={() => (confirming ? mutation.mutate() : setConfirming(true))}
      >
        <FaRegTrashAlt />
      </Button>
    </div>
  );
}
