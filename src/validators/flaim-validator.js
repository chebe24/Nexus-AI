/**
 * FLAIM File Naming Convention - Validator
 * Version: 1.1
 * Last Updated: 2026-01-21
 * 
 * Validates filenames against FLAIM naming convention rules.
 * Returns detailed error messages and suggested fixes.
 */

const {
  ALLOWED_ROOTS,
  ALLOWED_TYPES,
  ALLOWED_TAGS,
  TYPES_REQUIRING_WEEK_PREFIX,
  MIN_WEEK,
  MAX_WEEK,
  TYPE_TO_FORCED_ROOT,
  TYPE_TO_ALLOWED_EXT,
  FILENAME_REGEX,
  WINDOWS_RESERVED,
  WEEK_START_DATES,
  HOLIDAY_BREAKS,
  ERROR_CODES
} = require('./flaim-rules-map.js');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a date string is a valid calendar date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Convert date string to week number
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {number|null} - Week number (0-37) or null if not in school year
 */
function dateToWeekNumber(dateStr) {
  const targetDate = new Date(dateStr);
  
  // Check if in holiday break
  for (const holiday of HOLIDAY_BREAKS) {
    const start = new Date(holiday.start);
    const end = new Date(holiday.end);
    if (targetDate >= start && targetDate <= end) {
      return holiday.nextWeek;
    }
  }
  
  // Find which week the date falls into
  for (let week = WEEK_START_DATES.length - 1; week >= 0; week--) {
    const weekStart = new Date(WEEK_START_DATES[week]);
    if (targetDate >= weekStart) {
      return week;
    }
  }
  
  return null;
}

/**
 * Parse week number from prefix
 * @param {string} prefix - Prefix like "21-" or "00-"
 * @returns {number} - Week number (0-99)
 */
function parseWeekFromPrefix(prefix) {
  if (!prefix) return null;
  return parseInt(prefix.replace('-', ''), 10);
}

/**
 * Format week number as prefix
 * @param {number} week - Week number
 * @returns {string} - Prefix like "21-"
 */
function formatWeekAsPrefix(week) {
  return String(week).padStart(2, '0') + '-';
}

// =============================================================================
// MAIN VALIDATOR FUNCTION
// =============================================================================

/**
 * Validate a FLAIM filename
 * @param {string} filename - The filename to validate
 * @returns {Object} - Validation result with tokens, errors, and suggested fixes
 */
