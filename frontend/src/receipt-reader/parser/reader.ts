import pdf from 'pdf-parse';

export class Reader {
  private _rawText: string;

  constructor(rawText: string) {
    this._rawText = rawText;
  }

  static async fromBuffer(buffer: Buffer): Promise<Reader> {
    const data = await pdf(buffer);
    return new Reader(data.text);
  }

  static fromText(text: string): Reader {
    return new Reader(text);
  }

  get rawText(): string {
    return this._rawText;
  }
}
