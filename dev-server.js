/*  Local preview that also runs the RSVP function, like Vercel does.
    Run:  node dev-server.js   then open http://localhost:5178
    Put RSVP_SHEET_URL and RSVP_SECRET in .env.local to save to the real sheet;
    without them, replies are only printed in this terminal.  */

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = +process.env.PORT || 5178;

try {
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch (e) {}
process.env.RSVP_DEV = "1";

const rsvp = require("./api/rsvp.js");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".pdf": "application/pdf"
};

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/rsvp") return rsvp(req, res);

  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("content-type", types[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.end(data);
  });
}).listen(port, () => {
  console.log(`Wedding site: http://localhost:${port}`);
  console.log(process.env.RSVP_SHEET_URL ? "RSVPs save to the Google Sheet." : "RSVPs are printed here (no RSVP_SHEET_URL in .env.local).");
});
