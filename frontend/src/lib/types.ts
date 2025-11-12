import { StorageType } from "@prisma/client";
export type StorageFiltersType = Record<string, boolean>;

export type NewFoodFormValues = {
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: string;
};

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
