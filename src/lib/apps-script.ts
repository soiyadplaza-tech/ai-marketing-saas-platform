// FOYSAL IT Google Apps Script code (pasted at script.google.com)
export const APPS_SCRIPT_CODE = `/**
 * ============================================================
 *  FOYSAL IT - Google Apps Script Web App
 *  Serves your lead spreadsheet as CSV / JSON to the FOYSAL IT app.
 *  Works even if the sheet is PRIVATE (runs with your permission).
 * ============================================================
 */

// >>> STEP 1: Your Spreadsheet ID (from the sheet URL)
//   https://docs.google.com/spreadsheets/d/ SPREADSHEET_ID /edit
var SPREADSHEET_ID = '1I14GPL_LLCvSUyHT8aU2xDSJAXLxIDuUFweSDUrqWLA';

// >>> STEP 2 (optional): Default sheet tab ID (the "gid" in the sheet URL).
//   Leave blank to always use the first tab.
var DEFAULT_GID = '1267128335';

function doGet(e) {
  try {
    var sheetId = (e && e.parameter && e.parameter.sheetId) || SPREADSHEET_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    if (!ss) throw new Error('Spreadsheet not found: ' + sheetId);

    // ?action=sheets  ->  list all tabs (used for tab selection)
    if (e && e.parameter.action === 'sheets') {
      var list = ss.getSheets().map(function (s) {
        return {
          name: s.getName(),
          index: s.getIndex(),
          gid: s.getSheetId(),
          rows: s.getLastRow(),
          cols: s.getLastColumn()
        };
      });
      return json({ ok: true, spreadsheet: ss.getName(), sheets: list });
    }

    var sheet = pickSheet(ss, e ? e.parameter : {});
    var values = sheet.getDataRange().getValues();
    if (!values.length) return csv([['(empty sheet)']]);

    // ?format=json  ->  JSON with auto headers
    if (e && e.parameter.format === 'json') {
      var headers = values[0].map(function (h) { return String(h); });
      var rows = values.slice(1).map(function (r) {
        var o = {};
        headers.forEach(function (h, i) { o[h] = (r[i] == null ? '' : r[i]); });
        return o;
      });
      return json({ ok: true, sheet: sheet.getName(), total: rows.length, rows: rows });
    }

    // Default: plain CSV (what the FOYSAL IT importer expects)
    return csv(values);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function pickSheet(ss, params) {
  var sheets = ss.getSheets();

  if (params.gid) {
    var g1 = parseInt(params.gid, 10);
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === g1) return sheets[i];
    }
  }
  if (params.sheet) {
    var byName = ss.getSheetByName(params.sheet);
    if (byName) return byName;
  }
  if (DEFAULT_GID) {
    var g2 = parseInt(DEFAULT_GID, 10);
    for (var j = 0; j < sheets.length; j++) {
      if (sheets[j].getSheetId() === g2) return sheets[j];
    }
  }
  return sheets[0];
}

function csv(values) {
  var text = values.map(function (r) {
    return r.map(escapeCsv).join(',');
  }).join('\\n');
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.CSV);
}

function escapeCsv(v) {
  var s = (v == null) ? '' : String(v);
  if (s.indexOf('\\n') > -1) s = s.replace(/\\n/g, ' ');
  if (/[",]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
