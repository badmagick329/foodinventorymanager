import React from "react";

export default function SearchBar({
  searchText,
  setSearchText,
}: {
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="flex w-full justify-center gap-4">
      <input
        type="search"
        placeholder="Search"
        className="input input-outline bg-gray-700 max-w-[720px] min-w-[150px] w-1/2"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button className="btn" onClick={() => setSearchText("")}>
        Clear
      </button>
    </div>
  );
}
