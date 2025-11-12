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
    <Input
      className="w-full bg-black"
      type="text"
      placeholder="Search by name..."
      onChange={(e) => {
        setFilter((prev) => ({
          ...prev,
          text: e.target.value,
        }));
      }}
    />
  );
}
