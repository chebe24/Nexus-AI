/**
 * =============================================================================
 * AI-AGENTS DATABASE UPDATE SCRIPT (PROJECT SENTINEL HARDENED)
 * =============================================================================
 * Project: Nexus AI - Trilingual 1st Grade French Immersion Workspace
 * Owner: Cary Hebert (chebert4@ebrschools.org)
 * Security Level: PRODUCTION | Zero-Trust Architecture
 * 
 * SECURITY COMPLIANCE:
 * ✅ Zero-Code Storage: All IDs retrieved from PropertiesService
 * ✅ Identity Guardrail: Email verification wrapper on all functions
 * ✅ Audit Logging: Security events logged to audit sheet
 * 
 * REQUIRED SCRIPT PROPERTIES (Apps Script → Project Settings):
 * - INVENTORY_SHEET_ID: Google Sheets ID for AI agents inventory
 * - DRIVE_FOLDER_ID: Google Drive folder ID containing AI agents
 * - AUTHORIZED_EMAIL: chebert4@ebrschools.org
 * - DEPRECATED_DAYS: 90 (days until auto-deprecation)
 * =============================================================================
 */

// =============================================================================
// SECURITY LAYER - PROJECT SENTINEL
// =============================================================================

/**
 * Identity verification wrapper - CRITICAL SECURITY FUNCTION
 * Prevents unauthorized execution of database operations
 * 
 * @throws {Error} If user email does not match authorized account
 */
