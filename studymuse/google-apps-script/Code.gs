/**
 * StudyMuseAI Feedback → Google Sheets
 * 
 * 1. Create a Sheet named "StudyMuseAI Feedback"
 * 2. Row 1 headers: Timestamp | Name | Class | Domain | Email | Feedback | Mood | UserID
 * 3. Extensions → Apps Script → paste this entire file
 * 4. Deploy → New deployment → Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the Web App URL into /js/feedback.js SCRIPT_URL
 */

const SHEET_NAME = 'Sheet1'; // Change if your tab is named differently, e.g. 'Feedback'
const REQUIRED_HEADERS = ['Timestamp','Name','Class','Domain','Email','Feedback','Mood','UserID'];

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.tryLock(30000);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found');

    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(REQUIRED_HEADERS);
    }

    const data = e.parameter || {};
    
    // Simple honeypot spam check
    if (data.website) {
      return jsonOut({result:'success', spam:true});
    }

    const row = [
      new Date(),
      (data.name || '').trim(),
      (data.class || '').trim(),
      (data.domain || '').trim(),
      (data.email || '').trim(),
      (data.feedback || '').trim(),
      (data.mood || '').trim(),
      (data.userId || '').trim()
    ];

    // Basic validation
    if (!row[1] || !row[2] || !row[3] || !row[4]) {
      return jsonOut({result:'error', message:'Missing required fields: Name, Class, Domain, Email'});
    }

    sheet.appendRow(row);

    return jsonOut({result:'success', row: sheet.getLastRow()});
  } catch(err) {
    return jsonOut({result:'error', message: String(err)});
  }
}

// Allow GET for quick testing: https://script.google.com/.../exec?test=1
function doGet(e) {
  return jsonOut({result:'ok', message:'StudyMuseAI Feedback endpoint is live', time: new Date()});
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once manually to verify headers
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.clear();
  sheet.appendRow(REQUIRED_HEADERS);
  sheet.setFrozenRows(1);
}
