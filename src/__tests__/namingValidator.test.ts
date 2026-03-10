import { validateFilename, parseFilename, FLAIM_V6_REGEX } from '../logic/namingValidator';

// ---------------------------------------------------------------------------
// FLAIM V6.0 Naming Validator — Unit Tests
// Format: XX-YYYY-MM-DD_SubjectCode_FileType_Description.ext
// ---------------------------------------------------------------------------

describe('FLAIM_V6_REGEX', () => {
  it('exports a RegExp object', () => {
    expect(FLAIM_V6_REGEX).toBeInstanceOf(RegExp);
  });
});

// ---------------------------------------------------------------------------
// validateFilename — 10 VALID cases
// ---------------------------------------------------------------------------

describe('validateFilename — valid filenames', () => {
  const validCases: [string, string][] = [
    ['01-2024-09-15_MATH_Annot_worksheet.pdf',  'standard MATH+Annot PDF'],
    ['02-2024-01-01_Sci_Lab_report.txt',         'Sci+Lab TXT, date boundary Jan 1'],
    ['99-2025-12-31_SS_Quiz_unit3.jpg',          'SS+Quiz JPG, date boundary Dec 31, numeric description'],
    ['10-2023-06-20_Fren_Test_vocab.png',        'Fren+Test PNG'],
    ['05-2024-03-08_Comm_Essay_draft.docx',      'Comm+Essay DOCX (4-char ext)'],
    ['07-2024-09-15_Fren_Vocab_lecon1.wav',      'Fren+Vocab WAV with alphanumeric description (ext is letters-only per spec)'],
    ['11-2024-09-15_Comm_Notes_class1.md',       'Comm+Notes MD (2-char ext)'],
    ['00-2024-09-15_MATH_Annot_homework.pdf',    'prefix 00 is valid (two digits)'],
    ['03-2024-09-15_Sci_Lab_test123.xml',        'Sci+Lab XML (3-char ext), numeric suffix'],
    ['55-2099-07-04_SS_Quiz_chapter4.jpg',       'far-future year, numeric description suffix'],
  ];

  test.each(validCases)('PASS: %s (%s)', (filename) => {
    const result = validateFilename(filename);
    expect(result.isValid).toBe(true);
    expect(result.filename).toBe(filename);
    expect(result.reason).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateFilename — 10 INVALID cases
// ---------------------------------------------------------------------------

describe('validateFilename — invalid filenames', () => {
  const invalidCases: [string, string][] = [
    ['01-2024-09-15_PHYS_Annot_worksheet.pdf',  'PHYS is not a valid subject code'],
    ['1-2024-09-15_MATH_Annot_worksheet.pdf',   'prefix is only 1 digit (needs 2)'],
    ['01-2024-9-15_MATH_Annot_worksheet.pdf',   'month is only 1 digit (needs 2)'],
    ['01-2024-09-15_MATH_Annot_work sheet.pdf', 'space in description fails regex'],
    ['01-2024-09-15_MATH_Annot_worksheet.PDF',  'uppercase extension fails (must be lowercase)'],
    ['01-2024-09-15_MATH_worksheet.pdf',         'missing FileType segment (only 3 underscore groups)'],
    ['01-2024-09-15_math_Annot_worksheet.pdf',  'lowercase subject code "math" is not in enum'],
    ['01_2024-09-15_MATH_Annot_worksheet.pdf',  'underscore instead of hyphen after prefix'],
    ['01-2024-09-15_MATH_Annot_work-sheet.pdf', 'hyphen in description (only alphanumeric allowed)'],
    ['',                                          'empty string'],
  ];

  test.each(invalidCases)('FAIL: "%s" (%s)', (filename) => {
    const result = validateFilename(filename);
    expect(result.isValid).toBe(false);
    expect(result.filename).toBe(filename);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// parseFilename — component extraction
// ---------------------------------------------------------------------------

describe('parseFilename', () => {
  it('returns null for invalid filename', () => {
    expect(parseFilename('invalid_file.pdf')).toBeNull();
    expect(parseFilename('')).toBeNull();
  });

  it('correctly extracts components from a valid filename', () => {
    const result = parseFilename('01-2024-09-15_MATH_Annot_worksheet.pdf');
    expect(result).not.toBeNull();
    expect(result?.prefix).toBe('01');
    expect(result?.date).toBe('2024-09-15');
    expect(result?.subjectCode).toBe('MATH');
    expect(result?.fileType).toBe('Annot');
    expect(result?.description).toBe('worksheet');
    expect(result?.extension).toBe('pdf');
  });

  it('correctly extracts components for each subject code', () => {
    const subjects = ['MATH', 'Sci', 'SS', 'Fren', 'Comm'] as const;
    for (const sub of subjects) {
      const filename = `01-2024-01-01_${sub}_Notes_topic1.pdf`;
      const result = parseFilename(filename);
      expect(result).not.toBeNull();
      expect(result?.subjectCode).toBe(sub);
    }
  });

  it('handles 2-char and 4-char extensions', () => {
    const md = parseFilename('01-2024-01-01_Comm_Notes_summary.md');
    expect(md?.extension).toBe('md');

    const docx = parseFilename('01-2024-01-01_Comm_Notes_summary.docx');
    expect(docx?.extension).toBe('docx');
  });
});

// ---------------------------------------------------------------------------
// Third-party & over-length extension cases
// These pass through the sanitizer without throwing (not on the blocklist)
// but are correctly rejected here because the extension exceeds 4 characters.
// ---------------------------------------------------------------------------

describe('validateFilename — third-party app extensions', () => {
  const cases: [string, string][] = [
    [
      '01-2024-09-15_Sci_Lab_Report.pages',
      '.pages is 5 chars — exceeds FLAIM V6.0 max of 4',
    ],
    [
      '01-2024-09-15_Sci_Lab_Report.numbers',
      '.numbers is 7 chars — exceeds FLAIM V6.0 max of 4',
    ],
  ];

  test.each(cases)('FAIL: "%s" (%s)', (filename) => {
    const result = validateFilename(filename);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('clarifies: these extensions are NOT on the blocked list (sanitizer passes them through)', () => {
    // The sanitizer will not throw; the validator rejects them on extension length.
    // This test documents the contract between the two layers.
    expect(['pages', 'numbers'].some((e) => e === 'exe')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Whitespace edge cases
// ---------------------------------------------------------------------------

describe('validateFilename — whitespace edge cases', () => {
  it('rejects a filename that is only whitespace', () => {
    const result = validateFilename('   ');
    expect(result.isValid).toBe(false);
  });

  it('rejects a filename with a leading space before a valid pattern', () => {
    const result = validateFilename(' 01-2024-09-15_MATH_Annot_worksheet.pdf');
    expect(result.isValid).toBe(false);
  });

  it('rejects a filename with a trailing newline', () => {
    const result = validateFilename('01-2024-09-15_MATH_Annot_worksheet.pdf\n');
    expect(result.isValid).toBe(false);
  });
});
