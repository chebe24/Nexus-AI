/**
 * =====================================================
 * FLAIM DRIVE TRACKER - MIGRATION HELPER
 * =====================================================
 * 
 * PURPOSE: Identifies legacy files that don't follow naming conventions
 * and suggests compliant filenames based on folder location and content.
 * 
 * HOW TO USE:
 * 1. Copy this entire code into your existing Apps Script
 * 2. Save the script (Ctrl+S / Cmd+S)
 * 3. Refresh your spreadsheet
 * 4. Use menu: FLAIM Drive Tracker → Migration Helper → Scan for Legacy Files
 * 
 * The script will:
 * - Find all files with "_NO_RULE_FOUND" in Expected Name column
 * - Analyze each file's folder location and filename
 * - Suggest a compliant filename
 * - Populate the Migration Helper sheet for your review
 */

// =====================================================
// CONFIGURATION - Add these to your existing CONFIG object
// =====================================================

const MIGRATION_CONFIG = {
  SHEET_NAME: 'Migration Helper',
  
  // Maps folder names to subject codes
  FOLDER_TO_SUBJECT: {
    '00_Inbox': null,        // Could be anything
    '01_Templates': 'Temp',
    '02_Projects': 'Proj',
    '30_Administration': 'Admin',
    '31_Data': 'Data',
    '32_Newsletters': 'News',
    '33_Maths': 'Math',
    '34_Sciences': 'Sci',
    '35_SocialStudies': 'SS',
    '36_French': 'Fren',
    '99_Archive': 'Arch'
  },
  
  // Maps subfolder keywords to French categories
  FRENCH_FOLDER_TO_CATEGORY: {
    'grammaire': 'Grammaire',
    'martinique': 'Martiniq',
    'phonet': 'Phonet',
    'saint patrick': 'StPat',
    'st pat': 'StPat',
    'patrick': 'StPat',
    'saint valentin': 'StVal',
    'st val': 'StVal',
    'valentin': 'StVal',
    'thanksgiving': 'Thnksgvng',
    'action de grâce': 'Thnksgvng',
    'halloween': 'Hallown',
    'temps': 'Temps',
    'lecture': 'Lectr',
    'animaux': 'Animx1',
    'comparatif': 'Compartf',
    'emotion': 'Emotion',
    'émotions': 'Emotion',
    'formes': 'Formes',
    'fruits': 'Fruits',
    'mots cachés': 'MotsCaches',
    'mots caches': 'MotsCaches',
    'objets': 'Objets',
    'corps': 'Corps',
    'parties du corps': 'Corps',
    'nombres': 'Nmbrs0-10',
    'saisons': 'Saisons',
    'questions': 'Quest',
    'noel': 'Noel1',
    'noël': 'Noel1',
    'paques': 'Paques',
    'pâques': 'Paques',
    'maison': 'Maison',
    'pièces': 'Maison',
    'poemes': 'Poemes',
    'poèmes': 'Poemes',
    'prepositions': 'Prep',
    'verbes': 'Verbes',
    'être': 'Verbes',
    'avoir': 'Verbes',
    'mardi gras': 'MGras',
    'luxembourg': 'Lux',
    'belgique': 'Belg',
    'tahiti': 'Tahiti',
    'quebec': 'Quebec',
    'québec': 'Quebec',
    'guadeloupe': 'Guad',
    'jours': 'Jours',
    'mois': 'Mois',
    'heure': 'Heure',
    'couleurs': 'Formes'  // Colors often grouped with shapes
  },
  
  // Maps subfolder keywords to Admin categories
  ADMIN_FOLDER_TO_CATEGORY: {
    'professional': 'PD',
    'pd': 'PD',
    'field': 'Field',
    'trip': 'Field',
    'open house': 'Open',
    'communication': 'Comm',
    'pbis': 'PBIS',
    'schedule': 'Sche',
    'safe schools': 'SSch',
    'safeschools': 'SSch',
    'sub': 'Sub',
    'substitute': 'Sub',
    'special': 'Special'
  },
  
  // Maps filename keywords to file types
  KEYWORD_TO_FILETYPE: {
    'lesson': 'LP',
    'plan': 'LP',
    'presentation': 'Pres',
    'ppt': 'Pres',
    'slide': 'Pres',
    'sheet': 'Sheet',
    'spreadsheet': 'Sheet',
    'data': 'Sheet',
    'document': 'Doc',
    'doc': 'Doc',
    'image': 'Img',
    'photo': 'Img',
    'picture': 'Img',
    'video': 'Vid',
    'audio': 'Aud',
    'worksheet': 'Wksht',
    'activity': 'Act',
    'test': 'Test',
    'quiz': 'Quiz',
    'homework': 'Hmwk',
    'devoir': 'Hmwk',
    'guide': 'Guide',
    'handbook': 'Guide',
    'form': 'Form',
    'certificate': 'Cert',
    'cert': 'Cert',
    'communication': 'Comm',
    'template': 'Temp'
  },
  
  // Extension mapping
  EXTENSION_MAP: {
    'docx': '.docx',
    'doc': '.doc',
    'pdf': '.pdf',
    'pptx': '.pptx',
    'ppt': '.ppt',
    'xlsx': '.xlsx',
    'xls': '.xls',
    'jpg': '.jpg',
    'jpeg': '.jpeg',
    'png': '.png',
    'gif': '.gif',
    'mp4': '.mp4',
    'mov': '.mov',
    'mp3': '.mp3',
    'wav': '.wav',
    'zip': '.zip',
    'csv': '.csv',
    'txt': '.txt',
    'gdoc': '.gdoc',
    'gslides': '.gslides',
    'gsheet': '.gsheet'
  }
};


