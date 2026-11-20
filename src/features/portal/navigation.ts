import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Heart,
  LayoutDashboard,
  ShieldCheck,
  Users,
  WalletCards,
  Settings,
} from "lucide-react";
import type { Account } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { useLocation } from "react-router-dom";
import { adminConsolePath } from "../../shared/lib/admin";

type Tab = {
  path: string;
  label: string;
  icon: LucideIcon;
  permission?: components["schemas"]["AdminPermission"];
};

const overview = { path: "", label: "Overview", icon: LayoutDashboard };

const inbox = { path: "notifications", label: "Notifications", icon: Bell };
const settings = { path: "settings", label: "Settings", icon: Settings };
const documents = { path: "documents", label: "Documents", icon: FileText };

export const navigation: Record<Account["role"], Tab[]> = {
  PATIENT: [
    overview,
    { path: "checkups", label: "My checkups", icon: CalendarDays },
    { path: "appointments", label: "Appointments", icon: CalendarDays },
    { path: "history", label: "Visit history", icon: ClipboardCheck },
    { path: "summaries", label: "Visit summaries", icon: FileText },
    { path: "registration", label: "Registration", icon: Users },
    { path: "baseline", label: "Baseline assessment", icon: Heart },
    { path: "consent", label: "Care permissions", icon: ShieldCheck },
    { path: "agreement", label: "Service agreement", icon: FileText },
    { path: "payments", label: "Payments", icon: WalletCards },
    inbox,
    documents,
    settings,
  ],
  DOCTOR: [
    overview,
    { path: "available", label: "Available requests", icon: CalendarDays },
    { path: "assigned", label: "Assigned visits", icon: ClipboardCheck },
    inbox,
    documents,
    settings,
  ],
  ADMIN: [
    overview,
    {
      path: "enrolments",
      label: "Enrolments",
      icon: Users,
      permission: "ENROLMENTS_MANAGE",
    },
    {
      path: "visits",
      label: "Visit management",
      icon: CalendarDays,
      permission: "VISITS_MANAGE",
    },
    {
      path: "extra-requests",
      label: "Extra visit requests",
      icon: ClipboardCheck,
      permission: "EXTRA_VISITS_MANAGE",
    },
    {
      path: "administrators",
      label: "Administrators",
      icon: ShieldCheck,
      permission: "ADMINS_MANAGE",
    },
    inbox,
    documents,
    settings,
  ],
};

export const roleNames = {
  PATIENT: "Patient portal",
  DOCTOR: "Doctor portal",
  ADMIN: "Admin portal",
};

export const portalPath = (path: string) =>
  path ? `/portal/${path}` : "/portal";

export function usePortalPath() {
  const { pathname } = useLocation();
  const base = pathname.startsWith(adminConsolePath)
    ? adminConsolePath
    : "/portal";
  return (path: string) => (path ? base + "/" + path : base);
}
