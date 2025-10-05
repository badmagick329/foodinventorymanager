import type { FoodItem } from "../tool.foods";

export type ExpiryStatus = "expired" | "expiring_soon" | "fresh";

export type FoodWithExpiry = FoodItem & {
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
};

const EXPIRING_SOON_DAYS = 3;

function calculateExpiryStatus(expiryDate: string | null): {
  status: ExpiryStatus;
  daysUntil: number | null;
} {
  if (!expiryDate) {
    return { status: "fresh", daysUntil: null };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "expired", daysUntil: diffDays };
  } else if (diffDays <= EXPIRING_SOON_DAYS) {
    return { status: "expiring_soon", daysUntil: diffDays };
  } else {
    return { status: "fresh", daysUntil: diffDays };
  }
}

export function checkExpiry(foods: FoodItem[]): {
  expired: FoodWithExpiry[];
  expiringSoon: FoodWithExpiry[];
  fresh: FoodWithExpiry[];
} {
  const expired: FoodWithExpiry[] = [];
  const expiringSoon: FoodWithExpiry[] = [];
  const fresh: FoodWithExpiry[] = [];

  for (const food of foods) {
    const { status, daysUntil } = calculateExpiryStatus(food.expiry);
    const foodWithExpiry: FoodWithExpiry = {
      ...food,
      expiryStatus: status,
      daysUntilExpiry: daysUntil,
    };

    if (status === "expired") {
      expired.push(foodWithExpiry);
    } else if (status === "expiring_soon") {
      expiringSoon.push(foodWithExpiry);
    } else {
      fresh.push(foodWithExpiry);
    }
  }

  return { expired, expiringSoon, fresh };
}
