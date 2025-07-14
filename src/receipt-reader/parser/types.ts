export const receiptStorageValues = [
  'fridge',
  'pantry',
  'freezer',
  'spices',
] as const;
export const unitValues = ['g', 'kg', 'ml', 'l', 'unit', 'cl'] as const;

export type ReceiptStorageType = (typeof receiptStorageValues)[number];
export type Unit = (typeof unitValues)[number];

export type LinesPerStorage = {
  fridge: string[];
  pantry: string[];
  freezer: string[];
};

export type ItemWithExpiry = {
  name: string;
  expiry: string | null;
  storage: ReceiptStorageType;
};

export type FoodFromReceipt = {
  name: string;
  expiry: string | null;
  storage: ReceiptStorageType;
  amount: number;
  unit: string;
};
