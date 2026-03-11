import { sanitizeFilename, ValidationError, BLOCKED_EXTENSIONS } from '../logic/sanitizer';

// ---------------------------------------------------------------------------
// Sanitizer — Unit Tests
//
// Pipeline order:
//   1. Guard         — blocked extension → ValidationError
//   2. normalizeAccents — NFD + \p{Diacritic} removal
//   3. pascalCaseDescription — Description segment only
//   4. stripSpaces   — entire filename
//   5. lowercaseExtension — extension only
// ---------------------------------------------------------------------------

// ===========================================================================
// 1. BLOCKED EXTENSION GUARD
// ===========================================================================

describe('sanitizeFilename — blocked extension guard', () => {
  it('throws ValidationError for .exe extension', () => {
    expect(() => sanitizeFilename('malware.exe')).toThrow(ValidationError);
  });

  it('throws ValidationError case-insensitively for .EXE', () => {
    expect(() => sanitizeFilename('malware.EXE')).toThrow(ValidationError);
  });

  it('throws ValidationError for .sh extension', () => {
    expect(() => sanitizeFilename('script.sh')).toThrow(ValidationError);
  });

  it('throws ValidationError for .zip extension', () => {
    expect(() => sanitizeFilename('archive.zip')).toThrow(ValidationError);
  });

  it('throws ValidationError for .dmg extension', () => {
    expect(() => sanitizeFilename('installer.dmg')).toThrow(ValidationError);
  });

  it('ValidationError exposes the original filename', () => {
    const input = 'bad.ZIP';
    try {
      sanitizeFilename(input);
      fail('Expected ValidationError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).filename).toBe(input);
      expect((err as ValidationError).message).toContain('.zip');
    }
  });

  it('does NOT throw for a safe extension (.pdf)', () => {
    expect(() => sanitizeFilename('01-2024-09-15_MATH_Annot_Worksheet.pdf')).not.toThrow();
  });

  it('does NOT throw for .pages (not blocked — validator will reject it by length)', () => {
    // .pages is 5 chars and will fail FLAIM V6.0 regex, but it is NOT on the blocklist.
    expect(() => sanitizeFilename('01-2024-09-15_Sci_Lab_Report.pages')).not.toThrow();
  });

  it('BLOCKED_EXTENSIONS export contains exactly the four expected values', () => {
    expect(BLOCKED_EXTENSIONS.has('exe')).toBe(true);
    expect(BLOCKED_EXTENSIONS.has('sh')).toBe(true);
    expect(BLOCKED_EXTENSIONS.has('zip')).toBe(true);
    expect(BLOCKED_EXTENSIONS.has('dmg')).toBe(true);
    expect(BLOCKED_EXTENSIONS.size).toBe(4);
  });
});

// ===========================================================================
// 2. ACCENT NORMALIZATION  (step 2 of pipeline)
// ===========================================================================

describe('sanitizeFilename — accent normalization', () => {
  // Non-FLAIM filenames (< 4 underscore segments) isolate this step cleanly —
  // PascalCase does not fire, so only accent removal is observable.

  it('removes cedilla: leçon → lecon (non-FLAIM baseline)', () => {
    const { sanitized } = sanitizeFilename('leçon.pdf');
    expect(sanitized).toBe('lecon.pdf');
  });

  it('removes acute: é → e (Dictée → Dictee, preserving existing uppercase)', () => {
    const { sanitized } = sanitizeFilename('Dictée.pdf');
    expect(sanitized).toBe('Dictee.pdf');
  });

  it('removes grave: à → a', () => {
    const { sanitized } = sanitizeFilename('fiche_à_compléter.pdf');
    expect(sanitized).toBe('fiche_a_completer.pdf');
  });

  it('removes umlaut: ü → u', () => {
    const { sanitized } = sanitizeFilename('übung.pdf');
    expect(sanitized).toBe('ubung.pdf');
  });

  it('removes multiple mixed diacritics in one pass', () => {
    const { sanitized } = sanitizeFilename('éàüçñ.pdf');
    expect(sanitized).toBe('eaucn.pdf');
  });

  it('leaves a purely ASCII non-FLAIM filename unchanged', () => {
    const input = 'report.txt';
    const { sanitized, wasModified } = sanitizeFilename(input);
    expect(sanitized).toBe(input);
    expect(wasModified).toBe(false);
  });

  // FLAIM-structured accent test: PascalCase also fires here.
  it('normalizes accents AND PascalCases description for a FLAIM-structured filename', () => {
    // 'leçon' → normalizeAccents → 'lecon' → PascalCase (single word) → 'Lecon'
    const { sanitized } = sanitizeFilename('01-2024-09-15_Fren_Vocab_leçon.pdf');
    expect(sanitized).toBe('01-2024-09-15_Fren_Vocab_Lecon.pdf');
  });

  it('handles French "Dictée" description: removes accent, preserves leading cap', () => {
    // 'Dictée' → 'Dictee' → PascalCase single word → 'Dictee' (already starts with capital)
    const { sanitized } = sanitizeFilename('01-2024-09-15_Fren_Vocab_Dictée.pdf');
    expect(sanitized).toBe('01-2024-09-15_Fren_Vocab_Dictee.pdf');
  });
});

// ===========================================================================
// 3. PASCAL CASE DESCRIPTION  (step 3 of pipeline)
// ===========================================================================

describe('sanitizeFilename — PascalCase description', () => {
  it('capitalizes a single lowercase word description', () => {
    const { sanitized } = sanitizeFilename('01-2024-09-15_Sci_Lab_report.txt');
    expect(sanitized).toBe('01-2024-09-15_Sci_Lab_Report.txt');
  });

  it('converts a multi-word spaced description to PascalCase (space = word boundary)', () => {
    // The classic French immersion use case: 'mardi gras' → 'MardiGras'
    const { sanitized } = sanitizeFilename('01-2024-09-15_MATH_Annot_mardi gras.pdf');
    expect(sanitized).toBe('01-2024-09-15_MATH_Annot_MardiGras.pdf');
  });

  it('converts a description with stray underscores to PascalCase (underscore = word boundary)', () => {
    // 'lesson_plan' in the description creates 5 underscore-segments; handled by joining parts[3+]
    const { sanitized } = sanitizeFilename('01-2024-09-15_MATH_Annot_lesson_plan.pdf');
    expect(sanitized).toBe('01-2024-09-15_MATH_Annot_LessonPlan.pdf');
  });

  it('is idempotent: already-PascalCase description is not re-cased', () => {
    const input = '01-2024-09-15_MATH_Annot_Worksheet.pdf';
    const { sanitized, wasModified } = sanitizeFilename(input);
    expect(sanitized).toBe(input);
    expect(wasModified).toBe(false);
  });

  it('does NOT PascalCase non-FLAIM filenames with fewer than 4 underscore segments', () => {
    const input = 'three_part_file.pdf';
    const { sanitized } = sanitizeFilename(input);
    expect(sanitized).toBe(input);
  });

  it('strips non-alphanumeric chars from description (hyphens, spaces become boundaries)', () => {
    const { sanitized } = sanitizeFilename('01-2024-09-15_Fren_Test_avant-hier.pdf');
    expect(sanitized).toBe('01-2024-09-15_Fren_Test_AvantHier.pdf');
  });
});

// ===========================================================================
// 4. SPACE STRIPPING  (step 4 of pipeline)
// ===========================================================================

describe('sanitizeFilename — space stripping', () => {
  it('removes a single interior space from a non-FLAIM filename', () => {
    const { sanitized } = sanitizeFilename('my file.pdf');
    expect(sanitized).toBe('myfile.pdf');
  });

  it('strips spaces outside the description AND PascalCases the description', () => {
    // Spaces in prefix/subject/filetype get stripped; space in description becomes word boundary.
    const { sanitized } = sanitizeFilename('01-2024-09-15 _MATH_ Annot_work sheet.pdf');
    expect(sanitized).toBe('01-2024-09-15_MATH_Annot_WorkSheet.pdf');
  });

  it('removes leading and trailing spaces from non-FLAIM filename', () => {
    const { sanitized } = sanitizeFilename(' report.pdf ');
    expect(sanitized).toBe('report.pdf');
  });

  it('a FLAIM filename with spaces is modified (PascalCase + space removal)', () => {
    const { sanitized, wasModified } = sanitizeFilename('01-2024-09-15_MATH_Annot_work sheet.pdf');
    expect(sanitized).toBe('01-2024-09-15_MATH_Annot_WorkSheet.pdf');
    expect(wasModified).toBe(true);
  });
});

// ===========================================================================
// 5. EXTENSION LOWERCASING  (step 5 of pipeline)
// ===========================================================================

describe('sanitizeFilename — extension lowercasing', () => {
  it('lowercases an all-uppercase extension (.PDF → .pdf)', () => {
    const { sanitized } = sanitizeFilename('worksheet.PDF');
    expect(sanitized).toBe('worksheet.pdf');
  });

  it('lowercases a mixed-case extension (.DocX → .docx)', () => {
    const { sanitized } = sanitizeFilename('report.DocX');
    expect(sanitized).toBe('report.docx');
  });

  it('handles a file with no extension gracefully', () => {
    const { sanitized } = sanitizeFilename('noextension');
    expect(sanitized).toBe('noextension');
  });

  it('lowercases extension without touching subject-code uppercase in body', () => {
    // Use an already-PascalCase description so only ext-lowercasing is the change.
    const { sanitized } = sanitizeFilename('01-2024-09-15_MATH_Annot_Worksheet.PDF');
    expect(sanitized).toBe('01-2024-09-15_MATH_Annot_Worksheet.pdf');
    expect(sanitized).toContain('_MATH_');   // subject code uppercase preserved
    expect(sanitized).toContain('_Annot_');  // file type case preserved
  });
});

// ===========================================================================
// 6. COMBINED PIPELINE
// ===========================================================================

describe('sanitizeFilename — combined pipeline', () => {
  it('applies all steps in one call: accents + PascalCase + spaces + ext', () => {
    // 'leçon 1' → normalizeAccents → 'lecon 1'
    //           → pascalCase (space = boundary) → 'Lecon1'
    //           → stripSpaces (none left)
    //           → lowercaseExt '.PDF' → '.pdf'
    const { sanitized, wasModified } = sanitizeFilename('01-2024-09-15_Fren_Vocab_leçon 1.PDF');
    expect(sanitized).toBe('01-2024-09-15_Fren_Vocab_Lecon1.pdf');
    expect(wasModified).toBe(true);
  });

  it('returns wasModified=false only when the filename is fully pristine', () => {
    // Pristine means: PascalCase description, lowercase ext, no accents, no spaces.
    const pristine = '01-2024-09-15_MATH_Annot_Worksheet.pdf';
    const { sanitized, wasModified } = sanitizeFilename(pristine);
    expect(sanitized).toBe(pristine);
    expect(wasModified).toBe(false);
  });

  it('preserves the original value in the result object', () => {
    const input = 'my étude.PDF';
    const result = sanitizeFilename(input);
    expect(result.original).toBe(input);
    // Non-FLAIM (< 4 segments): no PascalCase, just accent strip + space remove + ext lower
    expect(result.sanitized).toBe('myetude.pdf');
    expect(result.wasModified).toBe(true);
  });

  it('handles an empty string without throwing', () => {
    const { sanitized, wasModified } = sanitizeFilename('');
    expect(sanitized).toBe('');
    expect(wasModified).toBe(false);
  });

  it('produces a FLAIM-valid filename from a dirty French immersion input', () => {
    // Full real-world scenario: accented description + mixed-case ext + space
    const dirty = '05-2024-03-08_Fren_Vocab_Français leçon.PDF';
    const { sanitized } = sanitizeFilename(dirty);
    // 'Français leçon' → 'Francais lecon' (accents) → 'FrancaisLecon' (PascalCase) → spaces gone
    expect(sanitized).toBe('05-2024-03-08_Fren_Vocab_FrancaisLecon.pdf');
  });
});
