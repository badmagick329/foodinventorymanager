"use client";
import { Food } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getHoverColorByStorage,
  getColorByStorage,
  daysUntilExpiryToBorderColor,
  daysUntil,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FOOD_FORM_URL } from "@/lib/urls";

export default function FoodTable({ foods }: { foods: Food[] }) {
  const router = useRouter();
  return (
    <Table className="md:text-md bg-foreground/5 text-xs sm:text-sm lg:text-lg [&_tr:last-child]:border-l-4 [&_tr:last-child]:border-r-4">
      <TableHeader className="bg-black">
        <TableRow>
          <TableHead className="max-w-2/3 min-w-[80px]">Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Storage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {foods.map((f) => {
          const borderColor =
            f.expiry !== null
              ? daysUntilExpiryToBorderColor(daysUntil(f.expiry))
              : "";
          return (
            <TableRow
              key={f.id}
              className={`select-none ${getColorByStorage(
                f.storage
              )} ${getHoverColorByStorage(f.storage)} border-l-4 border-r-4 ${borderColor}`}
              onDoubleClick={() => {
                router.push(`${FOOD_FORM_URL}${f.id}/`);
              }}
            >
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.amount}</TableCell>
              <TableCell>{f.unit}</TableCell>
              <TableCell className="">{f.expiry}</TableCell>
              <TableCell className="text-right capitalize">
                {f.storage}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
