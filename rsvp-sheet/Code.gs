/*  Google Apps Script that saves each RSVP as a row in this Google Sheet.
    Setup steps are in README.md under "RSVP setup".
    Set SECRET to the same text as RSVP_SECRET in Vercel.  */

const SECRET = "PASTE-THE-SAME-SECRET-AS-VERCEL";
const HEADERS = ["Submitted", "Name", "Phone", "Attending", "Event", "Guests", "Message"];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return reply({ ok: false, error: "Wrong secret" });

    // Replies from the Pellikuthuru page get their own tab; everything else (the wedding-only invite) goes to the "Only-Wedding" tab
    const tab = d.sheet === "Pellikuthuru" ? "Pellikuthuru" : "Only-Wedding";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(tab);
    // Headings on row 1 of every tab, added automatically if they're missing
    if (sheet.getRange(1, 1).getValue() !== "Submitted") { sheet.insertRowBefore(1); sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]); }

    sheet.appendRow([
      new Date(d.submittedAt || Date.now()),
      d.name,
      d.phone ? "'" + d.phone : "",          // keep the leading + on phone numbers
      d.attending === "yes" ? "Yes" : "No",
      (d.events || []).join(", "),
      d.guests || 0,
      d.message || ""
    ]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// Opening the web app URL in a browser shows this, which confirms the deployment works
function doGet() {
  return reply({ ok: true, message: "RSVP sheet is ready" });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
