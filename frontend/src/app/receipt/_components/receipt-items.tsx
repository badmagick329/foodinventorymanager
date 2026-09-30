import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReceiptItemForm from "./receipt-item-form";
import { Button } from "@/components/ui/button";
import type { ReceiptDraft } from "@/hooks/useFoodsFromReceipt";
import { HOME } from "@/lib/urls";

export default function ReceiptItems({
  drafts,
  onChange,
  onRemove,
  onSubmit,
}: {
  drafts: ReceiptDraft[];
  onChange: (key: string, changes: Partial<ReceiptDraft>) => void;
  onRemove: (key: string) => void;
  onSubmit: () => Promise<string | undefined>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const submitError = await onSubmit();
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    await queryClient.invalidateQueries();
    router.push(HOME);
  }

  return (
    <form
      className="flex flex-col items-center gap-4"
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        // Enter in a single-line field would import the whole receipt.
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
    >
      {error && <span className="font-bold text-red-500">{error}</span>}
      <Button type="submit" disabled={submitting || drafts.length === 0}>
        {submitting ? "Importing..." : `Import ${drafts.length} items`}
      </Button>
      <div className="flex flex-wrap justify-center gap-4">
        {drafts.map((draft, index) => (
          <ReceiptItemForm
            key={draft.key}
            draft={draft}
            position={index + 1}
            onChange={(changes) => onChange(draft.key, changes)}
            onRemove={() => onRemove(draft.key)}
          />
        ))}
      </div>
    </form>
  );
}
