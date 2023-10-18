export function parseErrors(errors: string) {
  return JSON.parse(errors)
    .map(
      (err: any) =>
        `${err.path[0].slice(0, 1).toUpperCase()}${err.path[0].slice(1)}: ${
          err.message
        }`,
    )
    .join("\n");
}

export function uppercaseFirst(str: string | number) {
  if (typeof str === "number") {
    return str;
  }
  return `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`;
}
