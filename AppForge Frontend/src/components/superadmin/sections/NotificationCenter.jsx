import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/superadmin/ui";
import { logAudit } from "@/lib/superadmin/audit";
import { Send, Bell, Mail, Loader2 } from "lucide-react";

export default function NotificationCenter() {
  const [mode, setMode] = useState("broadcast");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      if (mode === "broadcast") {
        await base44.entities.Notification.create({
          title: title.trim(),
          message: message.trim(),
          type: "system",
          read: false,
          user_id: "",
        });
        await logAudit({ action: "notification.broadcast", targetType: "notification", details: `Broadcast: ${title}` });
        toast({ title: "Broadcast sent", description: "Notification sent to all users." });
      } else {
        const users = await base44.entities.User.list();
        const target = users.find(u => u.email.toLowerCase() === targetEmail.trim().toLowerCase());
        if (!target) { toast({ title: "User not found", variant: "destructive" }); setBusy(false); return; }
        await base44.entities.Notification.create({
          title: title.trim(),
          message: message.trim(),
          type: "system",
          read: false,
          user_id: target.id,
        });
        await logAudit({ action: "notification.send", targetType: "user", targetId: target.id, details: `To ${target.email}: ${title}` });
        toast({ title: "Sent", description: `Notification sent to ${target.email}.` });
      }
      setTitle(""); setMessage(""); setTargetEmail("");
    } catch {
      toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const sendEmail = async () => {
    if (!targetEmail.trim() || !emailSubject.trim() || !emailBody.trim()) {
      toast({ title: "Missing fields", description: "All email fields are required.", variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: targetEmail.trim(),
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });
      await logAudit({ action: "email.send", targetType: "email", details: `To ${targetEmail}: ${emailSubject}` });
      toast({ title: "Email sent", description: `Email sent to ${targetEmail}.` });
      setTargetEmail(""); setEmailSubject(""); setEmailBody("");
    } catch {
      toast({ title: "Error", description: "Could not send email. Recipient must be a registered user.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Notification Center" desc="Broadcast notifications and send emails to users" />

      <div className="flex gap-2">
        <button onClick={() => setMode("broadcast")} className={`px-4 py-2 rounded-xl text-sm font-medium ${mode === "broadcast" ? "bg-gradient-primary text-white" : "bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"}`}><Bell className="w-4 h-4 inline mr-2" />Broadcast</button>
        <button onClick={() => setMode("single")} className={`px-4 py-2 rounded-xl text-sm font-medium ${mode === "single" ? "bg-gradient-primary text-white" : "bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"}`}><Send className="w-4 h-4 inline mr-2" />Single User</button>
        <button onClick={() => setMode("email")} className={`px-4 py-2 rounded-xl text-sm font-medium ${mode === "email" ? "bg-gradient-primary text-white" : "bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"}`}><Mail className="w-4 h-4 inline mr-2" />Email</button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-5 space-y-4 max-w-2xl">
        {mode === "single" && (
          <div>
            <label className="text-sm font-medium">Recipient Email</label>
            <Input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder="user@example.com" className="mt-1 rounded-xl" />
          </div>
        )}
        {mode === "email" && (
          <>
            <div>
              <label className="text-sm font-medium">Recipient Email</label>
              <Input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder="registered@user.com" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} placeholder="Email body..." className="mt-1 rounded-xl resize-none" />
            </div>
            <Button className="bg-gradient-primary text-white rounded-xl" disabled={busy} onClick={sendEmail}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}Send Email
            </Button>
          </>
        )}
        {mode !== "email" && (
          <>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Notification message..." className="mt-1 rounded-xl resize-none" />
            </div>
            <Button className="bg-gradient-primary text-white rounded-xl" disabled={busy} onClick={sendNotification}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {mode === "broadcast" ? "Broadcast to All" : "Send Notification"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}