/*  Pellikuthuru page RSVP. Replies go through /api/rsvp to the "Pellikuthuru" tab of the RSVP sheet.  */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Mango-leaf thoranam with marigold strings (same as the main invite) ---------- */
  (function drawThoranam() {
    const w = 480, n = 14, step = w / n;
    let g = `<path d="M0 10 Q${w / 2} 22 ${w} 10" stroke="#c8962f" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < n; i++) {
      const x = step * i + step / 2, y = 10 + 12 * Math.sin(Math.PI * (x / w));
      if (i % 2) {
        g += `<g transform="translate(${x} ${y}) rotate(${(i % 4) - 1.5})">
          <path d="M0 0 C-11 14 -9 34 0 46 C9 34 11 14 0 0Z" fill="#3f7a2a"/>
          <path d="M0 2 V44" stroke="#8cc063" stroke-width="1"/></g>`;
      } else {
        const len = 3 + (i % 3);
        for (let k = 0; k < len; k++) g += `<circle cx="${x}" cy="${y + 6 + k * 11}" r="5.5" fill="${k % 2 ? "#f2b51d" : "#ef7d14"}"/>`;
        g += `<circle cx="${x}" cy="${y + 6 + len * 11}" r="3.5" fill="#d6246b"/>`;
      }
    }
    $(".thoranam").innerHTML = `<svg viewBox="0 0 ${w} 92" preserveAspectRatio="none">${g}</svg>`;
  })();

  /* ---------- RSVP ---------- */
  let attend = "";
  $$(".opt").forEach(b => b.addEventListener("click", () => {
    attend = b.dataset.attend;
    $$(".opt").forEach(o => { o.classList.toggle("on", o === b); o.setAttribute("aria-checked", o === b); });
    $("#pkYes").classList.toggle("collapsed", attend !== "yes");
    $("#pkMsgNo").textContent = attend === "yes" ? "4" : "3";
  }));
  const count = $("#pkCount");
  $$(".st-btn").forEach(b => b.addEventListener("click", () => {
    count.value = Math.min(20, Math.max(1, (+count.value || 1) + +b.dataset.step));
  }));

  $("#pkThanksBack").addEventListener("click", () => {
    $("#pkThanks").hidden = true; document.body.classList.remove("thanks-open");
    window.scrollTo({ top: 0, behavior: "instant" });                 // back to the top of the invitation
  });

  let sending = false;
  $("#pkForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (sending) return;
    const name = $("#pkName").value.trim(), err = $("#pkError");
    if (!name) { err.textContent = "Please tell us your name."; $("#pkName").focus(); return; }
    if (!attend) { err.textContent = "Please let us know if you can come."; return; }
    err.textContent = "";
    const send = $("#pkSend");
    sending = true; send.disabled = true; send.textContent = "Sending…";
    try {
      const r = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          form: "pellikuthuru", name, phone: $("#pkPhone").value.trim(), attending: attend,
          guests: Math.max(1, +count.value || 1), message: $("#pkMsg").value.trim(), company: $("#pkCompany").value
        })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) {
        err.textContent = (out.errors && Object.values(out.errors)[0]) || out.error || "Something went wrong. Please try again.";
        return;
      }
      const yes = attend === "yes";
      const msg = yes ? "Jyosthna is so happy you're coming! See you at the Pellikuthuri Veduka." : "We'll miss you, and we're grateful for your blessings.";
      // put the form away: only a short thank-you stays in its place
      $(".rsvp-card").classList.add("sent");
      $("#pkForm").hidden = true;
      $("#pkDoneMsg").textContent = msg;
      $("#pkDone").hidden = false;
      // and show a full-screen thank-you
      $("#pkThanksDear").textContent = `Dear ${name.split(/\s+/)[0]},`;
      $("#pkThanksTe").textContent = yes ? "మీ రాక మాకు ఎంతో ఆనందం" : "మీ ఆశీస్సులే మాకు బలం";
      $("#pkThanksMsg").textContent = msg;
      $("#pkThanks").hidden = false; document.body.classList.add("thanks-open");
      $("#pkThanksBack").focus({ preventScroll: true });
    } catch (e2) {
      err.textContent = "Couldn't reach us. Please check your connection and try again.";
    } finally {
      sending = false; send.disabled = false; send.textContent = "Send RSVP";
    }
  });
})();
