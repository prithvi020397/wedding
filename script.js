(() => {
  const C = window.INVITE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Always start at the top: no restored scroll position or #section from an earlier visit behind the envelope
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0, 0);

  /* ---------- Mango-leaf thoranam with marigold strings ---------- */
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

  /* ---------- Music ---------- */
  const audio = $("#music"), mBtn = $("#musicBtn");
  audio.src = C.music.src;
  audio.volume = C.music.volume;
  const setPlaying = on => {
    mBtn.classList.toggle("playing", on);
    mBtn.classList.toggle("muted", !on);
    mBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  };
  mBtn.addEventListener("click", () => audio.paused ? audio.play().then(() => setPlaying(true)).catch(() => {}) : (audio.pause(), setPlaying(false)));

  // Smooth volume fades (the dhol card hushes the music, then brings it back)
  let fadeTimer = 0;
  const fadeMusic = (to, ms, done) => {
    clearInterval(fadeTimer);
    const from = audio.volume, steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    fadeTimer = setInterval(() => {
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * (++i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 40);
  };
  let musicHeld = false;
  const holdMusic = () => {
    if (audio.paused) return;
    musicHeld = true;
    fadeMusic(0, 400, () => { audio.pause(); setPlaying(false); });
  };
  const releaseMusic = () => {
    if (!musicHeld) return;
    musicHeld = false;
    audio.volume = 0;
    audio.play().then(() => { setPlaying(true); fadeMusic(C.music.volume, 1500); }).catch(() => {});
  };

  /* ---------- Hero fits one screen (scaled down on short phones so the scroll cue stays visible) ---------- */
  const heroFit = $("#heroFit");
  const fitHero = () => {
    const H = innerHeight - 8;                // leave room for the bouncing scroll arrow
    heroFit.style.zoom = 1;
    let z = 1;
    for (let i = 0; i < 3; i++) {             // re-measure: at a smaller zoom the text wraps differently
      const h = heroFit.getBoundingClientRect().height;
      if (h <= H + 1) break;
      z = Math.max(.6, z * H / h);
      heroFit.style.zoom = z;
    }
  };
  fitHero();
  addEventListener("resize", fitHero);
  document.fonts?.ready.then(fitHero);
  $$("img", heroFit).forEach(img => img.complete || img.addEventListener("load", fitHero));

  /* ---------- Envelope ---------- */
  const gate = $("#gate");
  const openInvite = () => {
    if (gate.classList.contains("s1")) return;
    const t = ms => reduce ? 0 : ms;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    mBtn.hidden = false;
    $("#invite").removeAttribute("aria-hidden");
    gate.classList.add("s1");                                       // seal gives way, flap opens, card slides out
    setTimeout(() => gate.classList.add("s2"), t(1700));            // envelope drifts away, Lord Ganesha draws in gold
    setTimeout(() => gate.classList.add("s3"), t(5050));            // Ganesha rises and fades
    setTimeout(() => gate.classList.add("opening"), t(5650));       // the title card glows in
    setTimeout(() => { gate.classList.add("emerge"); burst(45); }, t(6050)); // "మా ఇంటి పెళ్ళి సందడి" steps out
    // The rest follows the song itself: the title card fades as the music goes quiet (12.2 s)
    // and the invite lands on the beat drop (12.4 s). If the music is late, the page waits for it;
    // if it can't play at all, the clock since the tap is used instead.
    const tapAt = performance.now();
    const songTime = () => !audio.paused && audio.currentTime > 0 ? audio.currentTime : (performance.now() - tapAt) / 1000;
    const cues = [
      [C.music.drop - 1.5, () => {                                  // it fades away slowly,
        gate.classList.add("settle");
        window.scrollTo(0, 0);                                      // top of the hero before it shows
        document.body.classList.add("opened");                      // while the hero gets ready underneath
        startReveals();
      }],
      [C.music.drop - 0.12, () => gate.classList.add("fade", "drop")], // the beat drops: the invite appears
      [C.music.drop + 0.6, () => {
        gate.classList.add("gone");
        document.body.classList.remove("locked");
        window.scrollTo(0, 0);
      }]
    ];
    if (reduce) { cues.forEach(([, fn]) => fn()); return; }
    const follow = () => {
      while (cues.length && songTime() >= cues[0][0]) cues.shift()[1]();
      if (cues.length) requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  };
  $("#openBtn").addEventListener("click", openInvite);

  // Scanned the photos QR code at the wedding: skip the envelope and go straight to "Through your eyes"
  if (new URLSearchParams(location.search).has("memories")) {
    gate.classList.add("gone");
    document.body.classList.remove("locked"); document.body.classList.add("opened");
    $("#invite").removeAttribute("aria-hidden");
    addEventListener("load", () => { startReveals(); $("#memories").scrollIntoView({ behavior: "instant" }); });
  }

  /* ---------- Falling petals ---------- */
  const cv = $("#petals"), ctx = cv.getContext("2d");
  // Rose & marigold petals, talambralu (turmeric rice) and jasmine
  const colors = ["#c0392b", "#e0533c", "#a93226", "#e67e22", "#d35400", "#f1948a"];
  let petals = [], W = 0, H = 0, dpr = 1;
  const kindOf = () => { const r = Math.random(); return r < .6 ? "petal" : r < .85 ? "rice" : "jasmine"; };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
  };
  resize(); addEventListener("resize", resize);
  const petal = (top = true, kind = kindOf()) => ({
    kind, x: Math.random() * W, y: top ? -20 * dpr : Math.random() * H * 0.6,
    r: (kind === "rice" ? 2.2 + Math.random() : kind === "jasmine" ? 4 + Math.random() * 2 : 5 + Math.random() * 6) * dpr,
    vy: (kind === "rice" ? 1.2 + Math.random() : 0.6 + Math.random() * 1.1) * dpr, vx: (Math.random() - .5) * .6 * dpr,
    a: Math.random() * 6.28, va: (Math.random() - .5) * .06, sway: Math.random() * 6.28,
    c: kind === "rice" ? (Math.random() < .5 ? "#f2c230" : "#e8a915") : colors[(Math.random() * colors.length) | 0]
  });
  function burst(k, kind) { if (!reduce) for (let i = 0; i < k; i++) petals.push(petal(false, kind)); }
  const drawJasmine = r => {
    ctx.fillStyle = "#fffdf6";
    for (let i = 0; i < 5; i++) { ctx.rotate(1.2566); ctx.beginPath(); ctx.ellipse(0, -r * .6, r * .32, r * .6, 0, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = "#f2c230"; ctx.beginPath(); ctx.arc(0, 0, r * .18, 0, 6.283); ctx.fill();
  };
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    if (!reduce && gate.classList.contains("opening") && petals.length < 16 && Math.random() < .05) petals.push(petal());
    petals = petals.filter(p => p.y < H + 30 * dpr);
    for (const p of petals) {
      p.sway += .02; p.x += p.vx + Math.sin(p.sway) * .5 * dpr; p.y += p.vy; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = .85;
      if (p.kind === "jasmine") { ctx.globalAlpha = .95; drawJasmine(p.r); }
      else if (p.kind === "rice") { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .45, 0, 0, 6.283); ctx.fill(); }
      else {
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); ctx.fill();
        ctx.globalAlpha = .25; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-p.r * .3, -p.r * .1, p.r * .4, p.r * .18, 0, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- Scroll reveal (staggered within each section) ---------- */
  $$("main section, main footer").forEach(sec => $$(".reveal", sec).forEach((el, i) => el.style.setProperty("--i", Math.min(i, 6))));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
  }), { threshold: .12, rootMargin: "0px 0px -8% 0px" });
  // Started when the envelope opens, so nothing animates unseen behind it
  let revealsStarted = false;
  const startReveals = () => { revealsStarted = true; $$(".reveal").forEach(el => io.observe(el)); };
  // Once revealed, drop the stagger delay so later hovers/taps feel instant
  document.addEventListener("transitionend", e => e.target.classList?.contains("in") && e.target.style.removeProperty("--i"));

  /* ---------- Scroll-linked motion: timeline line, ritual lamps, hero parallax ---------- */
  const timeline = $(".timeline"), parallax = $$("[data-parallax]");
  const ritePath = $("#ritePath"), rites = $$(".rite", ritePath);
  const fill = (el, at) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--p", Math.min(1, Math.max(0, (innerHeight * at - r.top) / r.height)).toFixed(3));
  };
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = innerHeight;
    fill(timeline, .75);
    fill(ritePath, .62);
    rites.forEach(li => li.classList.toggle("lit", li.getBoundingClientRect().top + 30 < vh * .62));
    if (!reduce) parallax.forEach(el => {
      const t = el.getBoundingClientRect().top;
      if (t < vh && t > -vh) el.style.transform = `translate3d(0, ${(-t * el.dataset.parallax).toFixed(1)}px, 0)`;
    });
  };
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();


  /* ---------- Calendar + location links ---------- */
  $$("[data-cal]").forEach(a => {
    const ev = C.events[a.dataset.cal];
    a.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(ev.title) + "&dates=" + ev.start + "/" + ev.end +
      "&location=" + encodeURIComponent(ev.location || C.venueQuery);
  });
  const mapUrl = C.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.venueQuery);
  $$("[data-map]").forEach(a => a.href = (a.dataset.map && C.events[a.dataset.map].mapUrl) || mapUrl);

  /* ---------- Countdown ---------- */
  const target = new Date(C.date).getTime();
  const cd = { D: $("#cdD"), H: $("#cdH"), M: $("#cdM"), S: $("#cdS") };
  const set = (el, v) => { if (el.textContent !== v) { el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } };
  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    set(cd.D, String(d).padStart(2, "0")); set(cd.H, String(h).padStart(2, "0"));
    set(cd.M, String(m).padStart(2, "0")); set(cd.S, String(s).padStart(2, "0"));
  };
  tick(); setInterval(tick, 1000);

  /* ---------- RSVP ---------- */
  let attend = "";                                       // nothing chosen until the guest taps
  $$(".opt").forEach(b => b.addEventListener("click", () => {
    attend = b.dataset.attend;
    $$(".opt").forEach(o => { o.classList.toggle("on", o === b); o.setAttribute("aria-checked", o === b); });
    $("#attendYes").classList.toggle("collapsed", attend !== "yes");   // celebrations and guests only for a yes
    $("#msgNo").textContent = attend === "yes" ? "4" : "3";               // keep the steps numbered in order
  }));
  const count = $("#gCount");
  $$(".st-btn").forEach(b => b.addEventListener("click", () => {
    count.value = Math.min(20, Math.max(1, (+count.value || 1) + +b.dataset.step));
  }));
  // Saved on the server (api/rsvp.js), which adds a row to the family's Google Sheet
  let sending = false;
  $("#rsvpForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (sending) return;
    const name = $("#gName").value.trim(), err = $("#fError");
    if (!name) { err.textContent = "Please tell us your name."; $("#gName").focus(); return; }
    if (!attend) { err.textContent = "Please let us know if you can join us."; return; }
    const evs = attend === "yes" ? ["The Wedding"] : [];
    err.textContent = "";
    const btn = $("#rsvpSend");
    sending = true; btn.disabled = true; btn.textContent = "Sending…";
    try {
      const r = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, phone: $("#gPhone").value.trim(), attending: attend, events: evs,
          guests: Math.max(1, +count.value || 1), message: $("#gMsg").value.trim(),
          company: $("#gCompany").value
        })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) {
        err.textContent = (out.errors && Object.values(out.errors)[0]) || out.error || "Something went wrong. Please try again.";
        return;
      }
      $("#rsvpForm").hidden = true;
      const msg = attend === "yes"
        ? `We can't wait to celebrate with you at ${evs.map(e => "the " + e.replace(/^The /, "")).join(", ").replace(/, ([^,]*)$/, " and $1")}.`
        : "We'll miss you, and we're grateful for your blessings.";
      $("#rsvpDoneMsg").textContent = msg;
      $("#rsvpDone").hidden = false;
      // a full-screen welcome from the couple instead of the page again
      $("#thanksDear").textContent = `Dear ${name.split(/\s+/)[0]},`;
      $("#thanksNames").hidden = attend !== "yes";                // the couple's names only on the welcome
      $("#thanksWelcome").textContent = attend === "yes" ? "welcome you with love" : "Thank you for your love";
      $("#thanksTe").textContent = attend === "yes" ? "మీ రాక మాకు ఎంతో ఆనందం" : "మీ ఆశీస్సులే మాకు బలం";
      $("#thanksMsg").textContent = msg;
      $("#thanks").hidden = false; document.body.classList.add("thanks-open");
      $("#thanksBack").focus({ preventScroll: true });
      burst(60);
    } catch (e2) {
      err.textContent = "Couldn't reach us. Please check your connection and try again.";
    } finally {
      sending = false; btn.disabled = false; btn.textContent = "Send RSVP";
    }
  });

  $("#thanksBack").addEventListener("click", () => {
    $("#thanks").hidden = true; document.body.classList.remove("thanks-open");
    // back to the first page of the invite, not the RSVP form at the bottom
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  /* ---------- Through your eyes: uploads open on the set date, once an upload link is chosen ---------- */
  (function memories() {
    const M = C.memories || {}, box = $("#memUpload");
    if (!box || Date.now() < new Date(M.opens).getTime()) return;      // before Dec 16: "uploads open on December 16"
    box.innerHTML = M.uploadUrl
      ? `<a class="mem-btn" href="${M.uploadUrl}" target="_blank" rel="noopener">Upload your photos &amp; videos</a>`
      : `<span class="mem-pill">Photo &amp; video uploads coming soon</span>`;
  })();

  /* ---------- Reveal modal ---------- */
  const modal = $("#modal");
  let current = null;
  const openCard = kind => {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    current = $(`[data-card="${kind}"]`, modal);
    current.hidden = false;
    if (kind === "akshi") { initAkshi(); holdMusic(); }          // only the pattering rice while showering
  };
  const closeCard = () => {
    modal.hidden = true; document.body.classList.remove("modal-open");
    if (current) current.hidden = true;
    if (current && current.dataset.card === "akshi") releaseMusic();
    current = null;
  };
  $$("[data-open]").forEach(b => b.addEventListener("click", () => openCard(b.dataset.open)));
  $("#modalClose").addEventListener("click", closeCard);
  modal.addEventListener("click", e => { if (e.target === modal) closeCard(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeCard(); });

  /* ---------- Sacred ritual detail: tap a ritual card to read more ---------- */
  const riteItems = $$("#ritePath .rite"), riteDetail = $("#riteDetail"), riteCard = $(".rcard-rite");
  let riteIdx = 0;
  const fillRite = (i, dir = 0) => {
    riteIdx = (i + riteItems.length) % riteItems.length;
    const li = riteItems[riteIdx], info = $(".rite-info", li).content.cloneNode(true);
    const el = (tag, cls, html) => Object.assign(document.createElement(tag), { className: cls, innerHTML: html });
    riteDetail.replaceChildren(
      info.querySelector(".rd-art"),
      el("p", "rd-num", `${$(".rite-node", li).textContent} · Ritual ${riteIdx + 1} of ${riteItems.length}`),
      el("h3", "rd-tel", $(".r-tel", li).textContent),
      el("p", "rd-en", $("h3", li).textContent),
      ...info.childNodes
    );
    $("#riteCount").textContent = `${riteIdx + 1} / ${riteItems.length}`;
    riteDetail.scrollTop = 0;
    if (dir && !reduce) riteDetail.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
  const openRite = (i, from) => {
    fillRite(i);
    openCard("rite");
    if (reduce) return;
    // grow the detail card out of the tapped ritual card
    const a = from.getBoundingClientRect(), b = riteCard.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    riteCard.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: .35, borderRadius: "16px" },
      { transform: "none", opacity: 1 }
    ], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
  riteItems.forEach((li, i) => {
    const card = $(".rite-card", li);
    card.addEventListener("click", () => openRite(i, card));
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRite(i, card); } });
  });
  $("#ritePrev").addEventListener("click", () => fillRite(riteIdx - 1, -1));
  $("#riteNext").addEventListener("click", () => fillRite(riteIdx + 1, 1));
  addEventListener("keydown", e => {
    if (modal.hidden || riteCard.hidden) return;
    if (e.key === "ArrowLeft") fillRite(riteIdx - 1, -1);
    if (e.key === "ArrowRight") fillRite(riteIdx + 1, 1);
  });
  let swipeX = null;
  riteCard.addEventListener("touchstart", e => { swipeX = e.touches[0].clientX; }, { passive: true });
  riteCard.addEventListener("touchend", e => {
    if (swipeX === null) return;
    const d = e.changedTouches[0].clientX - swipeX; swipeX = null;
    if (Math.abs(d) > 60) fillRite(riteIdx + (d < 0 ? 1 : -1), d < 0 ? 1 : -1);
  });

  /* ---------- Particles and small sounds for the haldi and akshinthalu cards ---------- */
  const fxLayer = canvas => {
    const c2 = canvas.getContext("2d");
    let parts = [], running = false, k = 1, w = 0, h = 0;
    const tick = () => {
      c2.setTransform(k, 0, 0, k, 0, 0); c2.clearRect(0, 0, w, h);
      parts = parts.filter(p => p.life > 0 && p.y < h + 20);
      for (const p of parts) {
        p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
        c2.globalAlpha = Math.min(1, p.life / p.fade); c2.fillStyle = p.c;
        c2.save(); c2.translate(p.x, p.y); c2.rotate(p.rot);
        c2.beginPath(); c2.ellipse(0, 0, p.w, p.h, 0, 0, 6.283); c2.fill(); c2.restore();
      }
      c2.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(tick); else running = false;
    };
    return {
      fit() { k = Math.min(devicePixelRatio || 1, 2); w = canvas.offsetWidth; h = canvas.offsetHeight;   // offset sizes ignore the pop-in scale
        canvas.width = w * k; canvas.height = h * k; parts = []; },
      add(list) { if (reduce) return; parts.push(...list); if (!running) { running = true; requestAnimationFrame(tick); } }
    };
  };
  const pick = a => a[(Math.random() * a.length) | 0];
  const Sfx = (() => {
    let ac = null;
    const ctxA = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
    const noise = (a, dur) => {
      const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = b; return src;
    };
    const env = (a, t, peak, len) => {
      const g = a.createGain(); g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      return g;
    };
    return {
      // wooden rokali landing in the stone rolu
      thud() { try {
        const a = ctxA(), t = a.currentTime, o = a.createOscillator();
        o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .16);
        o.connect(env(a, t, .85, .26)).connect(a.destination); o.start(t); o.stop(t + .3);
        const n = noise(a, .1), f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1100;
        n.connect(f).connect(env(a, t, .4, .12)).connect(a.destination); n.start(t);
      } catch (e) {} },
      // a handful of rice falling: a soft, airy rustle that swells and fades, never a tap or a beat
      rice(big) { try {
        const a = ctxA(), t = a.currentTime, len = big ? 1.8 : 1.1;
        const n = noise(a, len), hp = a.createBiquadFilter(), lp = a.createBiquadFilter(), g = a.createGain();
        hp.type = "highpass"; hp.frequency.value = 3800;
        lp.type = "lowpass"; lp.frequency.value = 9000;
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(big ? .16 : .1, t + .18);      // gentle swell, no hard start
        g.gain.exponentialRampToValueAtTime(.0001, t + len);          // long, soft fade
        n.connect(hp).connect(lp).connect(g).connect(a.destination); n.start(t); n.stop(t + len);
      } catch (e) {} }
    };
  })();
  const markDots = (dots, n) => dots.forEach((d, i) => d.classList.toggle("on", i < n));
  const onTap = (el, fn) => {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  };

  /* Shower akshinthalu — each tap throws a handful of turmeric-and-kumkum rice over the couple */
  const akshiCard = $(".rcard-akshi"), akshiDots = $$("#akshiBeats i"), akshiFx = fxLayer($("#akshiFx"));
  const akshiArch = $("#akshiArch");
  let throws = 0;
  function initAkshi() { akshiCard.classList.remove("done"); throws = 0; markDots(akshiDots, 0); akshiFx.fit(); }
  // the rice falls from above the couple's heads down over them, the way elders shower it at the muhurtham
  const handful = (n, spread) => {
    const c = akshiCard.getBoundingClientRect(), a = akshiArch.getBoundingClientRect();
    const cx = a.left - c.left + a.width / 2, top = a.top - c.top;
    return Array.from({ length: n }, () => ({
      x: cx + (Math.random() - .5) * a.width * spread, y: top - 10 - Math.random() * 70,
      vx: (Math.random() - .5) * 1.2, vy: 1 + Math.random() * 2.5, g: .12, drag: .99,
      w: 2.8, h: 1.25, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
      c: Math.random() < .22 ? "#c8102e" : pick(["#f2c230", "#e8a915", "#ffd23f"]), life: 220, fade: 20
    }));
  };
  // a slow, steady fall of akshinthalu across the whole card for a few seconds after it opens
  const blessingRain = ms => {
    if (reduce) return;
    const w = akshiCard.offsetWidth, end = performance.now() + ms;
    const drop = () => {
      if (!akshiCard.classList.contains("done") || akshiCard.hidden) return;   // stop if the card was closed
      akshiFx.add(Array.from({ length: 6 }, () => ({
        x: Math.random() * w, y: -8 - Math.random() * 20, vx: (Math.random() - .5) * .6, vy: .8 + Math.random() * 1.2,
        g: .03, drag: .995, w: 3, h: 1.35, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .25,
        c: Math.random() < .22 ? "#c8102e" : pick(["#f2c230", "#e8a915", "#ffd23f"]), life: 320, fade: 40
      })));
      if (performance.now() < end) setTimeout(drop, 90);
    };
    drop();
  };
  const shower = () => {
    if (akshiCard.classList.contains("done")) return;
    throws++; markDots(akshiDots, throws);
    const last = throws >= akshiDots.length;
    Sfx.rice(last);
    akshiFx.add(handful(last ? 150 : 45, last ? 1.8 : 1.1));
    if (last) setTimeout(() => {
      akshiCard.classList.add("done"); burst(60, "rice");
      blessingRain(3000);                                 // akshinthalu keep falling over the opened card
      setTimeout(releaseMusic, 900);                      // the music returns once the card is open
    }, 650);
  };
  onTap($("#akshiCover"), shower);
})();
