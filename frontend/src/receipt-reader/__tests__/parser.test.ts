import { Parser } from "../parser";

// Mirrors the pdf-parse text layout of an Ocado receipt: an order summary,
// storage sections of "name<delivered>/<ordered>£<price>" lines grouped by
// expiry, then the sections that follow them.
const receipt = (...afterStorage: string[]) =>
  [
    "Your Ocado receipt",
    "Cost of goods£20.00",
    "Offers savings-£1.00",
    " Delivered / OrderedPrice to pay £",
    "Fridge",
    "Use by end of Friday",
    "M&S Crunchy Edamame Beans 154g1/1£2.67",
    "Cupboard",
    "Products with a 'use-by' date over one week",
    "East End Brown Lentils 1kg2/2£4.40",
    ...afterStorage,
    "Offers savings",
    "You've saved £1.00 today",
    "Wagamama Firecracker Curry Sauce£4.602£0.90",
  ].join("\n");

const names = (text: string) => Parser.create(text).parse().map((f) => f.name);

test("imports the foods in the storage sections", () => {
  expect(names(receipt())).toEqual([
    "M&S Crunchy Edamame Beans 154g",
    "East End Brown Lentils 1kg",
  ]);
});

test("skips foods listed under missing items", () => {
  const text = receipt(
    "Missing items - Items where we couldn't deliver an alternative",
    "M&S British Chicken Breast Fillets 1kg0/1£7.50"
  );

  expect(names(text)).toEqual([
    "M&S Crunchy Edamame Beans 154g",
    "East End Brown Lentils 1kg",
  ]);
});

test("skips foods listed under substituted items", () => {
  const text = receipt(
    "Substituted items - Alternatives for unavailable items",
    "M&S Oakham Gold Chicken Breast Fillets 1kg",
    "0/10.00",
    "  Ocado British 3-5 Chicken Breast Fillets 650g→",
    "2/0£9.60"
  );

  expect(names(text)).toEqual([
    "M&S Crunchy Edamame Beans 154g",
    "East End Brown Lentils 1kg",
  ]);
});

test("skips a food with nothing delivered", () => {
  const text = receipt().replace(
    "East End Brown Lentils 1kg2/2£4.40",
    "East End Brown Lentils 1kg0/2£0.00"
  );

  expect(names(text)).toEqual(["M&S Crunchy Edamame Beans 154g"]);
});
