import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { useState } from "react";

export default function NameInput({
  style,
  foods,
  idx,
}: {
  style: string;
  foods: FoodFromReceipt[];
  idx: number;
}) {
  const [isChanged, setIsChanged] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <label className="px-2 text-xs">Name</label>
      <textarea
        rows={4}
        className={`${style} p-2 h-16 resize-none`}
        autoComplete="off"
        value={foods[idx].name}
        onChange={(e) => {
          foods[idx].name = e.target.value;
          setIsChanged(!isChanged);
        }}
        spellCheck={false}
      />
    </div>
  );
}
