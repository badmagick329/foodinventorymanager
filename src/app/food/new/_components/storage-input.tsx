import { Dispatch, SetStateAction } from "react";
import { NewFoodFormValues } from "@/lib/types";
import { StorageType } from "@prisma/client";

export default function StorageInput({
  formValues,
  setFormValues,
}: {
  formValues: NewFoodFormValues;
  setFormValues: Dispatch<SetStateAction<NewFoodFormValues>>;
}) {
  return (
    <>
      <label className="text-white">Storage</label>
      <select
        className="input bg-gray-700"
        value={formValues.storage}
        name="storage"
        onChange={(e) =>
          setFormValues({ ...formValues, storage: e.target.value })
        }
        required
      >
        {Object.keys(StorageType).map((storage) => (
          <option key={storage} value={storage}>
            {storage}
          </option>
        ))}
      </select>
    </>
  );
}
