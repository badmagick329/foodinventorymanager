"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Food,
  FoodRemovalReason,
  MeasurementUnit,
  StorageType,
} from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ModifyFoodFormInput } from "@/lib/types";
import useModifyFoodForm from "@/hooks/useModifyFoodForm";
import { HOME } from "@/lib/urls";
import { formatAmount } from "@/lib/utils";

const DOUBLE_ESCAPE_MS = 400;

export default function ModifyFoodForm({ food }: { food?: Food }) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ModifyFoodFormInput>({
    defaultValues: {
      name: food?.name ?? "",
      amount: food?.amount ?? 1,
      unit: food?.unit ?? MeasurementUnit.unit,
      expiry: food?.expiry ?? "",
      storage: food?.storage ?? StorageType.fridge,
    },
  });
  const router = useRouter();
  const { saveMutation, deleteMutation, transferMutation } =
    useModifyFoodForm(food);
  const lastEscapePressRef = useRef(0);
  const [pendingSave, setPendingSave] = useState<ModifyFoodFormInput | null>(
    null
  );

  const onSubmit: SubmitHandler<ModifyFoodFormInput> = (data) => {
    clearErrors("root");
    const nextAmount = Number(data.amount);
    const isUsageReduction = Boolean(
      food &&
        Number.isFinite(nextAmount) &&
        data.unit === food.unit &&
        nextAmount < food.amount
    );

    if (isUsageReduction) {
      setPendingSave(data);
      return;
    }

    saveMutation.mutate(data);
  };
  const disableButtons =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    transferMutation.isPending;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || disableButtons) {
        return;
      }

      const now = Date.now();

      if (now - lastEscapePressRef.current <= DOUBLE_ESCAPE_MS) {
        e.preventDefault();
        router.push(HOME);
        return;
      }

      lastEscapePressRef.current = now;
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disableButtons, router]);

  if (deleteMutation.isPending) {
    return <p>Removing item...</p>;
  }
  if (!deleteMutation.isPending && deleteMutation.isSuccess) {
    return <p>Food deleted successfully!</p>;
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-2"
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="food-name">Food Name</Label>
          <Input
            id="food-name"
            className="bg-black"
            {...register("name", { required: true, minLength: 2 })}
            autoComplete="off"
          />
          {errors.name && <span>{errors.name.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="food-amount">Amount</Label>
          <Input
            id="food-amount"
            className="bg-black"
            {...register("amount", { required: true, min: 0.01 })}
            autoComplete="off"
          />
          {errors.amount && <span>{errors.amount.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="food-unit">Measurement Unit</Label>
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="bg-black">
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
            )}
          />
          {errors.unit && <span>{errors.unit.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="food-expiry-date" className="px-1">
            Expiry Date
          </Label>
          <Controller
            name="expiry"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="food-expiry-date"
                    className="justify-start bg-black text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? new Date(field.value).toISOString().slice(0, 10)
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    className="bg-black"
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.expiry && <span>{errors.expiry.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="food-storage">Storage</Label>
          <Controller
            name="storage"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="bg-black capitalize">
                  <SelectValue placeholder="Storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Storage</SelectLabel>
                    {Object.values(StorageType).map((v) => (
                      <SelectItem className="capitalize" key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          {errors.storage && <span>{errors.storage.message}</span>}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <Button type="submit" disabled={disableButtons}>
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          {food && (
            <div
              className="flex flex-col gap-2"
              role="group"
              aria-label="Remove item as"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Remove item as...
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  disabled={disableButtons}
                  onClick={() =>
                    deleteMutation.mutate(FoodRemovalReason.consumed)
                  }
                  aria-label="Remove item as used"
                >
                  Used
                </Button>
                <Button
                  type="button"
                  disabled={disableButtons}
                  variant="secondary"
                  onClick={() =>
                    deleteMutation.mutate(FoodRemovalReason.discarded)
                  }
                  aria-label="Remove item as discarded"
                >
                  Discarded
                </Button>
                <Button
                  type="button"
                  disabled={disableButtons}
                  variant="secondary"
                  onClick={() =>
                    deleteMutation.mutate(FoodRemovalReason.accidental_entry)
                  }
                  aria-label="Remove item as entered by mistake"
                >
                  Mistake
                </Button>
              </div>
            </div>
          )}
          <Button
            type="button"
            disabled={disableButtons}
            onClick={() => router.push(HOME)}
            variant={"outline"}
            className="bg-black"
            title="Go back to the home page (press Escape twice)"
          >
            Back (Esc twice)
          </Button>
        </div>
        {saveMutation.isError && (
          <span className="text-center text-sm text-red-500">
            {saveMutation.error.message}
          </span>
        )}
        {saveMutation.isSuccess && (
          <span className="text-center text-sm text-green-500">
            Food saved successfully!
          </span>
        )}
        {errors.root && (
          <span className="text-center text-sm text-red-500">
            {errors.root.message}
          </span>
        )}
        {transferMutation.isError && (
          <span className="text-center text-sm text-red-500">
            {transferMutation.error.message}
          </span>
        )}
      </form>
      {pendingSave && food && (
        <QuantityReductionModal
          foodName={food.name}
          previousAmount={food.amount}
          nextAmount={Number(pendingSave.amount)}
          unit={food.unit}
          sourceStorage={food.storage}
          sourceExpiry={food.expiry ?? ""}
          onCancel={() => setPendingSave(null)}
          onConfirm={() => {
            setPendingSave(null);
            saveMutation.mutate(pendingSave);
          }}
          onMove={(transfer) => {
            const hasOtherChanges =
              pendingSave.name !== food.name ||
              pendingSave.unit !== food.unit ||
              pendingSave.expiry !== (food.expiry ?? "") ||
              pendingSave.storage !== food.storage;
            if (hasOtherChanges) {
              setPendingSave(null);
              setError("root", {
                message:
                  "Move the portion before making changes to the rest of this item.",
              });
              return;
            }
            setPendingSave(null);
            transferMutation.mutate({
              amount: food.amount - Number(pendingSave.amount),
              ...transfer,
            });
          }}
        />
      )}
    </>
  );
}

function QuantityReductionModal({
  foodName,
  previousAmount,
  nextAmount,
  unit,
  sourceStorage,
  sourceExpiry,
  onCancel,
  onConfirm,
  onMove,
}: {
  foodName: string;
  previousAmount: number;
  nextAmount: number;
  unit: string;
  sourceStorage: StorageType;
  sourceExpiry: string;
  onCancel: () => void;
  onConfirm: () => void;
  onMove: (transfer: { storage: StorageType; expiry: string }) => void;
}) {
  const reduction = previousAmount - nextAmount;
  const [mode, setMode] = useState<"choice" | "move">("choice");
  const [storage, setStorage] = useState<StorageType>(
    Object.values(StorageType).find((value) => value !== sourceStorage) ??
      StorageType.fridge
  );
  const [expiry, setExpiry] = useState(sourceExpiry);

  const availableStorage = Object.values(StorageType).filter(
    (value) => value !== sourceStorage
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quantity-reduction-title"
      >
        {mode === "choice" ? (
          <>
            <h2 id="quantity-reduction-title" className="text-xl font-semibold">
              What happened to the reduced amount?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This changes {foodName} from {formatAmount(previousAmount)} {unit}{" "}
              to {formatAmount(nextAmount)} {unit}. You can record{" "}
              {formatAmount(reduction)} {unit} as used, or move it to another
              storage location.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Go back
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMode("move")}
              >
                Move it
              </Button>
              <Button type="button" onClick={onConfirm}>
                Mark as used
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 id="quantity-reduction-title" className="text-xl font-semibold">
              Move {formatAmount(reduction)} {unit}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A new entry will be created for the moved portion. Set its storage
              and, if needed, its new expiry date.
            </p>
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="move-storage">Move to</Label>
                <Select
                  value={storage}
                  onValueChange={(value) => setStorage(value as StorageType)}
                >
                  <SelectTrigger id="move-storage" className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStorage.map((value) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="capitalize"
                      >
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="move-expiry">Expiry for moved amount</Label>
                <Input
                  id="move-expiry"
                  type="date"
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  It starts with the current expiry. Leave blank if it has no
                  expiry date.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choice")}
              >
                Back
              </Button>
              <Button type="button" onClick={() => onMove({ storage, expiry })}>
                Move amount
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
