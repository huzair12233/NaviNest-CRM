import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Sun,
  Users,
  UserSquare2,
  PhoneCall,
  CheckSquare,
  MapPin,
  Building,
  Building2,
  Home,
  KeyRound,
  Landmark,
  GitBranch,
  Handshake,
  Coins,
  Network,
  BarChart3,
  TrendingUp,
  Bell,
  UsersRound,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  managerOnly?: boolean;
  adminOnly?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Day", href: "/my-day", icon: Sun },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "All Leads", href: "/leads", icon: Users },
      { label: "Sale Leads", href: "/leads/sale", icon: Home },
      { label: "Rental Leads", href: "/leads/rental", icon: KeyRound },
      { label: "Contacts", href: "/contacts", icon: UserSquare2 },
      { label: "Follow-ups", href: "/follow-ups", icon: PhoneCall },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Site Visits", href: "/site-visits", icon: MapPin },
    ],
  },
  {
    title: "Properties",
    items: [
      { label: "All Properties", href: "/properties", icon: Building },
      { label: "Projects / Societies", href: "/projects", icon: Building2 },
      { label: "Owners", href: "/owners", icon: Landmark },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: GitBranch },
      { label: "Deals", href: "/deals", icon: Handshake },
      { label: "Commissions", href: "/commissions", icon: Coins },
    ],
  },
  {
    title: "Partners",
    items: [{ label: "Channel Partners", href: "/channel-partners", icon: Network }],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Team Performance", href: "/team-performance", icon: TrendingUp, managerOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Team", href: "/team", icon: UsersRound, adminOnly: true },
      { label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
    ],
  },
];
