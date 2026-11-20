export const monthlyDays = Array.from({ length: 31 }, (_, index) => index + 1);
export function ordinal(day: number) {
  const digit = day % 10;
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : digit === 1
        ? "st"
        : digit === 2
          ? "nd"
          : digit === 3
            ? "rd"
            : "th";
  return String(day) + suffix;
}
export function visitDate(month: string, day: number) {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31
  )
    return undefined;
  const [year, value] = month.split("-").map(Number);
  const leap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const lastDay =
    value === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(value) ? 30 : 31;
  return month + "-" + String(Math.min(day, lastDay)).padStart(2, "0");
}
export function followingMonth(month: string) {
  const [year, value] = month.split("-").map(Number);
  return value === 12
    ? String(year + 1).padStart(4, "0") + "-01"
    : String(year).padStart(4, "0") + "-" + String(value + 1).padStart(2, "0");
}
export function nextVisitMonth(
  today: string,
  day: number,
  bookedMonths: string[] = [],
) {
  let month = today.slice(0, 7);
  if ((visitDate(month, day) ?? "") < today) month = followingMonth(month);
  while (bookedMonths.includes(month)) month = followingMonth(month);
  return month;
}
