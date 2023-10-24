export type LinesPerStorage = {
  fridge: string[];
  pantry: string[];
  freezer: string[];
};

export type ItemWithExpiry = {
  name: string;
  expiry: string | null;
  storage: "fridge" | "pantry" | "freezer";
};

export type FoodItem = {
  name: string;
  expiry: string | null;
  storage: "fridge" | "pantry" | "freezer";
  amount: number;
  unit: string;
};

export type Unit = "g" | "kg" | "ml" | "l" | "unit" | "cl";
