import { base44 } from "@/api/base44Client";

let cachedEmail = null;

export async function logAudit({ action, targetType, targetId, details }) {
  try {
    if (!cachedEmail) {
      const me = await base44.auth.me();
      cachedEmail = me?.email || "system";
    }
    await base44.entities.AuditLog.create({
      action,
      actor_email: cachedEmail,
      target_type: targetType || "",
      target_id: targetId || "",
      details: details || "",
    });
  } catch {}
}

export async function fetchSettings() {
  try {
    const settings = await base44.entities.PlatformSetting.list();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return map;
  } catch {
    return {};
  }
}

export async function saveSetting(key, value, category = "general") {
  try {
    const me = await base44.auth.me();
    const existing = await base44.entities.PlatformSetting.filter({ key });
    if (existing.length > 0) {
      await base44.entities.PlatformSetting.update(existing[0].id, {
        value: String(value),
        updated_by_email: me?.email || "",
      });
    } else {
      await base44.entities.PlatformSetting.create({
        key,
        value: String(value),
        category,
        updated_by_email: me?.email || "",
      });
    }
    await logAudit({ action: `setting.update`, targetType: "setting", targetId: key, details: `${key} = ${value}` });
    return true;
  } catch {
    return false;
  }
}