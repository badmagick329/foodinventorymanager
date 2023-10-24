import { lowerCaseExists, upperCaseExists } from "./stringFuncs";

const skipLines = ["Delivered /", "Ordered", "Price", "to", "pay", "(£)"];

const untrackedItems = [
  "CARRIER BAG",
  "TOILET ROLL",
  "TOOTHPASTE",
  "IBUPROFEN",
  "SHAMPOO",
  "BLEACH",
  "KITCHEN ROLL",
  "Substituted items",
];

export default function cleanLines(lines: string[]) {
  return filterUntrackedItems(
    cleanupExpiryLines(removePriceInfo(joinItemLines(trim(lines))))
  );
}

function trim(lines: string[]): string[] {
  let startReading = false;
  const outLines = [];
  for (const line of lines) {
    if (line === "Fridge") {
      startReading = true;
    }
    if (line === "Offers savings" || line === "Missing items") {
      break;
    }
    if (startReading) {
      outLines.push(line);
    }
  }
  return outLines.filter((l) => !skipLines.includes(l));
}

/**
 * Item information is split into multiple lines when initially read.
 * Join lines so they can be processed more easily.
 */
function joinItemLines(lines: string[]): string[] {
  const quantityRegex = /\d{1,3}\/\d{1,4}\.\d{2}\*?$/; // e.g 3/310.00*
  const outLines = [];
  let itemStarted = false;
  let currentLine = "";
  for (const line of lines) {
    if (!itemStarted && isValidItemLine(line)) {
      if (quantityRegex.test(line)) {
        outLines.push(line);
        continue;
      }
      itemStarted = true;
      currentLine = line;
      continue;
    }
    if (itemStarted) {
      currentLine += " " + line;
      if (quantityRegex.test(line)) {
        outLines.push(currentLine);
        currentLine = "";
        itemStarted = false;
        continue;
      }
    } else {
      outLines.push(line);
    }
  }
  return outLines;
}

function isValidItemLine(line: string): boolean {
  const amountRegex = /\d+[g|kg|l|cl|ml]+/;
  const cleanLine = line.replace(amountRegex, "").trim();
  return upperCaseExists(cleanLine) && !lowerCaseExists(cleanLine);
}

function removePriceInfo(lines: string[]): string[] {
  const quantityRegex = /\d{1,3}\/\d{1,4}\.\d{2}\*?/; // e.g 3/310.00*
  const priceRegex = /\(£\d{1,2}\.\d{2}\/ ?EACH\)/; // e.g (£1.20/EACH)
  return lines
    .map((l) => l.replace(quantityRegex, "").replace(priceRegex, "").trim())
    .filter((l) => l !== "");
}

function cleanupExpiryLines(lines: string[]) {
  return lines.map((l) =>
    l.startsWith("Use by end of ") ? l.replace("Use by end of ", "") : l
  );
}

function filterUntrackedItems(lines: string[]): string[] {
  return lines.filter((l) => {
    for (const filterItem of untrackedItems) {
      if (l.includes(filterItem)) {
        return false;
      }
    }
    return true;
  });
}
