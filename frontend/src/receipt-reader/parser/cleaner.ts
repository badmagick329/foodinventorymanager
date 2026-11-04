export class Cleaner {
  private originalLines: string[];
  private processed: string[];

  private static startLine = 'Fridge';
  private static junkLines = ['Delivered / ', 'Ordered', 'Price to pay ', '£'];
  /**
   * Headers of the sections that follow the storage sections. Matched by
   * prefix because Ocado appends varying explanations to them, e.g.
   * "Missing items - Items where we couldn't deliver an alternative"; an exact
   * match let that header through and its items were imported (FDI-14).
   */
  private static endLinePrefixes = [
    'Offers savings',
    'Missing items',
    'Substituted items',
  ];
  private static expiryDayLeadingText = 'Use by end of ';

  private static pdfPageRe = /^\d{1,2}\/\d{1,2}$/;

  constructor(receiptTextLines: string[]) {
    this.originalLines = receiptTextLines;
    this.processed = [...receiptTextLines];
  }

  /**
   * Remove lines from the receipt which are unrelated to storage, food items
   * and their details, and expiry
   */
  clean(): string[] {
    this.trimTopAndBottomEnds();
    this.skipJunkLines();
    this.cleanExpiryDayLines();
    this.processed = this.processed.map((line) => line.trim());
    return this.processed;
  }

  private trimTopAndBottomEnds(): Cleaner {
    let startReading = false;
    const outLines = [];
    for (const line of this.processed) {
      if (line === Cleaner.startLine) {
        startReading = true;
      }
      if (!startReading) {
        // The summary above the storage sections has lines such as
        // "Offers savings-£21.84" that would otherwise end reading early.
        continue;
      }
      if (Cleaner.endLinePrefixes.some((prefix) => line.startsWith(prefix))) {
        break;
      }
      outLines.push(line.trim());
    }
    this.processed = outLines;
    return this;
  }

  private skipJunkLines(): Cleaner {
    this.processed = this.processed.filter(
      (l) => !Cleaner.junkLines.includes(l) && !Cleaner.pdfPageRe.test(l)
    );
    return this;
  }

  private cleanExpiryDayLines(): Cleaner {
    this.processed = this.processed.map((line) => {
      if (line.startsWith(Cleaner.expiryDayLeadingText)) {
        return line.replace(Cleaner.expiryDayLeadingText, '');
      }
      return line;
    });
    return this;
  }
}
