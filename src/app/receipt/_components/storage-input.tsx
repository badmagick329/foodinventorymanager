import { FoodFromReceipt } from "@/receipt-reader/lib/types";
import { StorageType } from "@prisma/client";
import { useState } from "react";

export default function StorageInput({
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
      <label className="px-2 text-xs">Storage</label>
      <select
        className={style}
        value={foods[idx].storage}
        onChange={(e) => {
          // @ts-ignore
          foods[idx].storage = e.target.value;
          setIsChanged(!isChanged);
        }}
      >
        {Object.keys(StorageType).map((storageType) => (
          <option key={storageType} value={storageType}>
            {storageType}
          </option>
        ))}
      </select>
    </div>
  );
}
