import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Smartphone, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { canUseFeature } from "@/lib/plans";
import AppCard from "@/components/myapps/AppCard";

export default function MyApps() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const aabAllowed = canUseFeature(user, "aab");

  const loadProjects = () => {
    setLoading(true);
    base44.entities.Project.list("-created_date")
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-accent rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-accent rounded-lg animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-accent animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Apps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} app{projects.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <Link to="/new-project">
          <Button className="bg-gradient-primary text-white hover:opacity-90 rounded-xl">
            <PlusCircle className="w-4 h-4 mr-2" />
            New App
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#4F7CFF]/10 flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-[#4F7CFF]" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No apps yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Create your first Android app in minutes</p>
          <Link to="/new-project">
            <Button className="bg-gradient-primary text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First App
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <AppCard key={project.id} project={project} index={i} aabAllowed={aabAllowed} onDeleted={loadProjects} />
          ))}
        </div>
      )}
    </div>
  );
}