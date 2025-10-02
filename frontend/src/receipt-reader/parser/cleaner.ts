export class Cleaner {
  private originalLines: string[];
  private processed: string[];

  private static startLine = 'Fridge';
  private static junkLines = ['Delivered / ', 'Ordered', 'Price to pay ', '£'];
  private static endLines = [
    'Offers savings',
    'Missing items',
    'Substituted items - Alternatives for unavailable items',
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
      if (Cleaner.endLines.includes(line)) {
        break;
      }
      if (startReading) {
        outLines.push(line.trim());
      }
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
