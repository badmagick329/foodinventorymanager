import { getExpiryDate } from "../lib/parser";

test("getExpiryDate returns something", () => {
  expect(getExpiryDate("Friday")).toBeTruthy();
});

test("getExpiryDate returns a date", () => {
  const res = getExpiryDate("Friday");
  expect(res).not.toBeNaN();
});

test("getExpiryDate returns correct date", () => {
  const res = getExpiryDate("Friday", new Date("2023-10-22"));
  expect(res).not.toBeNull();
  const date = new Date(res as string);
  expect(date.getDate()).toBe(27);
  expect(date.getMonth()).toBe(9);
});

test("getExpiryDate returns correct date for Thursday, 2023-10-31", () => {
  const res = getExpiryDate("Thursday", new Date("2023-10-31"));
  expect(res).not.toBeNull();
  const date = new Date(res as string);
  expect(date.getDate()).toBe(2);
  expect(date.getMonth()).toBe(10);
});

test("getExpiryDate returns correct date for Sunday, 2023-10-22", () => {
  const res = getExpiryDate("Sunday", new Date("2023-10-22"));
  expect(res).not.toBeNull();
  const date = new Date(res as string);
  expect(date.getDate()).toBe(29);
  expect(date.getMonth()).toBe(9);
});

test("getExpiryDate returns correct date for Friday, 2023-10-22", () => {
  const res = getExpiryDate("Friday", new Date("2023-10-22"));
  expect(res).not.toBeNull();
  const date = new Date(res as string);
  expect(date.getDate()).toBe(27);
  expect(date.getMonth()).toBe(9);
});

test("getExpiryDate returns correct date for Tuesday, 2023-10-26", () => {
  const res = getExpiryDate("Tuesday", new Date("2023-10-26"));
  expect(res).not.toBeNull();
  const date = new Date(res as string);
  expect(date.getDate()).toBe(31);
  expect(date.getMonth()).toBe(9);
});

test("getExpiryDate returns falsy", () => {
  const res = getExpiryDate("Products with a 'use-by' date over one week");
  expect(res).toBeFalsy();
});

test("getExpiryDate returns falsy", () => {
  const res = getExpiryDate("Products with no 'use-by' date");
  expect(res).toBeFalsy();
});
