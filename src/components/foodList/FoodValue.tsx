"use client";

import { useState } from "react";
import { useCallback, useEffect } from "react";
import {
  updateFoodAmount,
  updateFoodExpiry,
  updateFoodName,
  updateFoodStorage,
  updateFoodUnit,
} from "@/actions/serverActions";
import {
  FoodAmountForm,
  FoodExpiryForm,
  FoodNameForm,
  FoodStorageForm,
  FoodUnitForm,
} from "./FoodEditForm";
import { FoodValueType } from "./FoodComp";
import { parseErrors, uppercaseFirst } from "@/lib/utils";
import { MeasurementUnit, StorageType } from "@prisma/client";

interface Props {
  id: number;
  value: number | string;
  foodValueType: FoodValueType;
  formOpen: boolean;
  setFormOpen: CallableFunction;
}

export default function FoodValue({
  id,
  value,
  foodValueType,
  formOpen,
  setFormOpen,
}: Props) {
  const [form, setForm] = useState(false);
  const onDismiss = useCallback(() => {
    setForm(false);
    setFormOpen(false);
  }, [form]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss],
  );

  function renderForm() {
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
        return (
          <span className="text-2xl font-semibold">{foodValueType}???</span>
        );
    }
  }

  function getDisplayValue() {
    if (foodValueType === FoodValueType.expiry && !value) {
      return "No Expiry";
    } else {
      return uppercaseFirst(value as string);
    }
  }

  function getSpanFontCss() {
    return foodValueType === FoodValueType.name
      ? "text-xl font-semibold"
      : "text-base";
  }

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
  if (form) {
    return <span className="w-full">{renderForm()}</span>;
  }
  return (
    <span
      className={`w-full hover:cursor-pointer hover:bg-slate-800 px-2 py-2 select-none ${getSpanFontCss()}`}
      onClick={(e) => {
        if (!formOpen) {
          setFormOpen(true);
          setForm(true);
        }
      }}
    >
      {getDisplayValue()}
    </span>
  );
}
// {foodValueType === FoodValueType.unit
//   ? (value as string).toUpperCase()
//   : uppercaseFirst(value)}
