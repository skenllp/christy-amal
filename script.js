/* ===== EDIT YOUR DETAILS HERE ===== */
const weddingData = {
  groom: "Amal",
  bride: "Christy",
  groomParents: "Joseph & Shaji",
  brideParents: "P. V. Eldhose & Mini Eldhose",
  brideBrother: "Don P. Eldhose",
  groomSister: "Anitta",
  groomBrotherInLaw: "Jesbin",
  wedding: {
    date: "",      // format: "2027-01-15"  (YYYY-MM-DD)
    time: "",      // e.g. "10:30 AM"  (24h "10:30" also works for the countdown)
    venue: "",
    location: "",
    mapUrl: "https://maps.app.goo.gl/hqQQxFSBAFMwKXae8?g_st=ic"
  },
  // Paste your Google Apps Script Web App URL here (see rsvp-apps-script.gs)
  rsvpEndpoint: "https://script.google.com/macros/s/AKfycbyn9KHTsIOn3_vD2QCiyZGFW5VsX67K82oDwwYM8OlEENVKoGehzRqfsXvFS1chzJv6/exec"
};
/* ==================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const w = weddingData.wedding;

/* Parse "10:30 AM" / "10:30" -> "HH:MM" */
function to24(t) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec((t || "").trim());
  if (!m) return "00:00";
  let h = +m[1]; const min = m[2] || "00", ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return String(h).padStart(2, "0") + ":" + min;
}
const target = w.date ? new Date(`${w.date}T${to24(w.time)}:00`) : null;
const validDate = target && !isNaN(target);

/* Populate text */
$$("[data-bind]").forEach(el => { el.textContent = weddingData[el.dataset.bind] || ""; });
const bigDate = validDate
  ? target.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }).toUpperCase() : "";
const dateText = validDate
  ? target.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  : "";
$$("[data-wedding]").forEach(el => {
  const k = el.dataset.wedding;
  const v = k === "dateText" ? dateText : k === "dateBig" ? bigDate : w[k];
  if (v) el.textContent = v;
});

/* Loader */
const loader = $("#loader");
let loaded = false;
function hideLoader() {
  if (loaded) return; loaded = true;
  loader.classList.add("hide");
  setTimeout(() => loader.remove(), 700);
}
Promise.all(["assets/ornamental-bg.png", "assets/hero-bg.jpg", "assets/hero-couple-cutout.png"].map(src =>
  new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; })
)).then(() => setTimeout(hideLoader, 600));
setTimeout(hideLoader, 4000);

/* Music */
const music = $("#bgMusic"), musicBtn = $("#musicToggle");
function setPlaying(p) { musicBtn.classList.toggle("playing", p); }
musicBtn.addEventListener("click", () => {
  if (music.paused) { music.play().then(() => setPlaying(true)).catch(() => {}); }
  else { music.pause(); setPlaying(false); }
});

/* Opening: seam splits, blush reveal, hero fades in */
const opening = $("#opening");
$("#openBtn").addEventListener("click", () => {
  opening.classList.add("go");
  music.play().then(() => setPlaying(true)).catch(() => {});
  setTimeout(() => {
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    opening.classList.add("fade");
    $(".hero").classList.add("in");
    musicBtn.classList.add("show");
  }, 1300);
  setTimeout(() => opening.classList.add("done"), 1700);
}, { once: true });

/* Countdown */
const cd = $("#countdown"), soon = $("#soon");
function tick() {
  const diff = Math.max(0, target - Date.now());
  const pad = n => String(n).padStart(2, "0");
  $("#cd-d").textContent = pad(Math.floor(diff / 864e5));
  $("#cd-h").textContent = pad(Math.floor(diff / 36e5) % 24);
  $("#cd-m").textContent = pad(Math.floor(diff / 6e4) % 60);
  $("#cd-s").textContent = pad(Math.floor(diff / 1e3) % 60);
}
if (validDate) { cd.hidden = false; soon.hidden = true; tick(); setInterval(tick, 1000); }

/* Map button */
$("#mapBtn").addEventListener("click", () => window.open(w.mapUrl, "_blank", "noopener"));

/* Scroll reveals */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
}), { threshold: 0.15 });
$$(".reveal,.reveal-left,.reveal-right,.reveal-scale").forEach(el => io.observe(el));

/* Hero: couple layer rises over the names while scrolling */
const coupleLayer = $(".couple-layer");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let busy = false;
  addEventListener("scroll", () => {
    if (busy || scrollY > innerHeight * 1.2) return; busy = true;
    requestAnimationFrame(() => {
      coupleLayer.style.transform = `translate3d(0,${-Math.min(scrollY, innerHeight) * 0.55}px,0)`;
      busy = false;
    });
  }, { passive: true });
}

/* Petals */
(function () {
  const box = $("#petals"), kinds = ["p-ivory", "p-blush", "p-ivory", "p-gold"];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "petal " + kinds[i % 4];
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = 14 + Math.random() * 10 + "s";
    p.style.animationDelay = -Math.random() * 20 + "s";
    p.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
    p.style.setProperty("--rot", (Math.random() * 540 - 270) + "deg");
    box.appendChild(p);
  }
})();

/* Scroll progress bar */
const bar = $("#progress");
addEventListener("scroll", () => {
  bar.style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
}, { passive: true });

/* Add to calendar (.ics) — only when a valid date exists */
if (validDate) {
  const cal = $("#calBtn"); cal.hidden = false;
  cal.addEventListener("click", () => {
    const f = d => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const end = new Date(target.getTime() + 3 * 36e5);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${f(target)}`, `DTEND:${f(end)}`,
      `SUMMARY:Wedding of ${weddingData.groom} & ${weddingData.bride}`, `LOCATION:${[w.venue, w.location].filter(Boolean).join(", ")}`,
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "wedding.ics"; a.click();
  });
}

/* RSVP -> Google Sheet (via Apps Script web app) */
const form = $("#rsvpForm"), msg = $("#rsvpMsg"), rsvpBtn = $("#rsvpBtn"), guestsField = $("#guestsField");
form.addEventListener("change", () => { guestsField.hidden = form.attending.value === "No"; });
form.addEventListener("submit", async e => {
  e.preventDefault();
  msg.className = "rsvp-msg";
  const name = form.name.value.trim();
  if (!name) { msg.textContent = "Please enter your name."; form.name.focus(); return; }
  if (!weddingData.rsvpEndpoint) { msg.textContent = "RSVP is not available right now. Please contact the family."; return; }
  rsvpBtn.disabled = true; rsvpBtn.textContent = "Sending...";
  const attending = form.attending.value;
  const payload = { name, attending, guests: attending === "Yes" ? +form.guests.value : 0, message: form.message.value.trim(), website: form.website.value };
  try {
    await fetch(weddingData.rsvpEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    msg.classList.add("ok");
    msg.textContent = attending === "Yes" ? "Thank you! We can't wait to celebrate with you." : "Thank you for letting us know. You will be missed.";
    form.reset(); guestsField.hidden = false; rsvpBtn.textContent = "RSVP sent";
  } catch (err) {
    msg.textContent = "Could not send. Check your connection and try again.";
    rsvpBtn.disabled = false; rsvpBtn.textContent = "Send RSVP";
  }
});
