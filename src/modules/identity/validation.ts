export const PASSWORD_MIN_LENGTH = 12;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 40;

const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _'’.\-]*$/u;

export interface PasswordChecks {
  longEnough: boolean;
  hasLetter: boolean;
  hasNumberOrSymbol: boolean;
}

export function passwordChecks(password: string): PasswordChecks {
  return {
    longEnough: password.length >= PASSWORD_MIN_LENGTH,
    hasLetter: /\p{L}/u.test(password),
    hasNumberOrSymbol: /[^\p{L}\s]/u.test(password),
  };
}

export function isValidPassword(password: string): boolean {
  return Object.values(passwordChecks(password)).every(Boolean);
}

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function displayNameError(value: string): string | null {
  const name = normalizeDisplayName(value);
  if (name.length < DISPLAY_NAME_MIN_LENGTH || name.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Le pseudonyme doit contenir entre ${DISPLAY_NAME_MIN_LENGTH} et ${DISPLAY_NAME_MAX_LENGTH} caractères.`;
  }
  if (!DISPLAY_NAME_PATTERN.test(name)) {
    return "Utilisez uniquement des lettres, chiffres, espaces, apostrophes, points, tirets ou tirets bas.";
  }
  return null;
}
