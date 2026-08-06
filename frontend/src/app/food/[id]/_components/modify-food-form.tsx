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

const DOUBLE_ESCAPE_MS = 400;

export default function ModifyFoodForm({ food }: { food?: Food }) {
  const {
    register,
    handleSubmit,
    control,
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
  const { saveMutation, deleteMutation } = useModifyFoodForm(food);
  const lastEscapePressRef = useRef(0);
  const [pendingSave, setPendingSave] = useState<ModifyFoodFormInput | null>(
    null
  );

  const onSubmit: SubmitHandler<ModifyFoodFormInput> = (data) => {
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
  const disableButtons = saveMutation.isPending || deleteMutation.isPending;

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
      </form>
      {pendingSave && food && (
        <QuantityReductionModal
          foodName={food.name}
          previousAmount={food.amount}
          nextAmount={Number(pendingSave.amount)}
          unit={food.unit}
          onCancel={() => setPendingSave(null)}
          onConfirm={() => {
            setPendingSave(null);
            saveMutation.mutate(pendingSave);
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
  onCancel,
  onConfirm,
}: {
  foodName: string;
  previousAmount: number;
  nextAmount: number;
  unit: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduction = previousAmount - nextAmount;

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
        <h2 id="quantity-reduction-title" className="text-xl font-semibold">
          Mark quantity as used?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          This changes {foodName} from {previousAmount} {unit} to {nextAmount}{" "}
          {unit}. Mark {reduction} {unit} as used in food history?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Go back
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm &amp; Save
          </Button>
        </div>
      </div>
    </div>
  );
}
