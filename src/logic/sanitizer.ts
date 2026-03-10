/**
 * sanitizer.ts
 *
 * Sanitizes a raw filename before FLAIM V6.0 validation.
 *
 * Pipeline (in order):
 *   1. Guard     — throw ValidationError for blocked extensions (.exe .sh .zip .dmg).
 *   2. Accents   — NFD decomposition + /\p{Diacritic}/gu removal.
 *                  'Dictée' → 'Dictee'  |  'leçon' → 'lecon'
 *   3. PascalCase — Force Description segment (4th underscore-part) to PascalCase.
 *                  'mardi gras' → 'MardiGras'  |  'lesson_plan' → 'LessonPlan'
 *   4. Spaces    — Strip all remaining U+0020 SPACE characters.
 *   5. Extension — Lowercase the file extension only.
 *                  'report.PDF' → 'report.pdf'
 */

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/**
 * Thrown when a filename carries a blocked extension.
 * Phase 3 watcher catches this and routes the file to /errors.
 */
export class ValidationError extends Error {
  public readonly filename: string;

  constructor(message: string, filename: string) {
    super(message);
    this.name = 'ValidationError';
    this.filename = filename;
    // Restore prototype chain so `instanceof ValidationError` survives TS→JS transpile.
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * File extensions that are unconditionally rejected.
 * Comparison is always case-insensitive (.EXE and .exe are both caught).
 */
export const BLOCKED_EXTENSIONS = new Set<string>(['exe', 'sh', 'zip', 'dmg']);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SanitizeResult {
  readonly original: string;
  readonly sanitized: string;
  readonly wasModified: boolean;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Case-insensitive guard: throws ValidationError if the extension is blocked.
 * Runs against the *original* filename so the error message is unambiguous.
 */
function checkBlockedExtension(filename: string): void {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return;
  const ext = filename.slice(dotIndex + 1).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new ValidationError(
      `Blocked extension ".${ext}" is not permitted and will be routed to /errors.`,
      filename,
    );
  }
}

/**
 * Normalizes Unicode diacritics using the Unicode 'Diacritic' property escape.
 *
 * NFD decomposition first splits a precomposed character (e.g. é U+00E9) into
 * its base letter (e U+0065) plus combining accent (´ U+0301).  The regex then
 * strips every character with the Unicode Diacritic property.
 *
 * 'Dictée'  → 'Dictee'
 * 'Français' → 'Francais'
 * 'leçon'   → 'lecon'
 */
function normalizeAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Forces the Description segment (4th underscore-delimited part) to PascalCase.
 *
 * Any run of non-alphanumeric characters (spaces, hyphens, extra underscores,
 * etc.) is treated as a word boundary: the first letter of each word is
 * uppercased, non-alphanumeric chars are stripped, and the words are joined.
 *
 * 'mardi gras'  → 'MardiGras'     (space as word boundary)
 * 'lesson_plan' → 'LessonPlan'    (stray underscore as word boundary)
 * 'Worksheet'   → 'Worksheet'     (idempotent — already PascalCase)
 * 'worksheet'   → 'Worksheet'     (first letter forced up)
 *
 * Files with fewer than 4 underscore segments are returned unchanged — they
 * are not FLAIM-structured, so no description segment can be identified.
 */
function pascalCaseDescription(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  const ext = dotIndex === -1 ? '' : filename.slice(dotIndex);
  const base = dotIndex === -1 ? filename : filename.slice(0, dotIndex);

  const parts = base.split('_');
  if (parts.length < 4) {
    return filename;
  }

  // Join segments [3..n] with '_' before PascalCasing so that any extra
  // underscores inside a "dirty" description are treated as word separators.
  const descRaw = parts.slice(3).join('_');
  const descPascal = descRaw
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return [...parts.slice(0, 3), descPascal].join('_') + ext;
}

/** Strips every U+0020 SPACE from the entire string. */
function stripSpaces(value: string): string {
  return value.replace(/ /g, '');
}

/**
 * Lowercases only the file extension; the filename body is untouched.
 *
 * 'MATH_Annot_Worksheet.PDF' → 'MATH_Annot_Worksheet.pdf'
 * 'noextension'              → 'noextension'
 */
function lowercaseExtension(value: string): string {
  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return value;
  return value.slice(0, dotIndex) + '.' + value.slice(dotIndex + 1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs a raw filename through the full sanitization pipeline.
 *
 * @param filename  Bare filename (no directory path).
 * @throws {ValidationError}  When the extension is on the blocklist.
 * @returns SanitizeResult with sanitized filename and a modification flag.
 */
export function sanitizeFilename(filename: string): SanitizeResult {
  checkBlockedExtension(filename);

  const step1 = normalizeAccents(filename);
  const step2 = pascalCaseDescription(step1);
  const step3 = stripSpaces(step2);
  const sanitized = lowercaseExtension(step3);

  return {
    original: filename,
    sanitized,
    wasModified: sanitized !== filename,
  };
}