function validateFilename(filename) {
  const result = {
    isValid: true,
    tokens: {
      prefix: null,
      description: null,
      root: null,
      type: null,
      date: null,
      tag: null,
      ext: null
    },
    errors: []
  };

  // ==========================================================================
  // Stage 1: Structural Regex Validation
  // ==========================================================================
  
  const match = filename.match(FILENAME_REGEX);
  
  if (!match) {
    result.isValid = false;
    result.errors.push({
      code: ERROR_CODES.INVALID_STRUCTURE,
      message: 'Filename does not match FLAIM pattern: [Prefix][Description]_[Root]_[Type]_[Date].[ext]',
      suggestedFix: 'Ensure filename follows pattern like: 21-M4TBL9_Math_LP_2026-01-20.docx'
    });
    return result;
  }

  // Extract tokens from regex groups
  const [, prefix, description, root, type, date, tag, ext] = match;
  
  result.tokens = {
    prefix: prefix || null,
    description,
    root,
    type,
    date,
    tag: tag || null,
    ext
  };

  // ==========================================================================
  // Stage 2: Rules Validation
  // ==========================================================================
  
  // --- A) Prefix Rules ---
  
  const weekNumber = parseWeekFromPrefix(prefix);
  const requiresWeekPrefix = TYPES_REQUIRING_WEEK_PREFIX.includes(type);
  
  if (requiresWeekPrefix) {
    // LP and Annot MUST have week prefix (01-37)
    if (!prefix) {
      result.isValid = false;
      const suggestedWeek = dateToWeekNumber(date) || 21;
      result.errors.push({
        code: ERROR_CODES.MISSING_PREFIX,
        message: `Type "${type}" requires a week prefix (01-37)`,
        suggestedFix: `Add prefix: ${formatWeekAsPrefix(suggestedWeek)}${description}_${root}_${type}_${date}${tag ? '_' + tag : ''}.${ext}`
      });
    } else if (prefix === '00-') {
      result.isValid = false;
      const suggestedWeek = dateToWeekNumber(date) || 21;
      result.errors.push({
        code: ERROR_CODES.INVALID_PREFIX_FOR_TYPE,
        message: `Type "${type}" cannot use planning prefix (00-). Must use week number (01-37)`,
        suggestedFix: `Change prefix: ${formatWeekAsPrefix(suggestedWeek)}${description}_${root}_${type}_${date}${tag ? '_' + tag : ''}.${ext}`
      });
    } else if (weekNumber < MIN_WEEK || weekNumber > MAX_WEEK) {
      result.isValid = false;
      result.errors.push({
        code: ERROR_CODES.INVALID_WEEK_NUMBER,
        message: `Week number ${weekNumber} is outside valid range (01-37)`,
        suggestedFix: `Use a week number between 01 and 37`
      });
    }
  } else {
    // Other types: prefix is optional, but if present must be valid
    if (prefix && prefix !== '00-') {
      if (weekNumber < 0 || weekNumber > MAX_WEEK) {
        result.isValid = false;
        result.errors.push({
          code: ERROR_CODES.INVALID_WEEK_NUMBER,
          message: `Week number ${weekNumber} is outside valid range (00-37)`,
          suggestedFix: `Use 00- for planning or a week number between 01 and 37`
        });
      }
    }
  }

  // --- B) Routing Constraints ---
  
  const forcedRoot = TYPE_TO_FORCED_ROOT[type];
  if (forcedRoot && root !== forcedRoot) {
    result.isValid = false;
    result.errors.push({
      code: ERROR_CODES.ROUTING_VIOLATION,
      message: `Type "${type}" must use RootFolder "${forcedRoot}", not "${root}"`,
      suggestedFix: `Rename to: ${prefix || ''}${description}_${forcedRoot}_${type}_${date}${tag ? '_' + tag : ''}.${ext}`
    });
  }

  // --- C) Type-to-Extension Constraints ---
  
  const allowedExts = TYPE_TO_ALLOWED_EXT[type];
  if (allowedExts && !allowedExts.includes(ext)) {
    result.isValid = false;
    const suggestedExt = allowedExts[0];
    result.errors.push({
      code: ERROR_CODES.INVALID_EXTENSION,
      message: `Type "${type}" does not allow extension ".${ext}". Allowed: ${allowedExts.map(e => '.' + e).join(', ')}`,
      suggestedFix: `Change extension to .${suggestedExt} or change Type`
    });
  }

  // --- D) Date Validation ---
  
  if (!isValidDate(date)) {
    result.isValid = false;
    result.errors.push({
      code: ERROR_CODES.INVALID_DATE,
      message: `Date "${date}" is not a valid calendar date`,
      suggestedFix: `Use a valid date in YYYY-MM-DD format`
    });
  }

  // --- E) Windows Reserved Names ---
  
  const descriptionUpper = description.toUpperCase();
  if (WINDOWS_RESERVED.includes(descriptionUpper)) {
    result.isValid = false;
    result.errors.push({
      code: ERROR_CODES.RESERVED_NAME,
      message: `Description "${description}" is a Windows reserved name`,
      suggestedFix: `Use a different description (avoid CON, PRN, AUX, NUL, COM1-9, LPT1-9)`
    });
  }

  return result;
}

// =============================================================================
// AUTO-SUGGEST RENAME FUNCTION
// =============================================================================

/**
 * Generate a corrected filename based on validation errors
 * @param {string} filename - Original filename
 * @param {Object} validationResult - Result from validateFilename()
 * @returns {string|null} - Suggested corrected filename or null if unfixable
 */
