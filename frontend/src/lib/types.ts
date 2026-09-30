import { StorageType } from "@prisma/client";
export type StorageFiltersState = Record<StorageType, boolean>;

export type SearchFilter = {
  text?: string;
  storageTypes?: StorageType[];
};

export type ModifyFoodFormInput = {
  name: string;
  amount: number;
  unit: string;
  expiry: string;
  storage: StorageType;
};

export type FoodTransferInput = {
  amount: number;
  expiry: string;
  storage: StorageType;
};
