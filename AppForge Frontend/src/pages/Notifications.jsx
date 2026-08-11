import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Bell, Check, CheckCheck, Smartphone, CreditCard, Settings2, PartyPopper } from "lucide-react";

const typeIcons = {
  build: Smartphone,
  payment: CreditCard,
  system: Settings2,
  welcome: PartyPopper,
};

const typeColors = {
  build: "#4F7CFF",
  payment: "#22C55E",
  system: "#F59E0B",
  welcome: "#7C3AED",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    base44.entities.Notification.list("-created_date")
      .then((all) => {
        const uid = user?.id;
        setNotifications(all.filter((n) => !n.user_id || n.user_id === uid));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-40 bg-accent rounded-lg animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-accent animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notifications.filter((n) => !n.read).length} unread
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-lg text-xs">
          <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = typeIcons[notif.type] || Bell;
            const color = typeColors[notif.type] || "#4F7CFF";
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50"
                    : "border-[#4F7CFF]/20 bg-[#4F7CFF]/5"
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-[#4F7CFF] mt-2 shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}