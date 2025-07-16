import { FoodFromReceipt, ItemWithExpiry, LinesPerStorage } from './types';
import { getItemsWithExpiry } from './expiry-reader';
import { untrackedItems, untrackedWordCombinations } from './consts';
import { Cleaner } from './cleaner';

type FullItemReGroups = {
  description?: string;
  bundle?: string;
  price?: string;
};

export class Parser {
  _lines: string[];
  _linesPerStorage: LinesPerStorage | null = null;
  _itemsWithExpiry: ItemWithExpiry[] | null = null;
  _foodItems: FoodFromReceipt[] | null = null;

  private quantityPerRe = /.+?(?<quantityText>(?<quantity>\d+) per ).+/;
  private quantityXRe = /.+(?<quantityText>(?<quantity>\d+) x ).+/;
  private fullItemRe =
    /(?<description>[\w\s,%-_]+)?\s?(?<bundle>\d+)\/(?:\d+)£(?<price>\d+\.\d+)/;

  constructor(lines: string[]) {
    this._lines = lines;
  }

  static create(
    receiptText: string | null = null,
    cleaner: Cleaner | null = null
  ) {
    if (!cleaner) {
      if (!receiptText) {
        throw new Error('Text or cleaner must be provided');
      }
      cleaner = new Cleaner(receiptText.split('\n'));
    }
    return new Parser(cleaner.clean());
  }

  parse(): FoodFromReceipt[] {
    this._toLinesPerStorage();
    if (!this._linesPerStorage) {
      throw new Error('Failed to parse lines per storage');
    }
    this._toItemsWithExpiryAndRemoveUntracked();
    if (!this._itemsWithExpiry) {
      throw new Error('Failed to parse items with expiry');
    }

    this._toFoodItems();
    if (!this._foodItems) {
      throw new Error('Failed to parse food items');
    }
    return this._foodItems;
  }

  get foodItems() {
    return this._foodItems;
  }

  _toLinesPerStorage() {
    this._linesPerStorage = {
      fridge: [] as string[],
      pantry: [] as string[],
      freezer: [] as string[],
    };

    if (
      this._lines[0] !== 'Fridge' &&
      this._lines[0] !== 'Cupboard' &&
      this._lines[0] !== 'Freezer'
    ) {
      throw new Error(
        `First line should be a storage type. Got: ${this._lines[0]}`
      );
    }

    let currentStorage = this._lines[0];
    for (const line of this._lines) {
      if (line === 'Fridge' || line === 'Cupboard' || line === 'Freezer') {
        currentStorage = line === 'Cupboard' ? 'pantry' : line.toLowerCase();
        continue;
      }
      if (!line) {
        continue;
      }
      this._linesPerStorage[currentStorage as keyof LinesPerStorage].push(line);
    }
  }

  _toItemsWithExpiryAndRemoveUntracked() {
    if (!this._linesPerStorage) {
      throw new Error('Lines per storage is not set');
    }

    let items = [] as ItemWithExpiry[];

    for (const [storage, lines] of Object.entries(this._linesPerStorage)) {
      items = [...items, ...getItemsWithExpiry(lines, storage)];
    }

    let itemInRepair: ItemWithExpiry | undefined = undefined;
    this._itemsWithExpiry = [];
    let itemTextIsBroken = false;
    // consolidate broken lines
    for (const item of items) {
      if (!itemTextIsBroken) {
        // item text intact
        if (this.isValidItemLine(item.name)) {
          this._itemsWithExpiry.push(item);
          continue;
        }

        // broken text found
        itemTextIsBroken = true;
        // move this item to itemInRepair where it can be repaired
        itemInRepair = item;
      } else {
        // Should never happen
        if (typeof itemInRepair === 'undefined') {
          throw new Error('itemInRepair is undefined');
        }

        // Keep joining item text
        itemInRepair.name = `${itemInRepair.name} ${item.name}`;
        // until price regex is found
        if (this.isValidItemLine(item.name)) {
          // add repaired item to the list
          this._itemsWithExpiry.push(itemInRepair);
          itemInRepair = undefined;
          itemTextIsBroken = false;
        }
      }
    }

    const isItemTracked = (itemName: string) => {
      const lowerName = itemName.toLocaleLowerCase();
      let isUntracked = untrackedItems.some((untrackedItem) =>
        lowerName.includes(untrackedItem)
      );
      if (isUntracked) {
        return false;
      }

      isUntracked = untrackedWordCombinations.some((words: string[]) =>
        words.every((word) => lowerName.includes(word))
      );

      return !isUntracked;
    };

    this._itemsWithExpiry = this._itemsWithExpiry.filter((item) =>
      isItemTracked(item.name)
    );
  }

  _toFoodItems() {
    if (!this._itemsWithExpiry) {
      throw new Error('Items with expiry is not set');
    }
    this._foodItems = [];

    for (const item of this._itemsWithExpiry) {
      const matched = this.tryMatchFullItemRe(item.name);
      if (!matched) {
        console.warn(`Failed to match item: ${item.name}`);
        continue; // skip items that do not match the full item regex
      }

      const { amount, description } =
        this.calculateAmountAndGetUpdatedDescription({
          bundle: parseFloat(matched.bundle || '1'),
          description: matched.description || '',
        });

      this._foodItems.push({
        name: description,
        expiry: item.expiry,
        storage: item.storage,
        amount,
        unit: 'unit', // decided not to measure quantity in anything other than units
      } as FoodFromReceipt);
    }
  }

  private isValidItemLine(line: string): boolean {
    return this.fullItemRe.test(line);
  }

  private tryMatchFullItemRe(line: string): FullItemReGroups | null {
    const match = line.match(this.fullItemRe);
    if (!match || !match.groups) {
      return null;
    }
    return {
      description: match.groups.description,
      bundle: match.groups.bundle,
      price: match.groups.price,
    };
  }

  private calculateAmountAndGetUpdatedDescription({
    bundle,
    description,
  }: {
    bundle: number;
    description: string;
  }): {
    amount: number;
    description: string;
  } {
    const match =
      description.match(this.quantityXRe) ||
      description.match(this.quantityPerRe);
    if (match) {
      const quantity = parseFloat(match.groups!.quantity);
      return {
        amount: bundle * quantity,
        description: description.replace(match.groups!.quantityText, '').trim(),
      };
    }

    return {
      amount: bundle,
      description,
    };
  }
}
