import { formatAmount } from "../utils";

describe("formatAmount", () => {
  it("rounds display values to at most two decimal places", () => {
    expect(formatAmount(0.8999999999999999)).toBe("0.9");
    expect(formatAmount(1.236)).toBe("1.24");
    expect(formatAmount(2)).toBe("2");
  });
});
