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
} from "lucide-react";
import type { Account } from "../../shared/api/client";

type Tab = { path: string; label: string; icon: LucideIcon };

const overview = { path: "", label: "Overview", icon: LayoutDashboard };

const inbox = { path: "notifications", label: "Notifications", icon: Bell };

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
  ],
  DOCTOR: [
    overview,
    { path: "available", label: "Available requests", icon: CalendarDays },
    { path: "assigned", label: "Assigned visits", icon: ClipboardCheck },
    inbox,
  ],
  ADMIN: [
    overview,
    { path: "enrolments", label: "Enrolments", icon: Users },
    { path: "visits", label: "Visit management", icon: CalendarDays },
    {
      path: "extra-requests",
      label: "Extra visit requests",
      icon: ClipboardCheck,
    },
    { path: "billing", label: "Billing", icon: WalletCards },
    inbox,
  ],
};

export const roleNames = {
  PATIENT: "Patient portal",
  DOCTOR: "Doctor portal",
  ADMIN: "Admin portal",
};

export const portalPath = (path: string) =>
  path ? `/portal/${path}` : "/portal";
