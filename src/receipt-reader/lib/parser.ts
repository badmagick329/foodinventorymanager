import {
  FoodFromReceipt,
  ItemWithExpiry,
  LinesPerStorage,
  Unit,
} from "./types";

const dayToIndex = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wendsday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const noExpiry = [
  "Products with a 'use-by' date over one week",
  "Products with no 'use-by' date",
];

export default function parseLines(lines: string[]) {
  const storageLines = splitByStorage(lines);
  let out = [] as FoodFromReceipt[];
  for (const [key, value] of Object.entries(storageLines)) {
    const items = combineItems(
      getFoodItems(getItemsWithExpiry(value as string[], key))
    );
    out = out.concat(items);
  }
  return out;
}

function splitByStorage(lines: string[]): LinesPerStorage {
  const out = {
    fridge: [] as string[],
    pantry: [] as string[],
    freezer: [] as string[],
  };
  if (
    lines[0] !== "Fridge" &&
    lines[0] !== "Cupboard" &&
    lines[0] !== "Freezer"
  ) {
    throw new Error(`First line should be a storage type. Got: ${lines[0]}`);
  }
  let currentStorage = lines[0];
  for (const line of lines) {
    if (line === "Fridge" || line === "Cupboard" || line === "Freezer") {
      currentStorage = line === "Cupboard" ? "pantry" : line.toLowerCase();
      continue;
    }
    out[currentStorage as keyof LinesPerStorage].push(line);
  }
  return out;
}

function getItemsWithExpiry(
  lines: string[],
  storage: string
): ItemWithExpiry[] {
  const out = [] as ItemWithExpiry[];
  if (lines.length === 0) {
    return out;
  }
  let currentExpiry = lines[0];
  if (
    !noExpiry.includes(currentExpiry) &&
    !Object.keys(dayToIndex).includes(currentExpiry) &&
    !(currentExpiry === "tomorrow")
  ) {
    throw new Error(
      `First line should be an expiry date or 'no expiry'. Got: ${currentExpiry}`
    );
  }
  for (const line of lines) {
    if (
      noExpiry.includes(line) ||
      Object.keys(dayToIndex).includes(line) ||
      line === "tomorrow"
    ) {
      currentExpiry = getExpiryDate(line) || "";
      continue;
    }
    out.push({
      name: line,
      expiry: currentExpiry || null,
      storage: storage as "fridge" | "pantry" | "freezer",
    });
  }
  return out;
}

function getFoodItems(items: ItemWithExpiry[]): FoodFromReceipt[] {
  const out = [] as FoodFromReceipt[];
  for (const item of items) {
    let amount = getAmount(item.name);
    let unit = getUnit(item.name);
    [amount, unit] = normalizeAmounts(amount, unit);
    const name = getName(item.name);
    out.push({
      name,
      expiry: item.expiry as string,
      storage: item.storage,
      amount,
      unit,
    });
  }
  return out;
}

export function getExpiryDate(
  day: string,
  today: Date | undefined = undefined
): string | null {
  if (noExpiry.includes(day)) {
    return null;
  }
  if (today === undefined) {
    today = new Date();
  }
  const todayIndex = today.getDay();
  if (day === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  const dayIndex = dayToIndex[day as keyof typeof dayToIndex];
  let daysToAdd = dayIndex - todayIndex;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);
  return expiryDate.toISOString().slice(0, 10);
}

const amountAndUnitRegex = /(\d+)(\w*)/;
function getAmount(line: string): number {
  const match = line.match(amountAndUnitRegex);
  if (match === null) {
    return 1;
  }
  return parseInt(match[1]);
}

function getUnit(line: string): Unit {
  const match = line.match(amountAndUnitRegex);
  if (match === null || match[2] === "") {
    return "unit" as Unit;
  }
  const unit = match[2];
  if (
    unit === "g" ||
    unit === "kg" ||
    unit === "ml" ||
    unit === "l" ||
    unit === "cl"
  ) {
    return unit as Unit;
  }
  return "unit" as Unit;
}

function getName(line: string): string {
  const match = line.match(amountAndUnitRegex);
  if (match === null) {
    return line;
  }
  return line.replace(match[0], "").trim();
}

function normalizeAmounts(amount: number, unit: Unit): [number, Unit] {
  switch (unit) {
    case "kg":
      return [amount * 1000, "g"];
    case "l":
      return [amount * 1000, "ml"];
    case "cl":
      return [amount * 10, "ml"];
    default:
      return [amount, unit];
  }
}

function combineItems(items: FoodFromReceipt[]): FoodFromReceipt[] {
  return items.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.name === item.name);
    if (existingItem) {
      existingItem.amount += item.amount;
      return acc;
    }
    return acc.concat(item);
  }, [] as FoodFromReceipt[]);
}
