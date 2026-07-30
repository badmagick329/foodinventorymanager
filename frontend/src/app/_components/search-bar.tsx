import "react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchFilter } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import { debounce } from "@/lib/utils";
import { X } from "lucide-react";

export default function SearchBar({
  setFilter,
}: {
  setFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
}) {
  const [storedTerm, setStoredTerm] = useLocalStorage("foodSearch", "");
  const [term, setTerm] = useState(storedTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSetStoredTerm = useMemo(
    () => debounce((value: string) => setStoredTerm(value), 250),
    [setStoredTerm]
  );

  useEffect(() => {
    setFilter((prev) => ({ ...prev, text: storedTerm }));
    setTerm(storedTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSearch() {
    setTerm("");
    setFilter((prev) => ({ ...prev, text: "" }));
    debouncedSetStoredTerm("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        className="w-full bg-black pr-11"
        type="text"
        placeholder="Search by name..."
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setFilter((prev) => ({
            ...prev,
            text: e.target.value,
          }));
          debouncedSetStoredTerm(e.target.value);
        }}
      />
      {term && (
        <Button
          className="absolute right-1 top-1/2 -translate-y-1/2"
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
