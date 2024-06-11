"use client";
import { createFood } from "@/actions/serverActions";
import { NewFoodFormValues } from "@/lib/types";
import { parseErrors } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import AmountInput from "./_components/amount-input";
import ExpiryInput from "./_components/expiry-input";
import FormErrors from "./_components/form-errors";
import NameInput from "./_components/name-input";
import StorageInput from "./_components/storage-input";
import SubmitButton from "./_components/submit-button";
import UnitInput from "./_components/unit-input";

export default function NewFood() {
  const [formValues, setFormValues] = useState<NewFoodFormValues>({
    name: "",
    amount: "",
    unit: "unit",
    expiry: "",
    storage: "fridge",
  });
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const submitForm = async (e: FormData) => {
    startTransition(async () => {
      const result = await createFood(e);
      if (result.error) {
        setErrors(parseErrors(result.error));
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="p-2 w-full sm:w-3/4 lg:w-1/2">
      <h1 className="text-3xl text-white w-full text-center">Create Food</h1>
      <FormErrors errors={errors} />
      <form className="flex flex-col space-y-2" action={submitForm}>
        <NameInput formValues={formValues} setFormValues={setFormValues} />
        <AmountInput formValues={formValues} setFormValues={setFormValues} />
        <UnitInput formValues={formValues} setFormValues={setFormValues} />
        <ExpiryInput formValues={formValues} setFormValues={setFormValues} />
        <StorageInput formValues={formValues} setFormValues={setFormValues} />
        <div className="flex justify-center py-2">
          <SubmitButton isPending={isPending} />
        </div>
      </form>
    </div>
  );
}
