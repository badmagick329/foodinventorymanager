import "react";
import { SearchFilter } from "@/lib/types";
import { StorageType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { StorageFiltersState } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect } from "react";
import { getHoverColorByStorage, getColorByStorage } from "@/lib/utils";

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
    <div className="flex gap-2 w-full justify-center">
      <StorageButton
        storageType="fridge"
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
        isActive={storageFilters["fridge"] === true}
      />
      <StorageButton
        storageType="freezer"
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
        isActive={storageFilters["freezer"] === true}
      />
      <StorageButton
        storageType="pantry"
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
        isActive={storageFilters["pantry"] === true}
      />
      <StorageButton
        storageType="spices"
        storageFilters={storageFilters}
        setStorageFilters={setStorageFilters}
        isActive={storageFilters["spices"] === true}
      />
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
