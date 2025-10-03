export type FoodItem = {
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  storage: string;
};

const listUrl = process.env.API_BASE_URL;

export async function listFoods(): Promise<FoodItem[]> {
  if (!listUrl) {
    throw new Error("API_BASE_URL not set");
  }
  const result = await fetch(listUrl);
  if (!result.ok) {
    console.error("Failed to fetch food list, using hardcoded list");
    throw new Error(`API error ${result.status}: ${await result.text()}`);
  }

  try {
    const foods = (await result.json()) as FoodItem[];
    return foods;
  } catch (e) {
    console.error("Failed to parse food list", e);
    throw e;
  }
}
