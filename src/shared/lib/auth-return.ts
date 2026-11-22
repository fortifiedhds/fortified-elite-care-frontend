import { adminConsolePath, isAppRoute } from "./routes";
export function authReturnPath(value: unknown, admin: boolean) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.includes("?") ||
    value.includes("#")
  )
    return undefined;
  if (admin)
    return value.startsWith(adminConsolePath + "/enrolments/") &&
      isAppRoute(value, "admin")
      ? value
      : undefined;
  return value.startsWith("/portal") && isAppRoute(value, "dashboard")
    ? value
    : undefined;
}
