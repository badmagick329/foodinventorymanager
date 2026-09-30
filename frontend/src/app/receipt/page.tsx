"use client";
import useFoodsFromReceipt from "@/hooks/useFoodsFromReceipt";
import { useState } from "react";
import ReceiptItems from "./_components/receipt-items";

export default function Receipt() {
  const receipt = useFoodsFromReceipt();
  const [fileChosen, setFileChosen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className={`flex flex-col gap-2 rounded-md border-2 p-2 ${fileChosen ? "border-green-500" : "border-gray-500"}`}
      >
        <label className="font-semibold" htmlFor="receipt-file">
          {fileChosen ? "File Chosen ✅" : "Choose Ocado Receipt PDF"}
        </label>
        <input
          id="receipt-file"
          type="file"
          accept="application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await receipt.readFile(file);
            setFileChosen(true);
          }}
        />
      </div>
      {receipt.readError && (
        <span className="font-bold text-red-500">{receipt.readError}</span>
      )}
      {receipt.drafts && (
        <ReceiptItems
          drafts={receipt.drafts}
          onChange={receipt.updateDraft}
          onRemove={receipt.removeDraft}
          onSubmit={receipt.submit}
        />
      )}
    </div>
  );
}
