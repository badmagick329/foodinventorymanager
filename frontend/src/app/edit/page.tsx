import { V2_HOME } from "@/lib/urls";
import { redirect } from "next/navigation";

export default async function EditRedirect() {
  return redirect(V2_HOME);
}