function suggestCorrectFilename(filename, validationResult) {
  if (validationResult.isValid) {
    return filename; // Already valid
  }

  const { tokens, errors } = validationResult;
  
  // If structure is invalid, we can't auto-fix
  if (errors.some(e => e.code === ERROR_CODES.INVALID_STRUCTURE)) {
    return null;
  }

  let { prefix, description, root, type, date, tag, ext } = tokens;

  // Apply fixes for each error type
  for (const error of errors) {
    switch (error.code) {
      case ERROR_CODES.MISSING_PREFIX:
      case ERROR_CODES.INVALID_PREFIX_FOR_TYPE:
        // Add/fix week prefix for LP/Annot
        const suggestedWeek = dateToWeekNumber(date) || 21;
        prefix = formatWeekAsPrefix(suggestedWeek);
        break;

      case ERROR_CODES.ROUTING_VIOLATION:
        // Fix root folder
        root = TYPE_TO_FORCED_ROOT[type];
        break;

      case ERROR_CODES.INVALID_EXTENSION:
        // Fix extension
        const allowedExts = TYPE_TO_ALLOWED_EXT[type];
        if (allowedExts && allowedExts.length > 0) {
          ext = allowedExts[0];
        }
        break;

      // These can't be auto-fixed:
      // - INVALID_DATE (need human input)
      // - RESERVED_NAME (need human input)
      // - INVALID_WEEK_NUMBER (need context)
    }
  }

  // Rebuild filename
  const tagPart = tag ? `_${tag}` : '';
  return `${prefix || ''}${description}_${root}_${type}_${date}${tagPart}.${ext}`;
}

// =============================================================================
// BATCH VALIDATION
// =============================================================================

/**
 * Validate multiple filenames and return summary
 * @param {string[]} filenames - Array of filenames to validate
 * @returns {Object} - Summary with valid count, invalid count, and detailed results
 */
function validateBatch(filenames) {
  const results = filenames.map(filename => ({
    filename,
    ...validateFilename(filename),
    suggestedFix: null
  }));

  // Add suggested fixes for invalid files
  results.forEach(r => {
    if (!r.isValid) {
      r.suggestedFix = suggestCorrectFilename(r.filename, r);
    }
  });

  return {
    total: filenames.length,
    validCount: results.filter(r => r.isValid).length,
    invalidCount: results.filter(r => !r.isValid).length,
    results
  };
}

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  validateFilename,
  suggestCorrectFilename,
  validateBatch,
  dateToWeekNumber,
  isValidDate
};

// =============================================================================
// CLI USAGE (if run directly)
// =============================================================================

if (require.main === module) {
  const testFiles = [
    // Valid examples
    '21-M4TBL9-11_Math_LP_2026-01-20.docx',
    '21-M4TBL9_Math_Annot_2026-01-20.pdf',
    '00-M4Overview_Math_Guide_2025-08-01.pdf',
    'M4Overview_Math_Guide_2025-08-01.pdf',
    'BullyingCert_Admin_Rec_2025-12-01.pdf',
    'ZearnExport_Data_Sheet_2026-01-15.xlsx',
    '21-M4TBL9_Math_LP_2026-01-20_final.docx',
    
    // Invalid examples
    'M4TBL9_Math_LP_2026-01-20.docx',           // Missing prefix for LP
    '00-M4TBL9_Math_LP_2026-01-20.docx',        // 00- not valid for LP
    'M4TBL9_Math_Annot_2026-01-20.pdf',         // Missing prefix for Annot
    '21-M4TBL9_Math_LP_2026-01-20.pdf',         // Wrong extension for LP
    'ZearnExport_Math_Sheet_2026-01-15.xlsx',   // Sheet must use Data
    'WeeklyNewsletter_Admin_News_2026-01-20.docx', // News must use Comm
    '21-M4TBL9_Math_LP_2026-02-30.docx',        // Invalid date
    '40-M4TBL9_Math_LP_2026-01-20.docx'         // Invalid week number
  ];

  console.log('FLAIM Validator Test Results');
  console.log('============================\n');

  for (const filename of testFiles) {
    const result = validateFilename(filename);
    const status = result.isValid ? '✅ VALID' : '❌ INVALID';
    console.log(`${status}: ${filename}`);
    
    if (!result.isValid) {
      for (const error of result.errors) {
        console.log(`   └─ [${error.code}] ${error.message}`);
        console.log(`      Fix: ${error.suggestedFix}`);
      }
      
      const suggested = suggestCorrectFilename(filename, result);
      if (suggested && suggested !== filename) {
        console.log(`   └─ Suggested: ${suggested}`);
      }
    }
    console.log('');
  }
}
