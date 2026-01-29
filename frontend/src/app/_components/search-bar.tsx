import "react";
import React, { useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SearchFilter } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import { debounce } from "@/lib/utils";

export default function SearchBar({
  setFilter,
}: {
  setFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
}) {
  const [storedTerm, setStoredTerm] = useLocalStorage("foodSearch", "");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSetStoredTerm = useMemo(
    () => debounce((value: string) => setStoredTerm(value), 250),
    [setStoredTerm]
  );

  useEffect(() => {
    setFilter((prev) => ({ ...prev, text: storedTerm }));
    if (inputRef.current) {
      inputRef.current.value = storedTerm;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Input
      ref={inputRef}
      className="w-full bg-black"
      type="text"
      placeholder="Search by name..."
      onChange={(e) => {
        setFilter((prev) => ({
          ...prev,
          text: e.target.value,
        }));
        debouncedSetStoredTerm(e.target.value);
      }}
    />
  );
}