// =====================================================
// MENU SETUP - Add to your onOpen function
// =====================================================

/**
 * Adds Migration Helper menu items
 * PASTE THIS INTO YOUR EXISTING onOpen() FUNCTION
 */
function addMigrationMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 FLAIM Drive Tracker')
    // ... your existing menu items ...
    .addSeparator()
    .addSubMenu(ui.createMenu('🔄 Migration Helper')
      .addItem('📋 Scan for Legacy Files', 'scanForLegacyFiles')
      .addItem('✨ Generate Suggestions', 'generateMigrationSuggestions')
      .addItem('✅ Apply Selected Renames', 'applySelectedRenames')
      .addItem('🗑️ Clear Migration Sheet', 'clearMigrationSheet'))
    .addToUi();
}


// =====================================================
// CORE MIGRATION FUNCTIONS
// =====================================================

/**
 * Scans File Registry for files needing migration
 * Populates Migration Helper sheet with results
 */
function scanForLegacyFiles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const registrySheet = ss.getSheetByName('File Registry');
  const migrationSheet = ss.getSheetByName(MIGRATION_CONFIG.SHEET_NAME);
  
  if (!registrySheet || !migrationSheet) {
    SpreadsheetApp.getUi().alert('Error: Required sheets not found. Make sure "File Registry" and "Migration Helper" exist.');
    return;
  }
  
  ss.toast('Scanning for legacy files...', '🔍 Scanning', 5);
  
  // Get all data from File Registry
  const data = registrySheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find column indexes
  const colIndex = {
    fileId: headers.indexOf('File ID'),
    rootFolder: headers.indexOf('Root Folder'),
    subfolder: headers.indexOf('Subfolder Path'),
    filename: headers.indexOf('Filename'),
    expectedName: headers.indexOf('Expected Name')
  };
  
  // Clear existing data (keep headers)
  if (migrationSheet.getLastRow() > 1) {
    migrationSheet.getRange(2, 1, migrationSheet.getLastRow() - 1, 14).clear();
  }
  
  // Find files with _NO_RULE_FOUND
  const legacyFiles = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const expectedName = row[colIndex.expectedName] || '';
    
    if (expectedName.includes('_NO_RULE_FOUND') || expectedName.includes('ERROR')) {
      legacyFiles.push({
        rowNum: i + 1,
        fileId: row[colIndex.fileId] || '',
        rootFolder: row[colIndex.rootFolder] || '',
        subfolder: row[colIndex.subfolder] || '',
        filename: row[colIndex.filename] || ''
      });
    }
  }
  
  if (legacyFiles.length === 0) {
    ss.toast('No legacy files found! All files follow naming conventions.', '✅ Complete', 5);
    return;
  }
  
  // Analyze each file and generate suggestions
  const migrationData = legacyFiles.map(file => {
    const analysis = analyzeFilename(file.filename, file.rootFolder, file.subfolder);
    const suggestion = buildSuggestedName(analysis);
    
    return [
      file.rowNum,                    // A: Row #
      file.filename,                  // B: Current Filename
      file.rootFolder,                // C: Root Folder
      file.subfolder,                 // D: Subfolder
      file.fileId,                    // E: File ID
      analysis.subject || '???',      // F: Detected Subject
      analysis.category || '',        // G: Detected Category
      analysis.date || getTodayDate(),// H: Detected Date (default today)
      analysis.fileType || 'Doc',     // I: Detected Type (default Doc)
      analysis.description || '',     // J: Detected Description
      analysis.extension || '',       // K: Detected Extension
      suggestion,                     // L: Suggested Name
      'Pending',                      // M: Migration Status
      analysis.notes || ''            // N: Notes
    ];
  });
  
  // Write to Migration Helper sheet
  if (migrationData.length > 0) {
    migrationSheet.getRange(2, 1, migrationData.length, 14).setValues(migrationData);
  }
  
  // Format the sheet
  formatMigrationSheet(migrationSheet, migrationData.length);
  
  ss.toast(`Found ${legacyFiles.length} files needing migration. Review the Migration Helper sheet.`, '📋 Scan Complete', 5);
}