function checkAuthorization() {
  const currentUser = Session.getActiveUser().getEmail();
  const authorizedEmail = PropertiesService.getScriptProperties()
    .getProperty('AUTHORIZED_EMAIL') || 'chebert4@ebrschools.org';
  
  if (currentUser !== authorizedEmail) {
    const errorMsg = `🚨 SECURITY VIOLATION: Unauthorized access attempt by ${currentUser}. Expected: ${authorizedEmail}`;
    
    // Log to security audit sheet
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      attemptedBy: currentUser,
      expectedUser: authorizedEmail,
      timestamp: new Date().toISOString(),
      function: 'checkAuthorization'
    });
    
    throw new Error(errorMsg);
  }
  
  // Log successful authorization
  logSecurityEvent('AUTHORIZED_ACCESS', {
    user: currentUser,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log security events to audit trail
 * Creates 'Security_Audit' sheet if it doesn't exist
 */
function logSecurityEvent(eventType, details) {
  try {
    const sheetId = getScriptProperty('INVENTORY_SHEET_ID');
    const ss = SpreadsheetApp.openById(sheetId);
    let auditSheet = ss.getSheetByName('Security_Audit');
    
    // Create audit sheet if missing
    if (!auditSheet) {
      auditSheet = ss.insertSheet('Security_Audit');
      auditSheet.appendRow(['Timestamp', 'Event Type', 'User', 'Details']);
      auditSheet.getRange('A1:D1').setFontWeight('bold').setBackground('#FF0000').setFontColor('#FFFFFF');
    }
    
    auditSheet.appendRow([
      new Date(),
      eventType,
      Session.getActiveUser().getEmail(),
      JSON.stringify(details)
    ]);
  } catch (e) {
    // Fallback: log to Apps Script console if audit sheet fails
    Logger.log(`SECURITY EVENT: ${eventType} - ${JSON.stringify(details)}`);
  }
}

/**
 * Secure retrieval of Script Properties
 * Throws error if property is missing (fail-safe)
 * 
 * @param {string} key - Property key name
 * @returns {string} Property value
 * @throws {Error} If property is not configured
 */
function getScriptProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  
  if (!value || value.trim() === '') {
    throw new Error(
      `🚨 CONFIGURATION ERROR: Script Property '${key}' is not set.\n\n` +
      `Required setup:\n` +
      `1. Apps Script Editor → Project Settings (⚙️)\n` +
      `2. Scroll to "Script Properties"\n` +
      `3. Add property: ${key}\n\n` +
      `See documentation for required properties.`
    );
  }
  
  return value.trim();
}

// =============================================================================
// CONFIGURATION - ZERO-TRUST VAULT
// =============================================================================

/**
 * Configuration object using PropertiesService (no hardcoded credentials)
 * All IDs retrieved dynamically from Script Properties
 */
const DB_CONFIG = {
  // Secure getters - retrieve from vault
  get inventorySheetId() {
    return getScriptProperty('INVENTORY_SHEET_ID');
  },
  
  get driveFolderId() {
    return getScriptProperty('DRIVE_FOLDER_ID');
  },
  
  get authorizedEmail() {
    return getScriptProperty('AUTHORIZED_EMAIL');
  },
  
  get deprecatedDays() {
    const days = PropertiesService.getScriptProperties().getProperty('DEPRECATED_DAYS');
    return days ? parseInt(days) : 90; // Default: 90 days
  }
};

// =============================================================================
// MAIN FUNCTIONS - WRAPPED WITH SECURITY
// =============================================================================

/**
 * Scan Drive folder and update inventory
 * 🔒 SECURITY: Wrapped with authorization check
 * 
 * Run manually or set as daily trigger
 * Usage: Apps Script Editor → Run → updateInventory
 */
function updateInventory() {
  // 🔒 SECURITY CHECKPOINT
  checkAuthorization();
  
  try {
    const folder = DriveApp.getFolderById(DB_CONFIG.driveFolderId);
    const sheet = SpreadsheetApp.openById(DB_CONFIG.inventorySheetId)
                                  .getSheetByName('Inventory');
    
    if (!sheet) {
      throw new Error('Inventory sheet not found. Run createInventorySheet() first.');
    }
    
    // Log operation start
    logSecurityEvent('INVENTORY_UPDATE_START', {
      function: 'updateInventory',
      folderId: DB_CONFIG.driveFolderId
    });
    
    // Get existing data
    const existingData = sheet.getDataRange().getValues();
    const headers = existingData[0];
    const idCol = headers.indexOf('ID');
    const existingIds = existingData.slice(1).map(row => row[idCol]);
    
    // Scan active folder
    const activeFolder = folder.getFoldersByName('active');
    if (activeFolder.hasNext()) {
      scanFolder(activeFolder.next(), 'Active', sheet, existingIds);
    } else {
      Logger.log('⚠️ Warning: "active" subfolder not found in Drive folder');
    }
    
    // Flag old items as deprecated
    const deprecatedCount = flagDeprecated(sheet);
    
    // Log successful completion
    logSecurityEvent('INVENTORY_UPDATE_COMPLETE', {
      function: 'updateInventory',
      deprecatedCount: deprecatedCount,
      timestamp: new Date().toISOString()
    });
    
    Logger.log(`✅ Inventory update complete. Deprecated items: ${deprecatedCount}`);
    
  } catch (error) {
    // Log error to security audit
    logSecurityEvent('INVENTORY_UPDATE_ERROR', {
      function: 'updateInventory',
      error: error.message,
      stack: error.stack
    });
    
    throw error; // Re-throw for Apps Script error handling
  }
}

/**
 * Scan a folder and add/update entries
 * Internal function - called by updateInventory()
 */
function scanFolder(folder, status, sheet, existingIds) {
  const subfolders = folder.getFolders();
  let scannedCount = 0;
  
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const name = subfolder.getName();
    const id = subfolder.getId();
    
    // Determine ecosystem based on contents
    const ecosystem = detectEcosystem(subfolder);
    
    if (existingIds.includes(id)) {
      // Update existing row
      updateRow(sheet, id, {
        'Last Updated': new Date(),
        'Status': status
      });
      Logger.log(`Updated: ${name}`);
    } else {
      // Add new row
      sheet.appendRow([
        id,
        name,
        ecosystem,
        status,
        '',  // Git link - manual entry
        subfolder.getUrl(),
        'None',  // PII level - manual review required
        new Date()
      ]);
      Logger.log(`Added: ${name}`);
    }
    
    scannedCount++;
  }
  
  Logger.log(`Scanned ${scannedCount} agents in ${folder.getName()}`);
}

/**
 * Detect ecosystem based on file types in folder
 * Returns: 'Hybrid', 'iOS', 'Apps Script', or 'Unknown'
 */
function detectEcosystem(folder) {
  const files = folder.getFiles();
  let hasShortcut = false;
  let hasGS = false;
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName().toLowerCase();
    
    if (name.endsWith('.shortcut')) hasShortcut = true;
    if (name.endsWith('.gs') || name.endsWith('.js')) hasGS = true;
  }
  
  if (hasShortcut && hasGS) return 'Hybrid';
  if (hasShortcut) return 'iOS';
  if (hasGS) return 'Apps Script';
  return 'Unknown';
}

/**
 * Flag items not updated in X days as deprecated
 * Returns count of items flagged
 */
function flagDeprecated(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusCol = headers.indexOf('Status');
  const updatedCol = headers.indexOf('Last Updated');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DB_CONFIG.deprecatedDays);
  
  let flaggedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const lastUpdated = new Date(data[i][updatedCol]);
    const status = data[i][statusCol];
    
    if (status === 'Active' && lastUpdated < cutoffDate) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Deprecated');
      Logger.log(`Flagged as deprecated: ${data[i][1]}`);
      flaggedCount++;
    }
  }
  
  return flaggedCount;
}

/**
 * Update a specific row by ID
 * Updates only the specified columns
 */
function updateRow(sheet, id, updates) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('ID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(value);
        }
      }
      break;
    }
  }
}

