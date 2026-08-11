import {
  LayoutDashboard, PlusCircle, Smartphone,
  Download, Bell, CreditCard, HelpCircle,
  User, Settings, Crown, Wallet
} from "lucide-react";

export const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PlusCircle, label: "New Project", path: "/new-project" },
  { icon: Smartphone, label: "My Apps", path: "/my-apps" },
  { icon: Download, label: "Downloads", path: "/downloads" },
];

export const secondaryNav = [
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: Wallet, label: "Payment", path: "/payment" },
  { icon: Crown, label: "Upgrade Plan", path: "/upgrade-plan" },
  { icon: HelpCircle, label: "Support", path: "/support" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];