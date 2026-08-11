import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Save } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-8 w-32 bg-accent rounded-lg animate-pulse" />
        <div className="h-64 rounded-2xl bg-accent animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
            {user?.full_name?.[0] || "U"}
          </div>
          <div>
            <p className="text-lg font-bold">{user?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />Full Name
            </label>
            <input
              type="text"
              defaultValue={user?.full_name || ""}
              className="w-full h-11 px-4 rounded-xl bg-accent border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full h-11 px-4 rounded-xl bg-accent border-0 text-sm text-muted-foreground"
            />
          </div>
        </div>

        <Button
          className="mt-6 bg-gradient-primary text-white hover:opacity-90 rounded-xl"
          onClick={() => toast({ title: "Profile updated" })}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </motion.div>
    </div>
  );
}