export type StorageFiltersType = Record<string, boolean>;

export type NewFoodFormValues = {
  name: string;
  amount: string;
  unit: string;
  expiry: string;
  storage: string;
};

export type StorageType = "fridge" | "freezer" | "pantry" | "spices";
export type StorageFiltersState = Record<StorageType, boolean>;

export type SearchFilter = {
  text?: string;
  storageTypes?: StorageType[];
};
