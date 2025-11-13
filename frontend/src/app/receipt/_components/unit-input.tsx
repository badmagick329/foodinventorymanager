import { FoodFromReceipt, unitValues } from "@/receipt-reader/parser/types";
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
import { MeasurementUnit } from "@prisma/client";

export default function UnitInput({ food }: { food: FoodFromReceipt }) {
  const [isChanged, setIsChanged] = useState(true);

  return (
    <div className="flex w-full flex-col gap-1">
      <Label className="px-2 text-xs">Unit</Label>
      <Select
        onValueChange={(val) => {
          food.unit = val;
          setIsChanged(!isChanged);
        }}
        defaultValue={food.unit}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Measurement Unit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Measurement Unit</SelectLabel>
            {Object.values(MeasurementUnit).map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
