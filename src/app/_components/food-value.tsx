import { useEffect, useRef, useState, useCallback } from "react";
import { FoodValueType } from "./food-card";
import { uppercaseFirst } from "@/lib/utils";
import { StorageType } from "@prisma/client";
import { getCardHoverColor } from "@/lib/utils";
import FoodValueForm from "./food-value-form";

interface FoodValueProps {
  id: number;
  value: number | string;
  foodValueType: FoodValueType;
  formOpen: boolean;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  storageType: StorageType;
}

export default function FoodValue({
  id,
  value,
  foodValueType,
  formOpen,
  setFormOpen,
  storageType,
}: FoodValueProps) {
  const [form, setForm] = useState(false);
  const ref = useRef<any>(null);

  const onDismiss = useCallback(() => {
    setForm(false);
    setFormOpen(false);
  }, [form, setFormOpen]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

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
  }, [ref, form, setFormOpen]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (form) {
    return (
      <div ref={ref}>
        <FoodValueForm
          id={id}
          value={value}
          foodValueType={foodValueType}
          setForm={setForm}
          setFormOpen={setFormOpen}
        />
      </div>
    );
  }

  const spanCss = getSpanFontCss(foodValueType);
  const hoverCardColor = getCardHoverColor(storageType);

  return (
    <span
      className={`hover:cursor-pointer ${hoverCardColor} rounded-md px-4 py-2 select-none ${spanCss}`}
      onClick={(e) => {
        if (!formOpen) {
          setFormOpen(true);
          setForm(true);
        }
      }}
    >
      {getDisplayValue(foodValueType, value)}
    </span>
  );
}

function getDisplayValue(foodValueType: FoodValueType, value: string | number) {
  if (foodValueType === FoodValueType.expiry && !value) {
    return "No Expiry";
  } else {
    return uppercaseFirst(value as string);
  }
}

function getSpanFontCss(foodValueType: FoodValueType) {
  switch (foodValueType) {
    case FoodValueType.name:
      return "text-base md:text-2xl";
    case FoodValueType.expiry:
      return "text-base md:text-2xl font-bold";
    default:
      return "text-sm md:text-xl font-semibold";
  }
}
