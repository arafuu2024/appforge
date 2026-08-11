import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Shield, Globe } from "lucide-react";

const SettingRow = ({ icon: Icon, label, description, children }) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const Toggle = ({ on, onToggle, defaultOn = false }) => {
  const [internal, setInternal] = React.useState(defaultOn);
  const isControlled = on !== undefined;
  const value = isControlled ? on : internal;
  const toggle = () => (isControlled ? onToggle() : setInternal(!internal));
  return (
    <button
      onClick={toggle}
      className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${value ? "bg-[#4F7CFF]" : "bg-gray-200 dark:bg-gray-700"}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-4" : ""}`} />
    </button>
  );
};

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h3>
        </div>
        <SettingRow icon={dark ? Sun : Moon} label="Dark Mode" description="Use dark theme across the platform">
          <Toggle on={dark} onToggle={() => setTheme(dark ? "light" : "dark")} />
        </SettingRow>
        <SettingRow icon={Globe} label="Language" description="Set your preferred language">
          <span className="text-sm text-muted-foreground">English</span>
        </SettingRow>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notifications</h3>
        </div>
        <SettingRow icon={Bell} label="Build Alerts" description="Get notified when builds complete">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow icon={Bell} label="Email Notifications" description="Receive updates via email">
          <Toggle defaultOn />
        </SettingRow>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Security</h3>
        </div>
        <SettingRow icon={Shield} label="Two-Factor Auth" description="Add extra security to your account">
          <Toggle />
        </SettingRow>
      </motion.div>
    </div>
  );
}