// Super Admin detection — single designated account.
export const SUPER_ADMIN_EMAIL = "araf.bd518@gmail.com";

export const isSuperAdmin = (user) => {
  if (!user) return false;
  return String(user.email || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
};