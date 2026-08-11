// Website URL validation and normalization helpers.
// Accepts full http(s) URLs; rejects bare words, empty hosts, and bare schemes.

const URL_REGEX = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]{2,}(:\d+)?(\/[^\s]*)?$/i;

/**
 * Returns true when `value` is a valid absolute http(s) URL with a real host.
 */
export const isValidWebsiteUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  return URL_REGEX.test(value.trim());
};

/**
 * Best-effort normalization: if the user typed a bare domain
 * (e.g. "example.com" or "www.example.com/path"), prepend https://.
 * Returns the original value when it can't be normalized to a valid URL.
 */
export const normalizeWebsiteUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Looks like a domain (contains a dot, no spaces) — prepend https://
  if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/[^\s]*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

/**
 * Validates a value and returns { valid, normalized, error }.
 * `error` is a friendly message (empty when valid).
 */
export const validateWebsiteUrl = (value) => {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) {
    return { valid: false, normalized: "", error: "Please enter a website URL." };
  }
  if (!isValidWebsiteUrl(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Enter a full URL, e.g. https://example.com",
    };
  }
  return { valid: true, normalized, error: "" };
};