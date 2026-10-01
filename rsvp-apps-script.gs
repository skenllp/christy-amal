/* Google Sheets RSVP receiver
   1. Create a Google Sheet. Extensions > Apps Script. Paste this file. Save.
   2. Deploy > New deployment > type "Web app".
      Execute as: Me.  Who has access: Anyone.  Deploy and authorise.
   3. Copy the Web app URL into weddingData.rsvpEndpoint in script.js.
   4. After editing this script later, use Deploy > Manage deployments > Edit > New version.
   The "RSVP" sheet lists each response. The "Summary" sheet shows live counts. */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let d = {};
    try { d = JSON.parse(e.postData.contents); } catch (err) {}
    if (d.website) return ok_();                       // spam trap
    let sh = ss.getSheetByName("RSVP");
    if (!sh) {
      sh = ss.insertSheet("RSVP");
      sh.appendRow(["Time", "Name", "Attending", "Guests", "Message"]);
      sh.setFrozenRows(1);
    }
    const attending = d.attending === "Yes" ? "Yes" : "No";
    const guests = attending === "Yes" ? Math.min(Math.max(parseInt(d.guests, 10) || 1, 1), 20) : 0;
    sh.appendRow([new Date(), String(d.name || "").slice(0, 100), attending, guests, String(d.message || "").slice(0, 500)]);
    ensureSummary_(ss);
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

function ensureSummary_(ss) {
  if (ss.getSheetByName("Summary")) return;
  const s = ss.insertSheet("Summary");
  s.getRange("A1:B4").setValues([
    ["Total guests attending", "=SUM(RSVP!D2:D)"],
    ["Responses: attending", '=COUNTIF(RSVP!C2:C,"Yes")'],
    ["Responses: declined", '=COUNTIF(RSVP!C2:C,"No")'],
    ["Total responses", "=COUNTA(RSVP!B2:B)"]
  ]);
  s.getRange("A1:A4").setFontWeight("bold");
  s.setColumnWidth(1, 220);
}

function ok_() {
  return ContentService.createTextOutput("ok");
}
