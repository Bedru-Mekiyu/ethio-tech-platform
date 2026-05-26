const TAG_PATTERN = /<[^>]*>/g;
const SCRIPT_PATTERN = /javascript:/gi;

export const sanitizePlainText = (value, maxLength = 5000) => {
  if (typeof value !== "string") return "";
  return value
    .replace(TAG_PATTERN, "")
    .replace(SCRIPT_PATTERN, "")
    .trim()
    .slice(0, maxLength);
};

export const sanitizeOptionalText = (value, maxLength = 5000) => {
  if (value === undefined || value === null) return value;
  return sanitizePlainText(String(value), maxLength);
};
