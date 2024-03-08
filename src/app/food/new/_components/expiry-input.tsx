import { Dispatch, SetStateAction } from "react";
import { NewFoodFormValues } from "@/lib/types";

export default function ExpiryInput({
  formValues,
  setFormValues,
}: {
  formValues: NewFoodFormValues;
  setFormValues: Dispatch<SetStateAction<NewFoodFormValues>>;
}) {
  return (
    <>
      <label className="text-white">Expiry</label>
      <input
        className="input bg-gray-700"
        type="date"
        value={formValues.expiry}
        min={new Date().toISOString().slice(0, 10)}
        name="expiry"
        onChange={(e) =>
          setFormValues({ ...formValues, expiry: e.target.value })
        }
      />
    </>
  );
}
