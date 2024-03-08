import { Dispatch, SetStateAction } from "react";
import { NewFoodFormValues } from "@/lib/types";
import { MeasurementUnit } from "@prisma/client";

export default function UnitInput({
  formValues,
  setFormValues,
}: {
  formValues: NewFoodFormValues;
  setFormValues: Dispatch<SetStateAction<NewFoodFormValues>>;
}) {
  return (
    <>
      <label className="text-white">Unit</label>
      <select
        className="input bg-gray-700"
        value={formValues.unit}
        name="unit"
        onChange={(e) => setFormValues({ ...formValues, unit: e.target.value })}
        required
      >
        {Object.keys(MeasurementUnit).map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </>
  );
}
