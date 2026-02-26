// ─── Content Length Limits ────────────────────────────────────
export const MAX_LENGTHS = {
  POST_CONTENT: 2000,
  COMMENT_CONTENT: 500,
  PRAYER_CONTENT: 1000,
  PRAYER_COMMENT: 500,
  MESSAGE_CONTENT: 1000,
  TESTIMONY_CONTENT: 2000,
  TESTIMONY_COMMENT: 500,
  EVENT_TITLE: 150,
  EVENT_DESCRIPTION: 2000,
  EVENT_LOCATION: 200,
  STUDY_TITLE: 150,
  STUDY_DESCRIPTION: 2000,
  ALBUM_TITLE: 100,
  ALBUM_DESCRIPTION: 500,
  PHOTO_CAPTION: 300,
  RESOURCE_TITLE: 200,
  RESOURCE_DESCRIPTION: 2000,
  RESOURCE_LINK: 2000,
  DEVOTIONAL_THEME: 200,
  DEVOTIONAL_SCRIPTURE_REF: 200,
  DEVOTIONAL_TEXT: 5000,
  DEVOTIONAL_REFLECTION: 5000,
  DEVOTIONAL_AFFIRMATION: 2000,
  DEVOTIONAL_PRAYER: 2000,
  POD_NAME: 100,
  POD_DESCRIPTION: 500,
  POD_CHECKIN: 1000,
  FOLLOW_UP_NOTE: 2000,
  GUIDE_TITLE: 200,
  GUIDE_CONTENT: 10000,
  PROFILE_ABOUT: 500,
  PROFILE_PRAYER_FOCUS: 500,
  PROFILE_NAME: 50,
  ELDER_QUESTION: 1000,
  ELDER_ANSWER: 5000,
  GRATITUDE: 500,
  ENCOURAGEMENT: 500,
} as const;

// ─── Validation Result ───────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Core Validators ─────────────────────────────────────────

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  return { valid: true };
}

export function validateMaxLength(value: string, max: number, fieldName: string): ValidationResult {
  if (value.length > max) {
    return { valid: false, error: `${fieldName} is too long (max ${max} characters)` };
  }
  return { valid: true };
}

export function validateUrl(value: string, fieldName: string = 'URL'): ValidationResult {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: `${fieldName} must use http or https` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `${fieldName} is not a valid URL` };
  }
}

/**
 * Combined required + max-length check (most common pattern).
 * Pass required=false for optional fields — skips empty check but still enforces max length.
 */
export function validateTextField(
  value: string,
  maxLength: number,
  fieldName: string,
  required = true,
): ValidationResult {
  if (required) {
    const req = validateRequired(value, fieldName);
    if (!req.valid) return req;
  }
  if (value) {
    const len = validateMaxLength(value, maxLength, fieldName);
    if (!len.valid) return len;
  }
  return { valid: true };
}

/**
 * Trim whitespace and collapse excessive newlines (3+ → 2).
 * NOT for XSS — React handles that. This is for content quality.
 */
export function sanitizeText(value: string): string {
  return value.trim().replace(/\n{3,}/g, '\n\n');
}

// ─── Rate Limiting ───────────────────────────────────────────

const cooldowns = new Map<string, number>();

export function checkRateLimit(actionKey: string, cooldownMs: number): ValidationResult {
  const now = Date.now();
  const last = cooldowns.get(actionKey) || 0;
  if (now - last < cooldownMs) {
    const secondsLeft = Math.ceil((cooldownMs - (now - last)) / 1000);
    return { valid: false, error: `Please wait ${secondsLeft}s before trying again` };
  }
  cooldowns.set(actionKey, now);
  return { valid: true };
}
