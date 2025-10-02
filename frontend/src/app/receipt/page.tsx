"use client";
import useFoodsFromReceipt from "@/hooks/useFoodsFromReceipt";
import { useState } from "react";
import ReceiptItems from "./_components/receipt-items";

export default function Receipt() {
  const { foodsFromReceipt, readFile, sendData } = useFoodsFromReceipt();
  const [file, setFile] = useState<File | null>(null);
  const labelText = file ? "File Chosen ✅" : "Choose Ocado Receipt PDF";
  const borderColor = file ? "border-green-500" : "border-gray-500";

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className={`flex flex-col p-2 ${borderColor} border-2 rounded-md gap-2`}
      >
        <label className="font-semibold">{labelText}</label>
        <input
          type="file"
          accept="application/pdf"
          name="file"
          onChange={(e) => handleChange(e, readFile, setFile)}
        />
      </div>
      <ReceiptItems foods={foodsFromReceipt} sendData={sendData} />
    </div>
  );
}

async function handleChange(
  e: React.ChangeEvent<HTMLInputElement>,
  readFile: (file: File) => Promise<void>,
  setFile: (file: File | null) => void
) {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }
  await readFile(file);
  setFile(file);
}
