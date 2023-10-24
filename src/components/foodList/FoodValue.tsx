"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
import { FoodValueType } from "./FoodCard";
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
  const ref = useRef<any>(null);

  useEffect(() => {
    const handleOutSideClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target) && form) {
        setForm(false);
        setFormOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutSideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutSideClick);
    };
  }, [ref, form]);

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
    switch (foodValueType) {
      case FoodValueType.name:
        return "text-base md:text-2xl";
      case FoodValueType.expiry:
        return "text-base md:text-2xl font-bold";
      default:
        return "text-sm md:text-xl font-semibold";
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
  if (form) {
    return (
      <span ref={ref} className="flex w-full justify-center">
        {renderForm()}
      </span>
    );
  }
  return (
    <span
      className={`w-full hover:cursor-pointer hover:bg-cyan-600 rounded-md px-4 py-2 select-none ${getSpanFontCss()}`}
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
