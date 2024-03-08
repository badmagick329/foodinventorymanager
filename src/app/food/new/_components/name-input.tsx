import { Dispatch, SetStateAction } from "react";
import { NewFoodFormValues } from "@/lib/types";

export default function NameInput({
  formValues,
  setFormValues,
}: {
  formValues: NewFoodFormValues;
  setFormValues: Dispatch<SetStateAction<NewFoodFormValues>>;
}) {
  return (
    <>
      <label className="text-white">Name</label>
      <input
        className="input bg-gray-700"
        type="text"
        value={formValues.name}
        name="name"
        onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
        required
        autoComplete="off"
      />
    </>
  );
}
