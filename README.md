# Prithvi & Jyosthna — wedding invitation

A Telugu wedding invitation website. Static HTML/CSS/JS, no build step, plus one small Vercel function for RSVPs.

```
index.html      all wording and sections
style.css       look, fonts, animations
script.js       envelope + Ganesha opening, music, scratch & dhol cards, scroll motion, countdown, RSVP
config.js       muhurtham date, music, venue, map link, calendar entries
api/rsvp.js     RSVP server function: checks the reply and saves it to the Google Sheet
rsvp-sheet/     Code.gs, the Google Apps Script that writes each RSVP as a sheet row
dev-server.js   local preview that also runs api/rsvp.js
assets/         images, Telugu font, music
card/           శుభలేఖ — traditional Telugu wedding card (shubhalekha.png for WhatsApp, .pdf for print)
```

## Run locally
`node dev-server.js` in this folder, then open http://localhost:5178.
Without `.env.local`, RSVPs are printed in the terminal instead of saved, so you can try the form safely.

## RSVP setup (one time, about 5 minutes)
RSVPs go: guest's browser → `/api/rsvp` on Vercel → Google Apps Script → a row in your Google Sheet.

1. **Make the sheet.** Go to https://sheets.new and name it, e.g. "Wedding RSVPs".
2. **Add the script.** In the sheet: Extensions → Apps Script. Delete what's there, paste all of `rsvp-sheet/Code.gs`.
3. **Pick a secret.** Replace `PASTE-THE-SAME-SECRET-AS-VERCEL` with any long random text (e.g. `pj-2026-mangalyam-8431`). Save.
4. **Publish it.** Deploy → New deployment → gear icon → Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, allow the permissions Google asks for, and copy the **Web app URL** (ends in `/exec`).
   - Check: opening that URL in a browser should show `{"ok":true,"message":"RSVP sheet is ready"}`.
5. **Tell Vercel.** Vercel → your project → Settings → Environment Variables, add both for Production:
   - `RSVP_SHEET_URL` = the Web app URL
   - `RSVP_SECRET` = the same secret as step 3
   Then Deployments → ⋯ → Redeploy, so the function picks them up.
6. **Test.** Send an RSVP on the live site; a row appears in the "RSVPs" tab of the sheet.

To test against the real sheet locally, create `.env.local` (not committed) with:
```
RSVP_SHEET_URL=https://script.google.com/macros/s/…/exec
RSVP_SECRET=pj-2026-mangalyam-8431
```

### If RSVPs aren't arriving
- "RSVPs aren't set up yet": `RSVP_SHEET_URL` is missing in Vercel, or you didn't redeploy after adding it.
- "Something went wrong saving your reply": check Vercel → project → Logs for `Saving RSVP failed:`.
  - `Wrong secret`: the secret in Code.gs and `RSVP_SECRET` don't match exactly.
  - A Google sign-in page or `Sheet replied 401/403`: the web app's access isn't set to **Anyone**.
- Changed Code.gs? Deploy → Manage deployments → edit → Version: **New version**, or the old code keeps running.

## Before sharing
- `config.js`: set `mapUrl` to your Google Maps link for "View location".
- WhatsApp preview: `assets/og/couple-square.jpg` (just the couple photo, 900×900 square cropped from the top so WhatsApp shows both faces; baseline JPEG under 300 KB), served from the live site
  https://wedding-beryl-tau.vercel.app/. If the address changes, update `og:url`, `og:image` and `twitter:image`
  in `index.html`. WhatsApp caches previews, so a changed card can take a while to show.

## Deploy
Vercel → Add New → Project → import this repository (Framework: Other, no build command).
Vercel serves the site and runs `api/rsvp.js` automatically. Add the two RSVP environment variables above.
