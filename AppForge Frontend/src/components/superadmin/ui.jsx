import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const StatCard = ({ icon: Icon, label, value, color = "#4F7CFF", sub }) => (
  <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export const SectionHeader = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
    <div>
      <h1 className="text-xl font-bold">{title}</h1>
      {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ label, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
    {Icon && <Icon className="w-10 h-10 text-muted-foreground/30 mb-2" />}
    <p className="text-sm text-muted-foreground">No {label} found</p>
  </div>
);

export const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Search..."} className="pl-9 rounded-xl bg-white dark:bg-gray-900/50" />
  </div>
);

export const Spinner = () => (
  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#4F7CFF]" /></div>
);

export const ConfirmDialog = ({ open, onOpenChange, title, description, onConfirm, busy, confirmLabel, destructive }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={busy}
          className={destructive ? "bg-[#EF4444] hover:bg-[#EF4444]/90" : "bg-gradient-primary text-white"}
        >
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {confirmLabel || "Confirm"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);