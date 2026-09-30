import { SearchFilter } from "@/lib/types";
import type { StorageType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { StorageFiltersState } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect } from "react";
import { getHoverColorByStorage, getColorByStorage } from "@/lib/utils";

// A runtime Prisma enum import would pull Prisma's browser bundle into the
// home page, so the storage types are listed here and checked against it.
const STORAGE_TYPES = [
  "fridge",
  "freezer",
  "pantry",
  "spices",
] as const satisfies readonly StorageType[];

export default function StorageFilter({
  setFilter,
}: {
  setFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
}) {
  const [storageFilters, setStorageFilters] =
    useLocalStorage<StorageFiltersState>("storageFilters", {
      fridge: true,
      freezer: true,
      pantry: true,
      spices: true,
    });

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      storageTypes: Object.entries(storageFilters)
        .filter(([_, isSelected]) => isSelected)
        .map(([storageType, _]) => storageType as StorageType),
    }));
  }, [storageFilters, setFilter]);

  return (
    <div className="flex w-full justify-center gap-2">
      {STORAGE_TYPES.map((storageType) => (
        <StorageButton
          key={storageType}
          storageType={storageType}
          storageFilters={storageFilters}
          setStorageFilters={setStorageFilters}
          isActive={storageFilters[storageType] === true}
        />
      ))}
    </div>
  );
}

function StorageButton({
  storageType,
  storageFilters,
  setStorageFilters,
  isActive,
}: {
  storageType: StorageType;
  storageFilters: StorageFiltersState;
  setStorageFilters: (value: StorageFiltersState) => void;
  isActive: boolean;
}) {
  const buttonColor = isActive
    ? `${getColorByStorage(storageType)} ${getHoverColorByStorage(storageType)}`
    : "bg-black hover:bg-accent";
  return (
    <Button
      variant="outline"
      className={`capitalize ${buttonColor}`}
      onClick={() => {
        const newStorageFilters = {
          ...storageFilters,
          [storageType]: !isActive,
        };
        setStorageFilters(newStorageFilters);
      }}
    >
      {storageType}
    </Button>
  );
}
