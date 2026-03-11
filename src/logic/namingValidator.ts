/**
 * namingValidator.ts
 *
 * Validates filenames against the FLAIM V6.0 naming standard.
 *
 * Format:  [Prefix]-[Date]_[SubjectCode]_[FileType]_[Description].[ext]
 * Example: 01-2024-09-15_MATH_Annot_worksheet.pdf
 *
 * Regex breakdown:
 *   ^\d{2}              — 2-digit numeric prefix
 *   -\d{4}-\d{2}-\d{2} — ISO-style date (YYYY-MM-DD)
 *   _(MATH|Sci|SS|Fren|Comm) — subject code (exact case)
 *   _[A-Za-z0-9]+       — file type (alphanumeric, 1+ chars)
 *   _[A-Za-z0-9]+       — description (alphanumeric, 1+ chars)
 *   \.[a-z]{2,4}$       — lowercase extension (2–4 chars)
 */

export const FLAIM_V6_REGEX =
  /^\d{2}-\d{4}-\d{2}-\d{2}_(MATH|Sci|SS|Fren|Comm)_[A-Za-z0-9]+_[A-Za-z0-9]+\.[a-z]{2,4}$/;

export type SubjectCode = 'MATH' | 'Sci' | 'SS' | 'Fren' | 'Comm';

export interface ValidationResult {
  readonly isValid: boolean;
  readonly filename: string;
  readonly reason?: string;
}

/**
 * Parses a validated filename into its FLAIM V6.0 components.
 * Returns null if the filename does not match the schema.
 */
export interface FlaimComponents {
  readonly prefix: string;
  readonly date: string;
  readonly subjectCode: SubjectCode;
  readonly fileType: string;
  readonly description: string;
  readonly extension: string;
}

/**
 * Tests a filename string against the FLAIM V6.0 regex.
 *
 * @param filename - The bare filename (no directory path).
 * @returns A ValidationResult indicating pass/fail with an optional reason.
 */
export function validateFilename(filename: string): ValidationResult {
  if (filename.trim() === '') {
    return { isValid: false, filename, reason: 'Filename is empty.' };
  }

  if (!FLAIM_V6_REGEX.test(filename)) {
    return {
      isValid: false,
      filename,
      reason: `Does not match FLAIM V6.0 pattern: ${FLAIM_V6_REGEX.source}`,
    };
  }

  return { isValid: true, filename };
}

/**
 * Parses a FLAIM V6.0-compliant filename into its constituent components.
 * Returns null when the filename fails validation.
 *
 * @param filename - A validated filename string.
 */
export function parseFilename(filename: string): FlaimComponents | null {
  if (!FLAIM_V6_REGEX.test(filename)) {
    return null;
  }

  // Pattern: XX-YYYY-MM-DD_SubjectCode_FileType_Description.ext
  const dotIndex = filename.lastIndexOf('.');
  const extension = filename.slice(dotIndex + 1);
  const body = filename.slice(0, dotIndex);

  const parts = body.split('_');
  // parts[0] = "XX-YYYY-MM-DD", parts[1] = SubjectCode, parts[2] = FileType, parts[3] = Description
  const prefixDate = parts[0];
  const dashIndex = prefixDate.indexOf('-');
  const prefix = prefixDate.slice(0, dashIndex);
  const date = prefixDate.slice(dashIndex + 1);

  return {
    prefix,
    date,
    subjectCode: parts[1] as SubjectCode,
    fileType: parts[2],
    description: parts[3],
    extension,
  };
}
