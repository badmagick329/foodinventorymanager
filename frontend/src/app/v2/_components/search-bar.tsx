import "react";
import React from "react";
import { Input } from "@/components/ui/input";
import { SearchFilter } from "@/lib/types";

export default function SearchBar({
  setFilter,
}: {
  setFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
}) {
  return (
    <div className="w-full">
      <Input
        className="bg-foreground/5"
        type="text"
        placeholder="Search by name..."
        onChange={(e) => {
          setFilter((prev) => ({
            ...prev,
            text: e.target.value,
          }));
        }}
      />
    </div>
  );
}
