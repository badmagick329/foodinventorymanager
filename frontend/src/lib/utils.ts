import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function parseErrors(errors: string): string[] {
  return JSON.parse(errors).map(
    (err: any) =>
      `${err.path[0].slice(0, 1).toUpperCase()}${err.path[0].slice(1)}: ${
        err.message
      }`
  );
}

export function uppercaseFirst(str: string | number) {
  if (typeof str === "number") {
    return str;
  }
  return `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`;
}

export function getColorByStorage(storageType: string) {
  switch (storageType) {
    case "fridge":
      return "bg-green-900";
    case "freezer":
      return "bg-blue-700";
    case "pantry":
      return "bg-amber-700";
    default:
      return "bg-orange-900";
  }
}

export function getHoverColorByStorage(storageType: string) {
  switch (storageType) {
    case "fridge":
      return "hover:bg-green-700";
    case "freezer":
      return "hover:bg-blue-500";
    case "pantry":
      return "hover:bg-amber-500";
    default:
      return "hover:bg-orange-700";
  }
}

export function validDateStringOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  if (isNaN(Date.parse(value))) {
    return value;
  }
  return null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNewExpiryValFromUserInput(expiry: string): {
  val: string | null;
  isError: boolean;
} {
  let val = expiry === "" || expiry === null ? null : String(expiry).trim();
  if (val === null) {
    return { val, isError: false };
  }

  if (!new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(val)) {
    return {
      val: "Expiry must be in YYYY-MM-DD format or empty",
      isError: true,
    };
  }

  const expiryDate = new Date(val);
  if (isNaN(expiryDate.getTime())) {
    return {
      val: "Expiry must be a valid date or null",
      isError: true,
    };
  }
  val = expiryDate.toISOString().slice(0, 10);
  return { val, isError: false };
}