// =============================================================================
// SETUP FUNCTIONS - WRAPPED WITH SECURITY
// =============================================================================

/**
 * Create the inventory sheet with headers
 * 🔒 SECURITY: Wrapped with authorization check
 * 
 * Run once during initial setup
 * Usage: Apps Script Editor → Run → createInventorySheet
 */
function createInventorySheet() {
  // 🔒 SECURITY CHECKPOINT
  checkAuthorization();
  
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.inventorySheetId);
    let sheet = ss.getSheetByName('Inventory');
    
    if (sheet) {
      Logger.log('⚠️ Inventory sheet already exists. No action taken.');
      return;
    }
    
    sheet = ss.insertSheet('Inventory');
    
    // Set headers
    const headers = [
      'ID',
      'Name',
      'Ecosystem',
      'Status',
      'Git',
      'Drive Path',
      'PII_Level',
      'Last Updated'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold')
         .setBackground('#4285F4')
         .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    // Log creation to audit
    logSecurityEvent('INVENTORY_SHEET_CREATED', {
      function: 'createInventorySheet',
      sheetId: DB_CONFIG.inventorySheetId
    });
    
    Logger.log('✅ Inventory sheet created successfully');
    
  } catch (error) {
    logSecurityEvent('SHEET_CREATION_ERROR', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Set up daily trigger for inventory updates
 * 🔒 SECURITY: Wrapped with authorization check
 * 
 * Creates time-based trigger for 6 AM daily execution
 * Usage: Apps Script Editor → Run → setupDailyTrigger
 */
function setupDailyTrigger() {
  // 🔒 SECURITY CHECKPOINT
  checkAuthorization();
  
  try {
    // Remove existing triggers for updateInventory
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'updateInventory') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('Removed existing trigger');
      }
    });
    
    // Create new daily trigger at 6 AM
    ScriptApp.newTrigger('updateInventory')
      .timeBased()
      .atHour(6)
      .everyDays(1)
      .create();
    
    // Log to audit
    logSecurityEvent('TRIGGER_CONFIGURED', {
      function: 'setupDailyTrigger',
      schedule: 'Daily at 6 AM',
      targetFunction: 'updateInventory'
    });
    
    Logger.log('✅ Daily trigger set for 6 AM');
    
  } catch (error) {
    logSecurityEvent('TRIGGER_SETUP_ERROR', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Validate Script Properties configuration
 * Use this to test if all required properties are set
 * 
 * Usage: Apps Script Editor → Run → validateConfiguration
 */
function validateConfiguration() {
  // 🔒 SECURITY CHECKPOINT
  checkAuthorization();
  
  try {
    Logger.log('='.repeat(60));
    Logger.log('CONFIGURATION VALIDATION');
    Logger.log('='.repeat(60));
    
    // Check each required property
    const requiredProps = [
      'INVENTORY_SHEET_ID',
      'DRIVE_FOLDER_ID',
      'AUTHORIZED_EMAIL',
      'DEPRECATED_DAYS'
    ];
    
    let allValid = true;
    
    requiredProps.forEach(prop => {
      try {
        let value;
        if (prop === 'DEPRECATED_DAYS') {
          value = DB_CONFIG.deprecatedDays;
        } else if (prop === 'INVENTORY_SHEET_ID') {
          value = DB_CONFIG.inventorySheetId;
        } else if (prop === 'DRIVE_FOLDER_ID') {
          value = DB_CONFIG.driveFolderId;
        } else if (prop === 'AUTHORIZED_EMAIL') {
          value = DB_CONFIG.authorizedEmail;
        }
        
        Logger.log(`✅ ${prop}: ${value.substring(0, 20)}...`);
      } catch (e) {
        Logger.log(`❌ ${prop}: NOT SET`);
        allValid = false;
      }
    });
    
    Logger.log('='.repeat(60));
    
    if (allValid) {
      Logger.log('✅ ALL PROPERTIES CONFIGURED CORRECTLY');
      
      // Test database access
      const ss = SpreadsheetApp.openById(DB_CONFIG.inventorySheetId);
      Logger.log(`✅ Can access inventory sheet: ${ss.getName()}`);
      
      const folder = DriveApp.getFolderById(DB_CONFIG.driveFolderId);
      Logger.log(`✅ Can access Drive folder: ${folder.getName()}`);
      
    } else {
      Logger.log('❌ CONFIGURATION INCOMPLETE');
      Logger.log('Go to: Project Settings → Script Properties → Add missing properties');
    }
    
    Logger.log('='.repeat(60));
    
  } catch (error) {
    Logger.log(`❌ VALIDATION ERROR: ${error.message}`);
    throw error;
  }
}

// =============================================================================
// END OF SECURITY-HARDENED SCRIPT
// =============================================================================
