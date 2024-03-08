import { Dispatch, SetStateAction } from "react";
import { NewFoodFormValues } from "@/lib/types";

export default function AmountInput({
  formValues,
  setFormValues,
}: {
  formValues: NewFoodFormValues;
  setFormValues: Dispatch<SetStateAction<NewFoodFormValues>>;
}) {
  return (
    <>
      <label className="text-white">Amount</label>
      <input
        className="input bg-gray-700"
        type="number"
        min="0.01"
        step="0.01"
        value={formValues.amount}
        name="amount"
        onChange={(e) =>
          setFormValues({ ...formValues, amount: e.target.value })
        }
        required
        autoComplete="off"
      />
    </>
  );
}
