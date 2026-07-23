import {
  HomeIcon,
  KanbanIcon,
  Building2Icon,
  SendIcon,
  ZapIcon,
  SettingsIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: HomeIcon, config: false },
  { href: "/pipeline", label: "Pipeline", icon: KanbanIcon, config: false },
  { href: "/companies", label: "Companies", icon: Building2Icon, config: false },
  { href: "/outreach", label: "Outreach", icon: SendIcon, config: false },
  { href: "/automations", label: "Automations", icon: ZapIcon, config: true },
  { href: "/settings", label: "Settings", icon: SettingsIcon, config: true },
] as const;

/** Results-only clients (the Android shell) hide configuration surfaces. */
export function navItemsFor(resultsOnly: boolean) {
  return resultsOnly ? NAV_ITEMS.filter((item) => !item.config) : NAV_ITEMS;
}