/**
 * Analyzes a filename and returns detected components
 */
function analyzeFilename(filename, rootFolder, subfolder) {
  const analysis = {
    subject: null,
    category: null,
    date: null,
    fileType: null,
    description: null,
    extension: null,
    notes: ''
  };
  
  // 1. Detect extension
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    analysis.extension = MIGRATION_CONFIG.EXTENSION_MAP[ext] || '.' + ext;
    // Remove extension from working filename
    filename = filename.substring(0, filename.length - extMatch[0].length);
  }
  
  // 2. Detect subject from root folder
  analysis.subject = MIGRATION_CONFIG.FOLDER_TO_SUBJECT[rootFolder] || null;
  
  // 3. Detect category from subfolder (for French, Admin, etc.)
  if (analysis.subject === 'Fren') {
    analysis.category = detectFrenchCategory(subfolder, filename);
  } else if (analysis.subject === 'Admin') {
    analysis.category = detectAdminCategory(subfolder, filename);
  } else if (analysis.subject === 'Math') {
    analysis.category = detectMathModule(subfolder, filename);
  } else if (analysis.subject === 'Sci' || analysis.subject === 'SS') {
    analysis.category = detectUnit(subfolder, filename);
  }
  
  // 4. Detect date (look for date patterns in filename)
  const dateMatch = filename.match(/(\d{4}[-_]?\d{2}[-_]?\d{2})/);
  if (dateMatch) {
    analysis.date = formatDateString(dateMatch[1]);
  }
  
  // 5. Detect file type from keywords
  analysis.fileType = detectFileType(filename);
  
  // 6. Build description from remaining text
  analysis.description = buildDescription(filename, analysis);
  
  // 7. Add notes if something couldn't be detected
  const missing = [];
  if (!analysis.subject) missing.push('subject');
  if (!analysis.category && ['Fren', 'Admin', 'Proj'].includes(analysis.subject)) missing.push('category');
  if (!analysis.date) missing.push('date');
  
  if (missing.length > 0) {
    analysis.notes = 'Please verify: ' + missing.join(', ');
  }
  
  return analysis;
}


/**
 * Detects French category from subfolder name
 */
function detectFrenchCategory(subfolder, filename) {
  const searchText = (subfolder + ' ' + filename).toLowerCase();
  
  for (const [keyword, category] of Object.entries(MIGRATION_CONFIG.FRENCH_FOLDER_TO_CATEGORY)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return category;
    }
  }
  
  return null;
}


/**
 * Detects Admin category from subfolder name
 */
function detectAdminCategory(subfolder, filename) {
  const searchText = (subfolder + ' ' + filename).toLowerCase();
  
  for (const [keyword, category] of Object.entries(MIGRATION_CONFIG.ADMIN_FOLDER_TO_CATEGORY)) {
    if (searchText.includes(keyword.toLowerCase())) {
      return category;
    }
  }
  
  return null;
}


/**
 * Detects Math module from subfolder (Math_M1, Math_M2, etc.)
 */
function detectMathModule(subfolder, filename) {
  const searchText = subfolder + ' ' + filename;
  const match = searchText.match(/M(\d+)/i);
  
  if (match) {
    const num = parseInt(match[1]);
    return 'M' + String(num).padStart(2, '0');  // M1 → M01
  }
  
  return null;
}


