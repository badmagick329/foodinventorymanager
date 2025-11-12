import { StorageFiltersType } from "@/lib/types";
import {
  getColorByStorage,
  getHoverColorByStorage,
  uppercaseFirst,
} from "@/lib/utils";

interface StorageFiltersProps {
  storageFilters: Record<string, boolean>;
  setStorageFilters: CallableFunction;
}

export default function StorageFilters({
  storageFilters,
  setStorageFilters,
}: StorageFiltersProps) {
  return (
    <div className="flex space-x-1">
      {Object.keys(storageFilters).map((key) => {
        const filterIsChecked = isChecked(key, storageFilters);

        const filterCss = filterIsChecked
          ? `${getColorByStorage(key)} ${getHoverColorByStorage(key)}`
          : "bg-blue-850 hover:bg-slate-700";

        return (
          <div key={key} className="form-control">
            <label
              className={`cursor-pointer label space-x-2 px-2 btn ${filterCss}`}
            >
              <span className="label-text">{uppercaseFirst(key)}</span>
              <input
                type="checkbox"
                checked={filterIsChecked}
                className="hidden"
                onChange={(e) =>
                  setStorageFilters({
                    ...storageFilters,
                    [key]: e.target.checked,
                  })
                }
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

function isChecked(
  key: keyof typeof storageFilters,
  storageFilters: StorageFiltersType
) {
  return storageFilters[key];
}
