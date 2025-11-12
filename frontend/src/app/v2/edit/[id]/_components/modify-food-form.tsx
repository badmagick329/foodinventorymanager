"use client";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Food, MeasurementUnit, StorageType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface IFormInput {
  name: string;
  amount: number;
  unit: string;
  expiry: string;
  storage: StorageType;
}

export default function ModifyFoodForm({ food }: { food: Food }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IFormInput>({
    defaultValues: {
      name: food.name,
      amount: food.amount,
      unit: food.unit,
      expiry: food.expiry ?? "",
      storage: food.storage,
    },
  });
  const queryClient = useQueryClient();
  const router = useRouter();

  const editMutation = useMutation({
    mutationFn: async (data: IFormInput) => {
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update food");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      queryClient.invalidateQueries({ queryKey: ["food", food.id.toString()] });
    },
    onError: (error: Error) => {
      console.error("Failed to update food:", error.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete food");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      queryClient.invalidateQueries({ queryKey: ["food", food.id.toString()] });
      router.push("/v2");
    },
    onError: (error: Error) => {
      console.error("Failed to delete food:", error.message);
    },
  });

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    editMutation.mutate(data);
  };
  const disableButtons = editMutation.isPending || deleteMutation.isPending;

  if (deleteMutation.isPending) {
    return <p>Deleting...</p>;
  }
  if (!deleteMutation.isPending && deleteMutation.isSuccess) {
    return <p>Food deleted successfully!</p>;
  }

  return (
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
              <SelectTrigger className="bg-black">
                <SelectValue placeholder="Storage" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Storage</SelectLabel>
                  <SelectItem value="fridge">Fridge</SelectItem>
                  <SelectItem value="freezer">Freezer</SelectItem>
                  <SelectItem value="pantry">Pantry</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        {errors.storage && <span>{errors.storage.message}</span>}
      </div>
      <div className="mt-4 flex justify-between">
        <Button type="submit" disabled={disableButtons}>
          {editMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          disabled={disableButtons}
          variant={"destructive"}
          onClick={() => deleteMutation.mutate()}
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
        {/* TODO: Update Route */}
        <Button
          disabled={disableButtons}
          onClick={() => router.push("/v2")}
          variant={"outline"}
          className="bg-black"
        >
          Back
        </Button>
      </div>
      {editMutation.isError && (
        <span className="text-center text-sm text-red-500">
          {editMutation.error.message}
        </span>
      )}
      {editMutation.isSuccess && (
        <span className="text-center text-sm text-green-500">
          Food updated successfully!
        </span>
      )}
    </form>
  );
}
