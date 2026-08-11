// Shared Google auth helpers — friendly error mapping + post-login redirect path.
export const GOOGLE_REDIRECT_PATH = "/auth-success";

/**
 * Maps a Google/OAuth error to a user-friendly message.
 * Used by login & register pages so users never see a raw error or get stuck loading.
 */
export const friendlyGoogleError = (err) => {
  const msg = String(err?.message || err || "").toLowerCase();
  if (msg.includes("popup") && msg.includes("closed")) return "Sign-in cancelled — the Google popup was closed.";
  if (msg.includes("popup") || msg.includes("blocked")) return "Sign-in popup was blocked. Please allow popups for this site and try again.";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection")) return "Network error. Check your connection and try again.";
  if (msg.includes("cancel")) return "Authentication cancelled. Please try again.";
  if (msg.includes("invalid") && msg.includes("credential")) return "Invalid credentials. Please try a different account.";
  if (msg.includes("domain") || msg.includes("unauthorized")) return "This domain isn't authorized for Google sign-in. Contact support.";
  if (msg.includes("firebase") || msg.includes("config")) return "Authentication configuration error. Please contact support.";
  return "Google sign-in failed. Please try again.";
};