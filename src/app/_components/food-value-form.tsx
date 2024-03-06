import React from "react";
import { FoodValueType } from "./food-card";

import {
  FoodAmountForm,
  FoodExpiryForm,
  FoodNameForm,
  FoodStorageForm,
  FoodUnitForm,
} from "./food-edit-form";

import {
  updateFoodAmount,
  updateFoodExpiry,
  updateFoodName,
  updateFoodStorage,
  updateFoodUnit,
} from "@/actions/serverActions";

import { parseErrors } from "@/lib/utils";
import { StorageType, MeasurementUnit } from "@prisma/client";

export default function FoodValueForm({
  id,
  value,
  foodValueType,
  setForm,
  setFormOpen,
}: {
  id: number;
  value: number | string;
  foodValueType: FoodValueType;
  setForm: React.Dispatch<React.SetStateAction<boolean>>;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  switch (foodValueType) {
    case "name":
      return (
        <FoodNameForm
          id={id}
          value={value as string}
          updater={async (id: number, value: string) => {
            const res = await updateFoodName(id, value);
            if (res.errors) {
              alert(parseErrors(res.errors));
            }
            setForm(false);
            setFormOpen(false);
          }}
        />
      );
    case "amount":
      return (
        <FoodAmountForm
          id={id}
          value={Number(value)}
          updater={async (id: number, value: string) => {
            const res = await updateFoodAmount(id, Number(value));
            if (res.errors) {
              alert(parseErrors(res.errors));
            }
            setForm(false);
            setFormOpen(false);
          }}
        />
      );
    case "unit":
      return (
        <FoodUnitForm
          id={id}
          value={value}
          updater={async (id: number, value: string) => {
            const res = await updateFoodUnit(id, value as MeasurementUnit);
            if (res.errors) {
              alert(parseErrors(res.errors));
            }
            setForm(false);
            setFormOpen(false);
          }}
        />
      );
    case "storage":
      return (
        <FoodStorageForm
          id={id}
          value={value}
          updater={async (id: number, value: string) => {
            const res = await updateFoodStorage(id, value as StorageType);
            if (res.errors) {
              alert(parseErrors(res.errors));
            }
            setForm(false);
            setFormOpen(false);
          }}
        />
      );
    case "expiry":
      return (
        <FoodExpiryForm
          id={id}
          value={value ? value : new Date().toISOString().slice(0, 10)}
          updater={async (id: number, value: string) => {
            const res = await updateFoodExpiry(id, value);
            if (res.errors) {
              alert(parseErrors(res.errors));
            }
            setForm(false);
            setFormOpen(false);
          }}
        />
      );
    default:
      return <span className="text-2xl font-semibold">{foodValueType}???</span>;
  }
}
