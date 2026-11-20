import type { Account } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";

export const permissionLabels: Record<
  components["schemas"]["AdminPermission"],
  string
> = {
  ENROLMENTS_MANAGE: "Review enrolments",
  VISITS_MANAGE: "Manage visits",
  SUMMARIES_PUBLISH: "Release signed summaries",
  EXTRA_VISITS_MANAGE: "Approve extra visits",
  ADMINS_MANAGE: "Manage administrators",
};
export function canAdmin(
  account: Account,
  permission: components["schemas"]["AdminPermission"],
) {
  return (
    account.role === "ADMIN" &&
    (account.adminPermissions ?? []).includes(permission)
  );
}
