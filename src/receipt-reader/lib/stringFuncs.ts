export function lowerCaseExists(str: string): boolean {
  const lowerCaseRegex = /[a-z]/;
  return lowerCaseRegex.test(str);
}

export function upperCaseExists(str: string): boolean {
  const upperCaseRegex = /[A-Z]/;
  return upperCaseRegex.test(str);
}
