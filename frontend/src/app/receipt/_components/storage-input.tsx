import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { StorageType } from "@prisma/client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StorageInput({ food }: { food: FoodFromReceipt }) {
  const [isChanged, setIsChanged] = useState(true);

  return (
    <div className="flex w-full flex-col gap-1">
      <Label>Storage</Label>
      <Select
        onValueChange={(val) => {
          if (!isStorageType(val)) {
            return;
          }
          food.storage = val;
          setIsChanged(!isChanged);
        }}
        defaultValue={food.storage}
      >
        <SelectTrigger className="bg-background capitalize text-foreground">
          <SelectValue placeholder="Storage Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Storage Type</SelectLabel>
            {Object.values(StorageType).map((v) => (
              <SelectItem className="capitalize" key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function isStorageType(v: unknown): v is StorageType {
  return (
    typeof v === "string" && Object.values(StorageType).some((s) => s === v)
  );
}
