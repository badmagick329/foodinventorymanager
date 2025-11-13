import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FoodFromReceipt } from "@/receipt-reader/parser/types";
import { useState } from "react";

export default function NameInput({ food }: { food: FoodFromReceipt }) {
  const [isChanged, setIsChanged] = useState(true);

  return (
    <div className="flex w-full flex-col gap-1">
      <Label>Name</Label>
      <Textarea
        rows={4}
        className="bg-background"
        autoComplete="off"
        value={food.name}
        onChange={(e) => {
          food.name = e.target.value;
          setIsChanged(!isChanged);
        }}
        spellCheck={false}
      />
    </div>
  );
}
