/**
 * FLAIM File Naming Convention - Rules Map
 * Version: 1.1
 * Last Updated: 2026-01-21
 * 
 * This is the single source of truth for validation rules.
 * Edit this file to update allowed values.
 */

// =============================================================================
// VALID CODES
// =============================================================================

const ALLOWED_ROOTS = [
  'Math',   // 33_Math
  'Sci',    // 34_Sciences
  'SS',     // 35_SocialStudies
  'Fren',   // 36_French
  'Admin',  // 30_Administrative
  'Data',   // 31_Data
  'Comm',   // 32_Communication
  'Proj',   // 02_Projects
  'Tmplt'   // 01_Templates
];

const ALLOWED_TYPES = [
  'LP',      // Lesson Plan
  'Annot',   // Annotated
  'Guide',   // Guide
  'Pres',    // Presentation
  'Wksht',   // Worksheet
  'Assmnt',  // Assessment
  'Doc',     // Document
  'Form',    // Form
  'News',    // Newsletter
  'Corr',    // Correspondence
  'Rec',     // Record
  'Code',    // Code
  'Media',   // Media (images, video, audio)
  'Sheet'    // Spreadsheet
];

const ALLOWED_TAGS = [
  'rev01',
  'rev02',
  'v01',
  'v02',
  'draft',
  'final'
];

// =============================================================================
// PREFIX RULES
// =============================================================================

/**
 * Types that REQUIRE a week prefix (01-37)
 * These types cannot have:
 *   - No prefix
 *   - 00- prefix (planning)
 */
const TYPES_REQUIRING_WEEK_PREFIX = ['LP', 'Annot'];

/**
 * Valid week number range
 */
const MIN_WEEK = 1;
const MAX_WEEK = 37;

// =============================================================================
// ROUTING CONSTRAINTS
// =============================================================================

/**
 * Types that are locked to specific RootFolder codes
 * If a type is in this map, it MUST use the specified root
 */
const TYPE_TO_FORCED_ROOT = {
  'Sheet': 'Data',
  'News': 'Comm',
  'Corr': 'Comm',
  'Rec': 'Admin'
};

// =============================================================================
// TYPE TO EXTENSION CONSTRAINTS
// =============================================================================

/**
 * Allowed extensions for each type
 * All extensions must be lowercase
 */
const TYPE_TO_ALLOWED_EXT = {
  'LP': ['docx', 'gdoc'],
  'Annot': ['pdf'],
  'Guide': ['pdf', 'docx', 'gdoc', 'md'],
  'Pres': ['pptx', 'ppt', 'gslides', 'key'],
  'Wksht': ['pdf', 'docx', 'gdoc'],
  'Assmnt': ['pdf', 'docx', 'gdoc', 'gform'],
  'Doc': ['pdf', 'docx', 'gdoc', 'txt', 'md'],
  'Form': ['pdf', 'docx', 'gdoc', 'gform'],
  'News': ['pdf', 'docx', 'gdoc', 'pub'],
  'Corr': ['pdf', 'docx', 'gdoc', 'pub'],
  'Rec': ['pdf', 'jpg', 'jpeg', 'png'],
  'Code': ['js', 'py', 'gs', 'html', 'css', 'json', 'sh'],
  'Media': [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'tif', 'tiff', 'heic', 'svg',
    // Video
    'mp4', 'mov', 'm4v', 'avi', 'wmv',
    // Audio
    'mp3', 'wav', 'm4a', 'aac', 'flac', 'aif', 'aiff'
  ],
  'Sheet': ['xlsx', 'xls', 'gsheet', 'csv', 'tsv']
};

// =============================================================================
// STRUCTURAL REGEX
// =============================================================================

/**
 * Main validation regex with capture groups
 * Groups: prefix, description, root, type, date, tag, ext
 */
const FILENAME_REGEX = /^(?:(00-|\d{2}-))?([A-Za-z0-9-]+)_(Math|Sci|SS|Fren|Admin|Data|Comm|Proj|Tmplt)_(LP|Annot|Guide|Pres|Wksht|Assmnt|Doc|Form|News|Corr|Rec|Code|Media|Sheet)_(\d{4}-\d{2}-\d{2})(?:_(rev01|rev02|v01|v02|draft|final))?\.([a-z0-9]+)$/;

// =============================================================================
// WINDOWS RESERVED NAMES
// =============================================================================

const WINDOWS_RESERVED = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

// =============================================================================
// WEEK CALENDAR (2025-2026 School Year)
// =============================================================================

/**
 * Week start dates (Mondays) for the school year
 * Index corresponds to week number (0 = PD week, 1-37 = instructional weeks)
 */
const WEEK_START_DATES = [
  '2025-08-04',  // Week 00 - PD
  '2025-08-11',  // Week 01
  '2025-08-18',  // Week 02
  '2025-08-25',  // Week 03
  '2025-09-01',  // Week 04
  '2025-09-08',  // Week 05
  '2025-09-15',  // Week 06
  '2025-09-22',  // Week 07
  '2025-09-29',  // Week 08
  '2025-10-06',  // Week 09
  '2025-10-13',  // Week 10
  '2025-10-20',  // Week 11
  '2025-10-27',  // Week 12
  '2025-11-03',  // Week 13
  '2025-11-10',  // Week 14
  '2025-11-17',  // Week 15
  // Thanksgiving break: 2025-11-24 to 2025-11-28
  '2025-12-01',  // Week 16
  '2025-12-08',  // Week 17
  '2025-12-15',  // Week 18
  // Winter break: 2025-12-20 to 2026-01-04
  '2026-01-05',  // Week 19
  '2026-01-12',  // Week 20
  '2026-01-19',  // Week 21
  '2026-01-26',  // Week 22
  '2026-02-02',  // Week 23
  '2026-02-09',  // Week 24
  '2026-02-16',  // Week 25
  '2026-02-23',  // Week 26
  '2026-03-02',  // Week 27
  '2026-03-09',  // Week 28
  '2026-03-16',  // Week 29
  '2026-03-23',  // Week 30
  '2026-03-30',  // Week 31
  // Spring break: 2026-04-03 to 2026-04-10
  '2026-04-13',  // Week 32
  '2026-04-20',  // Week 33
  '2026-04-27',  // Week 34
  '2026-05-04',  // Week 35
  '2026-05-11',  // Week 36
  '2026-05-18'   // Week 37
];

/**
 * Holiday break periods with next instructional week
 */
const HOLIDAY_BREAKS = [
  { start: '2025-11-24', end: '2025-11-28', nextWeek: 16 },  // Thanksgiving
  { start: '2025-12-20', end: '2026-01-04', nextWeek: 19 },  // Winter
  { start: '2026-04-03', end: '2026-04-10', nextWeek: 32 }   // Spring
];

// =============================================================================
// ERROR CODES
// =============================================================================

const ERROR_CODES = {
  INVALID_STRUCTURE: 'INVALID_STRUCTURE',
  MISSING_PREFIX: 'MISSING_PREFIX',
  INVALID_PREFIX_FOR_TYPE: 'INVALID_PREFIX_FOR_TYPE',
  INVALID_WEEK_NUMBER: 'INVALID_WEEK_NUMBER',
  INVALID_ROOT: 'INVALID_ROOT',
  INVALID_TYPE: 'INVALID_TYPE',
  ROUTING_VIOLATION: 'ROUTING_VIOLATION',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  INVALID_DATE: 'INVALID_DATE',
  RESERVED_NAME: 'RESERVED_NAME',
  INVALID_CHARACTERS: 'INVALID_CHARACTERS'
};

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
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
};
