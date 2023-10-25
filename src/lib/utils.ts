export function parseErrors(errors: string) {
  return JSON.parse(errors)
    .map(
      (err: any) =>
        `${err.path[0].slice(0, 1).toUpperCase()}${err.path[0].slice(1)}: ${
          err.message
        }`
    )
    .join("\n");
}

export function uppercaseFirst(str: string | number) {
  if (typeof str === "number") {
    return str;
  }
  return `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`;
}

export function getCardBgColor(storageType: string) {
  switch (storageType) {
    case "fridge":
      return "bg-green-900";
    case "freezer":
      return "bg-blue-700";
    case "pantry":
      return "bg-amber-700";
    default:
      return "bg-orange-900";
  }
}

export function getCardHoverColor(storageType: string) {
  switch (storageType) {
    case "fridge":
      return "hover:bg-green-700";
    case "freezer":
      return "hover:bg-blue-500";
    case "pantry":
      return "hover:bg-amber-500";
    default:
      return "hover:bg-orange-700";
  }
}
