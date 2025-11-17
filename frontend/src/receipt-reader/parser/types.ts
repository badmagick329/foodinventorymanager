import { StorageType } from "@prisma/client";

export type LinesPerStorage = {
  fridge: string[];
  pantry: string[];
  freezer: string[];
};

export type ItemWithExpiry = {
  name: string;
  expiry: string | null;
  storage: StorageType;
};

export type FoodFromReceipt = {
  name: string;
  expiry: string | null;
  storage: StorageType;
  amount: number;
  unit: string;
};