/**
 * Detects Science/SS unit from subfolder
 */
function detectUnit(subfolder, filename) {
  const searchText = subfolder + ' ' + filename;
  const match = searchText.match(/U(\d+)/i);
  
  if (match) {
    const num = parseInt(match[1]);
    return 'U' + num;  // Keep as U1, U2, etc.
  }
  
  return null;
}


/**
 * Detects file type from keywords in filename
 */
function detectFileType(filename) {
  const lowerFilename = filename.toLowerCase();
  
  for (const [keyword, fileType] of Object.entries(MIGRATION_CONFIG.KEYWORD_TO_FILETYPE)) {
    if (lowerFilename.includes(keyword)) {
      return fileType;
    }
  }
  
  return 'Doc';  // Default to Doc
}


/**
 * Builds a clean description from the filename
 */
function buildDescription(filename, analysis) {
  let desc = filename;
  
  // Remove common prefixes/patterns
  desc = desc.replace(/^\d{4}[-_]?\d{2}[-_]?\d{2}[-_]?/, '');  // Remove dates
  desc = desc.replace(/^(le|la|les|un|une|des)\s+/i, '');      // Remove French articles
  desc = desc.replace(/\s+/g, '');                              // Remove spaces (will be single word)
  desc = desc.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç]/g, '');      // Keep only alphanumeric + French chars
  
  // Capitalize first letter
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  
  // Truncate if too long (max 30 chars)
  if (desc.length > 30) {
    desc = desc.substring(0, 30);
  }
  
  return desc || 'Untitled';
}


/**
 * Builds the suggested compliant filename
 */
function buildSuggestedName(analysis) {
  const parts = [];
  
  // Subject (required)
  parts.push(analysis.subject || '???');
  
  // Category/Module/Unit (if applicable)
  if (analysis.category) {
    parts.push(analysis.category);
  }
  
  // Date (for most types except Temp)
  if (analysis.subject !== 'Temp' && analysis.date) {
    parts.push(analysis.date);
  }
  
  // File type
  parts.push(analysis.fileType || 'Doc');
  
  // Description
  parts.push(analysis.description || 'Untitled');
  
  // Join with underscores and add extension
  return parts.join('_') + (analysis.extension || '.docx');
}


/**
 * Formats date string to yyyy-mm-dd
 */
function formatDateString(dateStr) {
  // Remove any separators
  const clean = dateStr.replace(/[-_]/g, '');
  
  if (clean.length === 8) {
    return clean.substring(0, 4) + '-' + clean.substring(4, 6) + '-' + clean.substring(6, 8);
  }
  
  return getTodayDate();
}


/**
 * Gets today's date in yyyy-mm-dd format
 */
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


/**
 * Formats the Migration Helper sheet with colors and styles
 */
function formatMigrationSheet(sheet, rowCount) {
  if (rowCount === 0) return;
  
  // Header formatting
  sheet.getRange(1, 1, 1, 14)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Status column conditional formatting
  const statusRange = sheet.getRange(2, 13, rowCount, 1);  // Column M
  
  // Pending = yellow
  const pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#fff2cc')
    .setRanges([statusRange])
    .build();
  
  // Complete = green
  const completeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Complete')
    .setBackground('#d9ead3')
    .setRanges([statusRange])
    .build();
  
  // Error = red
  const errorRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Error')
    .setBackground('#f4cccc')
    .setRanges([statusRange])
    .build();
  
  const rules = sheet.getConditionalFormatRules();
  rules.push(pendingRule, completeRule, errorRule);
  sheet.setConditionalFormatRules(rules);
  
  // Suggested Name column - light blue background
  sheet.getRange(2, 12, rowCount, 1)
    .setBackground('#e6f3ff');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 14);
  
  // Add data validation for Status column
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Approved', 'Skip', 'Complete', 'Error'], true)
    .setAllowInvalid(false)
    .build();
  
  sheet.getRange(2, 13, rowCount, 1).setDataValidation(statusValidation);
}


/**
 * Regenerates suggestions for all files in Migration Helper
 * Use after manually editing detected values
 */
function generateMigrationSuggestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const migrationSheet = ss.getSheetByName(MIGRATION_CONFIG.SHEET_NAME);
  
  if (!migrationSheet || migrationSheet.getLastRow() < 2) {
    ss.toast('No files to process. Run "Scan for Legacy Files" first.', '⚠️ No Data', 3);
    return;
  }
  
  const data = migrationSheet.getDataRange().getValues();
  let updated = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Build analysis from current values
    const analysis = {
      subject: row[5],      // F: Detected Subject
      category: row[6],     // G: Detected Category
      date: row[7],         // H: Detected Date
      fileType: row[8],     // I: Detected Type
      description: row[9],  // J: Detected Description
      extension: row[10]    // K: Detected Extension
    };
    
    // Generate new suggestion
    const suggestion = buildSuggestedName(analysis);
    
    // Update cell L (column 12)
    migrationSheet.getRange(i + 1, 12).setValue(suggestion);
    updated++;
  }
  
  ss.toast(`Updated ${updated} suggestions.`, '✨ Suggestions Updated', 3);
}


/**
 * Applies renames to files marked as "Approved" in Migration Helper
 */
function applySelectedRenames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const migrationSheet = ss.getSheetByName(MIGRATION_CONFIG.SHEET_NAME);
  
  if (!migrationSheet || migrationSheet.getLastRow() < 2) {
    ss.toast('No files to process.', '⚠️ No Data', 3);
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Confirm Rename',
    'This will rename all files marked as "Approved" in Google Drive.\n\nThis action cannot be easily undone.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  const data = migrationSheet.getDataRange().getValues();
  let renamed = 0;
  let errors = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[12];  // M: Migration Status
    
    if (status !== 'Approved') {
      continue;
    }
    
    const fileId = row[4];     // E: File ID
    const newName = row[11];   // L: Suggested Name
    
    try {
      const file = DriveApp.getFileById(fileId);
      file.setName(newName);
      
      // Update status to Complete
      migrationSheet.getRange(i + 1, 13).setValue('Complete');
      renamed++;
      
    } catch (error) {
      Logger.log(`Error renaming file ${fileId}: ${error.message}`);
      migrationSheet.getRange(i + 1, 13).setValue('Error: ' + error.message);
      errors++;
    }
  }
  
  ss.toast(`Renamed ${renamed} files. ${errors} errors.`, '✅ Rename Complete', 5);
  
  // Prompt to rescan File Registry
  if (renamed > 0) {
    const rescan = ui.alert(
      'Rescan File Registry?',
      `Successfully renamed ${renamed} files.\n\nWould you like to rescan the File Registry to update the records?`,
      ui.ButtonSet.YES_NO
    );
    
    if (rescan === ui.Button.YES) {
      scanAllFolders();  // Call existing scan function
    }
  }
}


/**
 * Clears the Migration Helper sheet
 */
function clearMigrationSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const migrationSheet = ss.getSheetByName(MIGRATION_CONFIG.SHEET_NAME);
  
  if (!migrationSheet) {
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Migration Helper?',
    'This will remove all migration data. Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    if (migrationSheet.getLastRow() > 1) {
      migrationSheet.getRange(2, 1, migrationSheet.getLastRow() - 1, 14).clear();
    }
    ss.toast('Migration Helper cleared.', '🗑️ Cleared', 3);
  }
}


// =====================================================
// UPDATED onOpen FUNCTION - REPLACE YOUR EXISTING ONE
// =====================================================

/**
 * Menu setup - includes Migration Helper submenu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 FLAIM Drive Tracker')
    .addItem('🔄 Scan All Folders', 'scanAllFolders')
    .addItem('📥 Scan Inbox Only', 'scanInboxFolder')
    .addSeparator()
    .addItem('🗂️ Generate Folder Structure Map', 'generateFolderStructureMap')
    .addSeparator()
    .addItem('✅ Validate All Filenames', 'validateAllFilenames')
    .addItem('📋 Generate Validation Report', 'generateValidationReport')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔄 Migration Helper')
      .addItem('📋 Scan for Legacy Files', 'scanForLegacyFiles')
      .addItem('✨ Regenerate Suggestions', 'generateMigrationSuggestions')
      .addItem('✅ Apply Approved Renames', 'applySelectedRenames')
      .addItem('🗑️ Clear Migration Sheet', 'clearMigrationSheet'))
    .addSeparator()
    .addItem('🔓 Open Selected File', 'openSelectedFileSecurely')
    .addSeparator()
    .addItem('📦 Prepare Archive', 'prepareArchive')
    .addItem('🗑️ Prepare Deletion', 'prepareDeletion')
    .addToUi();
}
