/*  POST /api/rsvp: a Vercel serverless function.
    Checks the guest's reply, then saves it as a row in the family's Google Sheet
    through the Apps Script web app in rsvp-sheet/Code.gs.

    Vercel → Project → Settings → Environment Variables:
      RSVP_SHEET_URL   the Apps Script web app URL (ends in /exec)
      RSVP_SECRET      any long random text; the same value goes in Code.gs          */

const EVENTS = ["The Wedding"];

const readBody = req => new Promise((resolve, reject) => {
  if (req.body !== undefined) return resolve(typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body);
  let raw = "";
  req.on("data", c => { raw += c; if (raw.length > 1e5) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch (e) { reject(e); } });
  req.on("error", reject);
});

const send = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
};

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST" });

  let b;
  try { b = await readBody(req); } catch (e) { return send(res, 400, { ok: false, error: "Couldn't read your reply." }); }

  // Hidden "company" field: people never see it, spam bots fill it in
  if (clean(b.company, 100)) return send(res, 200, { ok: true });

  const name = clean(b.name, 80);
  const phone = clean(b.phone, 30);
  const attending = b.attending === "no" ? "no" : "yes";
  // The separate Pellikuthuru page (/pellikuthuru) has one event and its own tab in the sheet
  const pellikuthuru = b.form === "pellikuthuru";
  const events = attending !== "yes" ? []
    : pellikuthuru ? ["Pellikuthuru"]
    : (Array.isArray(b.events) ? b.events : []).filter(e => EVENTS.includes(e));
  const guests = attending === "yes" ? Math.min(20, Math.max(1, parseInt(b.guests, 10) || 1)) : 0;
  const message = clean(b.message, 500);

  const errors = {};
  if (!name) errors.name = "Please tell us your name.";
  if (phone && !/^[+()\-.\s\d]{7,}$/.test(phone)) errors.phone = "That phone number doesn't look right.";
  if (attending === "yes" && !events.length) errors.events = "Pick at least one celebration.";
  if (Object.keys(errors).length) return send(res, 400, { ok: false, errors });

  const row = { name, phone, attending, events, guests, message, submittedAt: new Date().toISOString() };
  row.sheet = pellikuthuru ? "Pellikuthuru" : "Only-Wedding";   // this wedding-only site writes to its own tab

  const url = process.env.RSVP_SHEET_URL;
  if (!url) {
    // Local preview (node dev-server.js) without a sheet yet: just print the reply
    if (process.env.RSVP_DEV === "1") { console.log("RSVP (not saved, no RSVP_SHEET_URL):", row); return send(res, 200, { ok: true, attending, events }); }
    console.error("RSVP_SHEET_URL is not set");
    return send(res, 500, { ok: false, error: "RSVPs aren't set up yet. Please try again later." });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...row, secret: process.env.RSVP_SECRET || "" }),
      redirect: "follow"
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || `Sheet replied ${r.status}`);
  } catch (e) {
    console.error("Saving RSVP failed:", e.message);
    return send(res, 502, { ok: false, error: "Something went wrong saving your reply. Please try again." });
  }

  send(res, 200, { ok: true, attending, events });
};
