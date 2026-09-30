import { MeasurementUnit, StorageType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReceiptDraft } from "@/hooks/useFoodsFromReceipt";

export default function ReceiptItemForm({
  draft,
  position,
  onChange,
  onRemove,
}: {
  draft: ReceiptDraft;
  position: number;
  onChange: (changes: Partial<ReceiptDraft>) => void;
  onRemove: () => void;
}) {
  const id = (field: string) => `receipt-${draft.key}-${field}`;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-md bg-secondary p-2">
      <div className="flex w-full justify-between">
        <span className="text-xl">Item {position}</span>
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-slate-400"
          aria-label={`Remove item ${position}`}
          onClick={onRemove}
        >
          ❌
        </button>
      </div>
      <div className="flex w-full flex-col gap-1">
        <Label htmlFor={id("name")}>Name</Label>
        <Textarea
          id={id("name")}
          rows={4}
          className="bg-background"
          autoComplete="off"
          spellCheck={false}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <Label htmlFor={id("expiry")}>Expiry</Label>
        <Input
          id={id("expiry")}
          className="bg-background"
          placeholder="YYYY-MM-DD or Leave blank"
          value={draft.expiry}
          onChange={(e) => onChange({ expiry: e.target.value })}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <Label>Storage</Label>
        <Select
          value={draft.storage}
          onValueChange={(storage) =>
            onChange({ storage: storage as StorageType })
          }
        >
          <SelectTrigger className="bg-background capitalize text-foreground">
            <SelectValue placeholder="Storage Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Storage Type</SelectLabel>
              {Object.values(StorageType).map((storage) => (
                <SelectItem
                  className="capitalize"
                  key={storage}
                  value={storage}
                >
                  {storage}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={id("amount")} className="px-2 text-xs">
            Amount
          </Label>
          <Input
            id={id("amount")}
            className="bg-background"
            type="number"
            inputMode="decimal"
            autoComplete="off"
            min="0.01"
            step="any"
            value={draft.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label className="px-2 text-xs">Unit</Label>
          <Select
            value={draft.unit}
            onValueChange={(unit) => onChange({ unit })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Measurement Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Measurement Unit</SelectLabel>
                {Object.values(MeasurementUnit).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
