import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatAmount(amount: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(amount);
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysUntil(dateString: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function daysUntilExpiryToBorderColor(daysUntil: number): string {
  if (daysUntil < 0) {
    return "border-red-500";
  }

  if (daysUntil <= 3) {
    return "border-orange-400";
  }

  return "border-green-500";
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;
}
