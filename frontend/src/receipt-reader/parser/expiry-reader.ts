import { ItemWithExpiry } from './types';

const noExpiry = [
  "Products with a 'use-by' date over one week",
  "Products with no 'use-by' date",
];
const dayToIndex = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export function getItemsWithExpiry(
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
    !(currentExpiry === 'tomorrow')
  ) {
    throw new Error(
      `First line should be an expiry date or 'no expiry'. Got: ${currentExpiry}`
    );
  }
  for (const line of lines) {
    if (
      noExpiry.includes(line) ||
      Object.keys(dayToIndex).includes(line) ||
      line === 'tomorrow'
    ) {
      currentExpiry = getExpiryDate(line) || '';
      continue;
    }
    out.push({
      name: line,
      expiry: currentExpiry || null,
      storage: storage as 'fridge' | 'pantry' | 'freezer',
    });
  }
  return out;
}

/**
 * Get the expiry date for a given day.
 * @param day The day that the item is supposed to expire, starting from 'today'
 * @param today The current date or date of order
 * @returns The expiry date or null if no expiry is set.
 */
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
  if (day === 'tomorrow') {
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
