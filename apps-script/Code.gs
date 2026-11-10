/**
 * The Great Thanksgiving Factoring Feast — Google Sheets gradebook
 *
 * Receives each student's progress from the game and keeps ONE ROW PER STUDENT:
 *   Student Name | Q1 Attempts | Q1 Accuracy | Q2 Attempts | Q2 Accuracy | ... |
 *   Dishes Cooked | Total Attempts | Overall Accuracy | Last Updated
 *
 * Accuracy for a question = 1 correct answer / number of attempts
 *   (solved on 1st try = 100%, 2nd try = 50%, 4th try = 25%; not solved yet = 0%).
 * Overall Accuracy = dishes cooked / total attempts.
 *
 * SETUP (see README.md for screenshots-free step-by-step):
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Paste this whole file in, replacing what's there. Save.
 *   3. Deploy → New deployment → type "Web app"
 *        Execute as: Me      Who has access: Anyone
 *   4. Copy the Web app URL and paste it into FEAST_SHEET_URL in index.html.
 */

// Optional: if this script is NOT created from inside the sheet (Extensions → Apps Script),
// paste the spreadsheet ID here (the long code in the sheet's URL between /d/ and /edit).
const SPREADSHEET_ID = '';

// The tab inside the spreadsheet where results go (created automatically).
const TAB_NAME = 'Feast Results';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const name = String(data.name || '').trim().replace(/\s+/g, ' ');
    if (!name) return json_({ ok: false, error: 'missing name' });

    const questions = data.questions || [];
    const results = data.results || {};
    const sheet = getSheet_();
    ensureHeader_(sheet, questions);

    // Build the row
    let cooked = 0, totalAttempts = 0;
    const row = [name];
    questions.forEach(function (q) {
      const r = results[q.id] || { attempts: 0, solved: false };
      const attempts = Number(r.attempts) || 0;
      totalAttempts += attempts;
      if (r.solved) cooked++;
      row.push(attempts);
      row.push(attempts === 0 ? '' : (r.solved ? 1 / attempts : 0));
    });
    row.push(cooked);
    row.push(totalAttempts);
    row.push(totalAttempts === 0 ? '' : cooked / totalAttempts);
    row.push(new Date());

    // Find this student's existing row (case-insensitive match on column A)
    const lastRow = sheet.getLastRow();
    let rowIndex = -1;
    if (lastRow > 1) {
      const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const key = name.toLowerCase();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).trim().replace(/\s+/g, ' ').toLowerCase() === key) { rowIndex = i + 2; break; }
      }
    }
    if (rowIndex === -1) rowIndex = lastRow + 1;

    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    formatRow_(sheet, rowIndex, questions.length);
    return json_({ ok: true, row: rowIndex });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this — handy for checking the deployment works.
// It also checks that the script can actually open the spreadsheet.
function doGet() {
  try {
    const sheet = getSheet_();
    return ContentService.createTextOutput('🦃 The Factoring Feast gradebook is running! Results go to the "' +
      TAB_NAME + '" tab of the spreadsheet "' + sheet.getParent().getName() + '".');
  } catch (err) {
    return ContentService.createTextOutput('⚠️ The web app is running, but it cannot open the spreadsheet: ' + err.message);
  }
}

// TEST: in the Apps Script editor, choose "testWrite" from the function menu and click ▶ Run.
// A row for "Test Student" should appear in the Feast Results tab (delete it afterwards).
function testWrite() {
  const fake = {
    postData: { contents: JSON.stringify({
      name: 'Test Student',
      questions: [{ id: 'Q1', dish: 'Dinner Rolls' }],
      results: { Q1: { attempts: 2, solved: true } }
    }) }
  };
  Logger.log(doPost(fake).getContent());
}

function getSheet_() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet found. Either create this script from inside your sheet ' +
    '(Extensions → Apps Script) or paste the sheet ID into SPREADSHEET_ID at the top of Code.gs.');
  return ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
}

function ensureHeader_(sheet, questions) {
  const header = ['Student Name'];
  questions.forEach(function (q) {
    header.push(q.id + ' ' + q.dish + ' – Attempts');
    header.push(q.id + ' ' + q.dish + ' – Accuracy');
  });
  header.push('Dishes Cooked', 'Total Attempts', 'Overall Accuracy', 'Last Updated');

  const current = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
    : [];
  if (current.join('|') === header.join('|')) return;

  sheet.getRange(1, 1, 1, header.length).setValues([header])
    .setFontWeight('bold').setBackground('#6b3a1f').setFontColor('#fff6e6').setWrap(true)
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.setColumnWidth(1, 180);
  sheet.setRowHeight(1, 48);
  // Shade each question's pair of columns alternately so they're easy to read
  for (let i = 0; i < questions.length; i++) {
    const col = 2 + i * 2;
    sheet.getRange(1, col, 1, 2).setBackground(i % 2 ? '#8a4a22' : '#b24f12');
  }
}

function formatRow_(sheet, rowIndex, nQuestions) {
  for (let i = 0; i < nQuestions; i++) {
    sheet.getRange(rowIndex, 3 + i * 2).setNumberFormat('0%');
  }
  const base = 2 + nQuestions * 2;
  sheet.getRange(rowIndex, base + 2).setNumberFormat('0%');
  sheet.getRange(rowIndex, base + 3).setNumberFormat('m/d/yyyy h:mm am/pm');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
