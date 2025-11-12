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
import { getHoverColorByStorage, getColorByStorage } from "@/lib/utils";

export default function FoodTable({ foods }: { foods: Food[] }) {
  return (
    <Table className="bg-foreground/5">
      <TableHeader className="bg-black/80">
        <TableRow>
          <TableHead className="max-w-2/3 min-w-[100px]">Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead className="text-right">Storage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {foods.map((f) => {
          return (
            <TableRow
              key={f.id}
              className={`select-none text-lg bg-green-50 ${getColorByStorage(
                f.storage
              )} ${getHoverColorByStorage(f.storage)}`}
            >
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.amount}</TableCell>
              <TableCell>{f.unit}</TableCell>
              <TableCell>{f.expiry}</TableCell>
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
