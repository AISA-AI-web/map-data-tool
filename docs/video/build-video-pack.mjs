#!/usr/bin/env node
// Builds the NotebookLM "video source pack" for the Teacher MAP Dashboard:
//
//   docs/video/screenshots/NN-name.png        real captures of index.html
//   docs/video/aisa-map-dashboard-video-pack.pdf
//
// The screenshots are taken live from ../../index.html with its own
// "Load Sample Data" demo (fictional AISA Demo School, grades 5-6), so the
// pack cannot drift from the page. The scene text lives in scenes.mjs next to
// this script; brand marks and DM Sans are read from the page itself.
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node docs/video/build-video-pack.mjs
//
// SKIP_CAPTURE=1 rebuilds the PDF from the PNGs already in screenshots/.
// PACK_HTML=1 also writes the PDF's HTML next to it, for checking the text.

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { SCENES, GLOSSARY } from "./scenes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const INDEX = pathToFileURL(path.join(ROOT, "index.html")).href;
const SHOTS_DIR = path.join(HERE, "screenshots");
const OUTPUT = path.join(HERE, "aisa-map-dashboard-video-pack.pdf");
const SKIP_CAPTURE = process.env.SKIP_CAPTURE === "1";

const WIDTH = 1440;          // CSS pixels
const FRAME = 810;           // 16:9 at 1440 wide
const MAX_FRAME = 960;       // the tallest a section picture may be
const VIEW_HEIGHT = 1000;
const DSF = 2;               // captured at 2x ...
const SAVE_SCALE = 0.75;     // ... and saved at 1.5x
const HIDE_STICKY = ".filter-bar,.section-nav,.toast-stack,.support-dock,.back-to-top,.celebrate-layer{display:none!important}";
const HIDE_TOASTS = ".toast-stack,.support-dock,.back-to-top,.celebrate-layer{display:none!important}";

// The fall file a teacher uploads in September, made from the sample the same
// way build-guide.js makes it: blank the end window, drop late joiners.
function baselineFrom(sampleCSV) {
  const lines = sampleCSV.trim().split("\n");
  const header = lines[0].split(",");
  const blank = new Set(["EndTestDate", "EndRIT", "EndRITSEM", "EndPercentile", "EndTestDuration", "ObservedGrowth", "ObservedGrowthSE",
    "GrowthIndex", "MetGrowthProjection?", "ConditionalGrowthIndex", "ConditionalGrowthPercentile",
    "CountofStudentswithGrowthProjectionAvailableandValidBeginningandEndingTermScores", "CountofStudentswhoMetorExceededtheirProjectedGrowth",
    "PercentageofStudentswhoMetorExceededtheirProjectedRIT", "PercentageofProjectedGrowthMet", "MedianConditionalGrowthPercentile",
    "StartGrowthandAchievement", "EndGrowthandAchievement", "ConditionalGrowthPercentileAxis", "AchievementPercentileAxis",
    "GrowthComparisonPeriod", "WIEndTerm"]);
  const fallTerm = new Set(["TermTested", "TermRostered"]);
  const start = header.indexOf("StartRIT");
  const rows = lines.slice(1)
    .map((line) => line.split(","))
    .filter((cells) => start < 0 || cells[start] !== "")
    .map((cells) => {
      header.forEach((name, index) => {
        if (blank.has(name)) cells[index] = "";
        if (fallTerm.has(name)) cells[index] = "Fall 2025";
      });
      return cells.join(",");
    });
  return header.join(",") + "\n" + rows.join("\n") + "\n";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

const F = (slug) => {
  const scene = SCENES.find((s) => s.slug === slug);
  if (!scene) throw new Error("no scene " + slug);
  return scene.file;
};

async function capture(chromium) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  for (const file of fs.readdirSync(SHOTS_DIR)) if (file.endsWith(".png")) fs.unlinkSync(path.join(SHOTS_DIR, file));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
  const errors = [];
  const watch = (page, label) => {
    page.on("pageerror", (error) => errors.push(label + ": " + error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(label + " console: " + message.text()); });
  };

  // A scratch page that shrinks the 2x captures to the saved size.
  const helper = await browser.newPage();
  async function save(file, buffer) {
    const png = await helper.evaluate(async ({ b64, scale }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const g = canvas.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png").split(",")[1];
    }, { b64: buffer.toString("base64"), scale: SAVE_SCALE });
    fs.writeFileSync(path.join(SHOTS_DIR, file), Buffer.from(png, "base64"));
    console.log("  " + file);
  }

  // A composite of several captures on one frame, laid out by the browser.
  async function composite(file, parts, { width = WIDTH, direction = "column", background = "#F2EFFA", ink = "#21076C" } = {}) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: DSF });
    const body = parts.map((part) => '<figure><figcaption>' + escapeHTML(part.label) + '</figcaption><img src="data:image/png;base64,' +
      part.buffer.toString("base64") + '" style="width:' + (part.width || "100%") + '"></figure>').join("");
    await page.setContent('<!doctype html><html><head><style>' + fontCSS + 'body{margin:0;background:' + background + ';font-family:"DM Sans",sans-serif}' +
      '#frame{display:flex;flex-direction:' + direction + ';gap:22px;padding:26px 30px;align-items:' + (direction === "row" ? "flex-start" : "stretch") + ';justify-content:center}' +
      'figure{margin:0}figcaption{font:700 17px "DM Sans",sans-serif;color:' + ink + ';letter-spacing:.02em;margin:0 0 8px}' +
      'img{display:block;border:1px solid #C8BEE8;border-radius:10px;box-shadow:0 2px 10px rgba(33,7,108,.08)}</style></head><body><div id="frame">' + body + '</div></body></html>');
    await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
    await page.evaluate(() => document.fonts.ready);
    await save(file, await page.locator("#frame").screenshot());
    await page.close();
  }

  // A full-width picture of part of the page: from the top of `from` to the
  // bottom of `to` (or `height` pixels), with a margin of page around it.
  // Every frame is 1440 wide, so every frame has the same scale on video.
  async function frame(page, { from, to, height, pad = 16, padBottom = pad, max = MAX_FRAME }) {
    await page.evaluate(({ from, pad }) => {
      document.querySelector(from).scrollIntoView({ block: "start" });
      window.scrollBy(0, -pad);
    }, { from, pad });
    await page.waitForTimeout(350);
    const box = await page.evaluate(({ from, to }) => {
      const a = document.querySelector(from);
      const b = document.querySelector(to || from);
      if (!a || !b) throw new Error("frame: missing " + (a ? to : from));
      return { top: a.getBoundingClientRect().top, bottom: b.getBoundingClientRect().bottom };
    }, { from, to });
    const h = Math.min(max, Math.ceil((height || box.bottom - box.top) + pad + padBottom));
    return page.screenshot({ clip: { x: 0, y: Math.max(0, box.top - pad), width: WIDTH, height: h } });
  }

  async function newContext({ view = "full", theme = "light", width = WIDTH, height = VIEW_HEIGHT, voices = true } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: DSF, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript(({ view, theme, voices }) => {
      // The quiz draws its questions at random. A fixed seed makes every
      // capture show the same question, so the words written for it stay true.
      let seed = 20260926;
      Math.random = () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      try {
        localStorage.setItem("asg-dashboard-preferences", JSON.stringify({ theme, reducedMotion: true, supportPromptOff: true, supportPromptLastShown: 0, view }));
      } catch (error) { /* private mode */ }
      // Headless Chromium has no system voices; a teacher's laptop does. Show
      // the briefing as it looks on a normal device (nothing is spoken here).
      if (voices && window.speechSynthesis) {
        const voice = { name: "System voice", lang: "en-US", default: true, localService: true, voiceURI: "system" };
        try {
          Object.defineProperty(window.speechSynthesis, "getVoices", { value: () => [voice], configurable: true });
          Object.defineProperty(window.speechSynthesis, "speak", { value: () => {}, configurable: true });
        } catch (error) { /* keep the real ones */ }
      }
    }, { view, theme, voices });
    return context;
  }

  async function loadSample(page) {
    await page.click("#sampleBtn");
    await page.waitForFunction(() => document.body.classList.contains("has-data"));
    await page.waitForTimeout(700);
  }

  // The brand font for composites.
  const probe = await browser.newPage();
  await probe.goto(INDEX);
  const fontCSS = await probe.evaluate(() => BRAND_FONT_CSS);
  const sampleCSV = await probe.evaluate(() => SAMPLE_CSV);
  await probe.close();

  // ---- the landing page, before any data ---------------------------------------
  {
    const context = await newContext({ view: "essentials" });
    const page = await context.newPage();
    watch(page, "landing");
    await page.goto(INDEX);
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: HIDE_TOASTS });
    await page.evaluate(() => scrollTo(0, 0));
    const topbarBottom = await page.evaluate(() => document.querySelector(".topbar").getBoundingClientRect().bottom);
    await save(F("landing"), await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: Math.min(FRAME, Math.ceil(topbarBottom)) } }));
    await save(F("getting-started"), await frame(page, { from: "#onboarding" }));
    await page.click("#helpBtn");
    await page.waitForTimeout(300);
    await save(F("export-steps"), await frame(page, { from: "#helpPanel" }));
    await context.close();
  }

  // ---- sample loaded, essentials view -----------------------------------------------
  const context = await newContext({ view: "essentials" });
  const page = await context.newPage();
  watch(page, "growth");
  await page.goto(INDEX);
  await loadSample(page);
  await page.addStyleTag({ content: HIDE_TOASTS });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  const bannerBottom = await page.evaluate(() => document.querySelector("#modeBanner").getBoundingClientRect().bottom);
  await save(F("sample-loaded"), await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: Math.ceil(bannerBottom) + 16 } }));

  // Filters with More filters open, and the Jump to bar as the page opens.
  await page.click("#moreFiltersBtn");
  await page.waitForTimeout(250);
  await save(F("filters-and-jump-to"), await frame(page, { from: ".filter-bar", to: ".section-nav" }));
  await page.click("#moreFiltersBtn");
  await page.waitForTimeout(200);

  const navEssentials = await page.locator(".section-nav").screenshot();
  await page.evaluate(() => document.querySelector("#sec-more").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  const moreFooter = await page.locator("#sec-more").screenshot();
  await page.click(".section-nav-view[data-view='full']");
  await page.waitForTimeout(700);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(200);
  const navFull = await page.locator(".section-nav").screenshot();
  await composite(F("essentials-vs-full"), [
    { label: "Essentials: the page opens on nine sections", buffer: navEssentials },
    { label: "At the foot of the essentials", buffer: moreFooter },
    { label: "Full analysis: every section the file supports, and the way back", buffer: navFull }
  ]);

  // ---- the sections, in page order (full view) ------------------------------------
  await page.addStyleTag({ content: HIDE_STICKY });
  await page.waitForTimeout(300);
  for (const scene of SCENES.filter((s) => s.shot)) {
    const spec = scene.shot;
    if (spec.before) await spec.before(page);
    const buffer = spec.shoot ? await spec.shoot(page) : await frame(page, spec);
    await save(scene.file, buffer);
    if (spec.after) await spec.after(page);
  }

  // ---- a section's ? help panel ---------------------------------------------------
  await page.click(".section-help-btn[data-help='sec-goals']");
  await page.waitForTimeout(250);
  await save(F("section-help"), await frame(page, { from: "#sec-goals", height: FRAME - 32 }));
  await page.click(".section-help-btn[data-help='sec-goals']");

  // ---- a student's spotlight --------------------------------------------------------
  await page.evaluate(() => document.querySelector("#sec-priority").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);
  await page.click("#priorityTable .student-link");
  await page.waitForTimeout(600);
  // The popup itself, with a margin of the dimmed page round it, so its text
  // is as large as the frame allows.
  const pop = await page.evaluate(() => { const b = document.querySelector("#spotlight").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await save(F("student-spotlight"), await page.screenshot({ clip: { x: Math.max(0, pop.x - 24), y: Math.max(0, pop.y - 24), width: pop.w + 48, height: Math.min(900 - Math.max(0, pop.y - 24), pop.h + 48) } }));
  await page.click("#spotlightClose");
  await page.waitForTimeout(300);

  // ---- a printed output: the goal sheets, as the print window shows them ------------
  {
    await page.evaluate(() => document.querySelector("#sec-goals").scrollIntoView({ block: "start" }));
    const [popup] = await Promise.all([page.waitForEvent("popup"), page.click("#printGoalsBtn")]);
    watch(popup, "goal sheets");
    await popup.waitForLoadState("load");
    await popup.setViewportSize({ width: 1440, height: 1100 });
    await popup.evaluate(() => document.fonts.ready);
    await popup.waitForTimeout(600);
    // Page one and page two of the first student's sheets, side by side.
    const pages = await popup.$$("body > *");
    const p1 = await pages[0].screenshot();
    const p2 = await pages[1].screenshot();
    await composite(F("goal-sheet-print"), [
      { label: "Goal sheet, page 1: where I am now", buffer: p1, width: "640px" },
      { label: "Goal sheet, page 2: the student’s own plan", buffer: p2, width: "640px" }
    ], { direction: "row" });
    await popup.close();
  }
  await context.close();

  // ---- the fall (single-window) file ---------------------------------------------------
  {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "video-pack-"));
    const fallFile = path.join(temp, "fall-2025-asg.csv");
    fs.writeFileSync(fallFile, baselineFrom(sampleCSV));
    const ctx = await newContext({ view: "full" });
    const fall = await ctx.newPage();
    watch(fall, "fall");
    await fall.goto(INDEX);
    await fall.setInputFiles("#csvInput", fallFile);
    await fall.waitForFunction(() => document.body.dataset.dataMode === "baseline");
    await fall.waitForTimeout(700);
    await fall.addStyleTag({ content: HIDE_TOASTS });
    await fall.evaluate(() => scrollTo(0, 0));
    await fall.waitForTimeout(300);
    const navBottom = await fall.evaluate(() => document.querySelector(".section-nav").getBoundingClientRect().bottom);
    await save(F("fall-baseline"), await fall.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: Math.ceil(navBottom) + 16 } }));
    await fall.addStyleTag({ content: HIDE_STICKY });
    await save(F("fall-starting-point"), await frame(fall, { from: "#sec-baseline", to: "#normCards" }));
    await ctx.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }

  // ---- dark mode ------------------------------------------------------------------------
  {
    const ctx = await newContext({ view: "full", theme: "dark" });
    const dark = await ctx.newPage();
    watch(dark, "dark");
    await dark.goto(INDEX);
    await loadSample(dark);
    await dark.addStyleTag({ content: HIDE_TOASTS });
    await dark.evaluate(() => scrollTo(0, 0));
    await dark.waitForTimeout(300);
    const top = await dark.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: 330 } });
    await dark.addStyleTag({ content: HIDE_STICKY });
    const insights = await frame(dark, { from: "#sec-insights", to: ".insights-kpis" });
    await composite(F("dark-mode"), [
      { label: "The masthead in dark mode", buffer: top },
      { label: "Insights in dark mode", buffer: insights }
    ], { background: "#15102a", ink: "#D8B664" });
    await ctx.close();
  }

  // ---- phone width --------------------------------------------------------------------------
  {
    const ctx = await newContext({ view: "essentials", width: 390, height: 844 });
    const phone = await ctx.newPage();
    watch(phone, "phone");
    await phone.goto(INDEX);
    await loadSample(phone);
    await phone.addStyleTag({ content: HIDE_TOASTS });
    await phone.evaluate(() => scrollTo(0, 0));
    await phone.waitForTimeout(300);
    const shots = [await phone.screenshot()];
    // Park each section just under the sticky Jump to bar, as a finger would.
    for (const id of ["#sec-insights", "#sec-priority"]) {
      await phone.evaluate((sel) => {
        const nav = document.querySelector(".section-nav");
        const offset = nav ? nav.getBoundingClientRect().height + 12 : 12;
        const top = document.querySelector(sel).getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top - offset);
      }, id);
      await phone.waitForTimeout(400);
      shots.push(await phone.screenshot());
    }
    await composite(F("phone-view"), [
      { label: "Top of the page", buffer: shots[0], width: "360px" },
      { label: "Insights", buffer: shots[1], width: "360px" },
      { label: "Priority Students", buffer: shots[2], width: "360px" }
    ], { direction: "row" });
    await ctx.close();
  }

  // ---- closing: the privacy promise on the upload panel ----------------------------------------
  {
    const ctx = await newContext({ view: "essentials" });
    const land = await ctx.newPage();
    watch(land, "closing");
    await land.goto(INDEX);
    await land.waitForTimeout(400);
    await land.addStyleTag({ content: HIDE_TOASTS });
    // With a margin of the purple masthead round it, so the panel's rounded
    // corners sit on their real background.
    const panel = await land.evaluate(() => { const b = document.querySelector(".upload-panel").getBoundingClientRect(); return { x: b.left, y: b.top + scrollY, w: b.width, h: b.height }; });
    await land.evaluate((y) => scrollTo(0, Math.max(0, y - 40)), panel.y);
    await land.waitForTimeout(200);
    const top = await land.evaluate((y) => y - scrollY, panel.y);
    await save(F("privacy-offline"), await land.screenshot({ clip: { x: panel.x - 20, y: top - 20, width: panel.w + 40, height: panel.h + 40 } }));
    await ctx.close();
  }

  await browser.close();
  return errors;
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

async function build(chromium) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
  const page = await browser.newPage();
  await page.goto(INDEX);
  const brand = await page.evaluate(() => ({ school: BRAND.school, sealReverse: BRAND.sealReverse, fontCSS: BRAND_FONT_CSS }));
  const wordmark = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "brand", "aisa-wordmark.png")).toString("base64");

  // The PDF carries each picture as a JPEG (a fraction of the PNG's size).
  const jpeg = {};
  for (const scene of SCENES) {
    const file = path.join(SHOTS_DIR, scene.file);
    if (!fs.existsSync(file)) throw new Error("missing screenshot " + scene.file + " (run without SKIP_CAPTURE)");
    jpeg[scene.file] = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const g = canvas.getContext("2d");
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, 0, 0);
      return { src: canvas.toDataURL("image/jpeg", 0.86), w: img.naturalWidth, h: img.naturalHeight };
    }, fs.readFileSync(file).toString("base64"));
  }
  await page.close();

  const html = buildHTML({ brand, wordmark, jpeg });
  if (process.env.PACK_HTML === "1") fs.writeFileSync(OUTPUT.replace(/\.pdf$/, ".html"), html);
  const printPage = await browser.newPage();
  await printPage.setContent(html, { waitUntil: "load" });
  await printPage.evaluate(() => document.fonts.ready);
  await printPage.pdf({
    path: OUTPUT,
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: { top: "13mm", bottom: "13mm", left: "13mm", right: "13mm" },
    displayHeaderFooter: true,
    // The running header and footer are drawn apart from the page, so they
    // carry their own copy of the brand font.
    headerTemplate: '<style>' + brand.fontCSS + '</style><div style="font-size:7.5px;color:#555555;width:100%;padding:0 13mm;font-family:\'DM Sans\',sans-serif;display:flex;justify-content:space-between;"><span>AISA Teacher MAP Dashboard — Video source pack</span><span>Demo data is fictional</span></div>',
    footerTemplate: '<style>' + brand.fontCSS + '</style><div style="font-size:7.5px;color:#555555;width:100%;padding:0 13mm;font-family:\'DM Sans\',sans-serif;display:flex;justify-content:space-between;"><span>Your file never leaves your computer.</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
  });
  await browser.close();
}

function buildHTML({ brand, wordmark, jpeg }) {
  const total = SCENES.reduce((sum, scene) => sum + scene.seconds, 0);
  const minutes = (total / 60).toFixed(1);
  const sceneNo = (scene) => String(scene.n).padStart(2, "0");
  const list = (items) => "<ul>" + items.map((item) => "<li>" + item + "</li>").join("") + "</ul>";

  const scenePages = SCENES.map((scene) => {
    const img = jpeg[scene.file];
    // A picture closer to square than a video frame sits beside its text.
    const side = img.w / img.h < 1.45;
    return `<section class="scene${side ? " side" : ""}">
  <header class="scene-head">
    <div><p class="kicker">Scene ${scene.n} of ${SCENES.length} &middot; ${escapeHTML(scene.part)}</p><h2>SCENE ${scene.n} \u2014 ${escapeHTML(scene.title)}</h2></div>
    <div class="shot-id"><strong>Screenshot: ${escapeHTML(scene.file)}</strong><em>Timing: ~${scene.seconds} seconds</em></div>
  </header>
  <div class="scene-body">
    <figure><div class="frame"><img src="${img.src}" alt="${escapeHTML(scene.caption)}"></div><figcaption><strong>Screenshot: ${escapeHTML(scene.file)}</strong> \u2014 ${escapeHTML(scene.caption)}</figcaption></figure>
    <div class="blocks">
      <div class="block"><h3>What is on screen</h3><p>${escapeHTML(scene.onScreen)}</p></div>
      <div class="block"><h3>What it tells a teacher</h3><p>${escapeHTML(scene.tells)}</p></div>
      <div class="block say"><h3>What to say (narration)</h3><p>${escapeHTML(scene.say)}</p></div>
      <div class="block tip"><h3>Teacher action / tip</h3><p>${escapeHTML(scene.tip)}</p><p class="timing">Timing: ~${scene.seconds} seconds</p></div>
    </div>
  </div>
</section>`;
  }).join("\n");

  const indexRows = SCENES.map((scene) => `<tr><td>${sceneNo(scene)}</td><td class="mono">${escapeHTML(scene.file)}</td><td>${escapeHTML(scene.title)}</td><td>${escapeHTML(scene.caption)}</td><td>${scene.seconds}s</td></tr>`).join("");
  const glossary = GLOSSARY.map(([term, text]) => `<dt>${escapeHTML(term)}</dt><dd>${escapeHTML(text)}</dd>`).join("");
  const runOrder = SCENES.map((scene) => `<li><span>${scene.n}</span>${escapeHTML(scene.title)} <em>${escapeHTML(scene.file)} · ~${scene.seconds}s</em></li>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AISA Teacher MAP Dashboard — Video source pack</title>
<style>
${brand.fontCSS}
:root { --purple: #21076C; --gold: #D8B664; --gold-ink: #7A5A12; --wash: #F2EFFA; --line: #C8BEE8; --ink: #1A1A1A; --muted: #555555; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif; color: var(--ink); font-size: 10pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1, h2, h3 { margin: 0; color: var(--purple); line-height: 1.15; }
p { margin: 0 0 6pt; }
ul { margin: 0 0 6pt 14pt; padding: 0; }
li { margin: 0 0 3pt; }
.page { break-after: page; }
.page:last-child { break-after: auto; }
/* Cover */
.cover { height: 183mm; display: grid; grid-template-rows: 1fr auto; gap: 8mm; }
.cover-band { background: var(--purple); color: #fff; border-radius: 10px; border-bottom: 2.2mm solid var(--gold); padding: 14mm 16mm; display: grid; grid-template-columns: 1fr 58mm; gap: 12mm; align-items: center; }
.cover-band .eyebrow { color: var(--gold); font-weight: 700; text-transform: uppercase; font-size: 9.5pt; margin-bottom: 6mm; }
.cover-band h1 { color: #fff; font-size: 34pt; font-weight: 800; }
.cover-band h1 span { display: block; font-size: 21pt; font-weight: 500; margin-top: 4mm; color: #fff; }
.cover-band .purpose { color: #fff; font-size: 11.5pt; max-width: 170mm; margin-top: 9mm; line-height: 1.5; }
.cover-band img { width: 58mm; height: auto; display: block; }
.cover-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; color: var(--muted); font-size: 9.5pt; }
.cover-foot img { height: 14mm; width: auto; }
/* Section pages */
.pg-title { font-size: 20pt; padding-bottom: 5pt; border-bottom: 2px solid var(--gold); margin-bottom: 9pt; }
.cols { display: flex; gap: 9mm; align-items: flex-start; }
.cols > * { flex: 1 1 0; min-width: 0; }
.card { background: var(--wash); border: 1px solid var(--line); border-radius: 8px; padding: 8pt 11pt; margin-bottom: 8pt; break-inside: avoid; }
.card h3 { font-size: 10.5pt; margin-bottom: 4pt; }
.rule { border-left: 4px solid var(--gold); }
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin: 4pt 0 10pt; }
.step { border: 1px solid var(--line); border-radius: 8px; padding: 8pt 10pt; background: #fff; }
.step b { display: inline-grid; place-items: center; width: 20pt; height: 20pt; border-radius: 50%; background: var(--purple); color: #fff; margin-bottom: 4pt; }
.step h3 { font-size: 11pt; margin-bottom: 3pt; }
.modes { display: grid; grid-template-columns: 1fr; gap: 2.5mm; }
.mode { border: 1px solid var(--line); border-left: 4px solid var(--purple); border-radius: 8px; padding: 4pt 10pt; font-size: 9pt; }
.mode p { margin: 0; }
.mode h3 { font-size: 10pt; margin-bottom: 1pt; }
.run { columns: 2; column-gap: 10mm; list-style: none; margin: 6pt 0 0; font-size: 9pt; }
.run li { break-inside: avoid; margin-bottom: 3.2pt; }
.run li span { display: inline-block; min-width: 16pt; font-weight: 800; color: var(--purple); }
.run li em { color: var(--muted); font-style: normal; font-size: 8pt; margin-left: 4pt; }
/* Scene pages: one A4 landscape page each. The picture takes whatever
   height the text leaves, so nothing overflows onto a second page. */
.scene { break-before: page; height: 183mm; display: flex; flex-direction: column; gap: 4pt; }
.scene-head { flex: none; display: flex; justify-content: space-between; align-items: flex-end; gap: 8mm; border-bottom: 2px solid var(--gold); padding-bottom: 4pt; }
.kicker { font-size: 8pt; font-weight: 700; text-transform: uppercase; color: var(--gold-ink); margin: 0 0 1pt; }
.scene-head h2 { font-size: 17pt; }
.shot-id { text-align: right; background: var(--purple); color: #fff; border-radius: 7px; padding: 4pt 9pt; white-space: nowrap; }
.shot-id span { display: block; font-size: 7pt; text-transform: uppercase; color: var(--gold); font-weight: 700; }
.shot-id strong { display: block; font-size: 11pt; }
.shot-id em { display: block; font-size: 7.5pt; font-style: normal; color: #fff; }
.scene-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 5pt; }
.scene-body figure { flex: 1; min-height: 0; margin: 0; display: flex; flex-direction: column; }
.frame { flex: 1; min-height: 0; position: relative; }
.frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center; }
.scene-body figcaption { flex: none; font-size: 7.6pt; color: var(--muted); margin-top: 3pt; text-align: center; }
.scene-body figcaption strong { color: var(--purple); }
.blocks { flex: none; display: grid; grid-template-columns: 1.25fr 0.9fr 1.35fr 0.9fr; gap: 3.5mm; align-items: stretch; }
.block { background: var(--wash); border: 1px solid var(--line); border-radius: 7px; padding: 5pt 7pt; font-size: 7.9pt; line-height: 1.36; }
.block h3 { font-size: 7.2pt; text-transform: uppercase; margin-bottom: 2.5pt; }
.block p { margin: 0; }
.block.say { background: #fff; border: 1.5px solid var(--purple); font-size: 8.4pt; }
.block.tip { border-left: 4px solid var(--gold); }
.block .timing { margin-top: 5pt; font-weight: 700; color: var(--gold-ink); }
/* A picture closer to square than a video frame sits beside its text. */
.scene.side .scene-body { flex-direction: row; }
.scene.side figure { flex: 1.3; }
.scene.side .blocks { flex: 1; grid-template-columns: 1fr; align-content: start; }
/* Reference pages */
dl { margin: 0; columns: 2; column-gap: 9mm; }
dt { font-weight: 800; color: var(--purple); margin-top: 5pt; break-after: avoid; }
dd { margin: 1pt 0 0; break-inside: avoid; font-size: 9pt; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; }
th, td { text-align: left; padding: 3pt 5pt; border-bottom: 1px solid var(--line); vertical-align: top; }
th { background: var(--wash); color: var(--purple); text-transform: uppercase; font-size: 7.4pt; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
.mono { font-weight: 700; color: var(--purple); white-space: nowrap; }
.band { display: inline-block; padding: 0 5pt; border-radius: 3px; font-weight: 700; font-size: 8pt; }
</style></head><body>

<div class="page cover">
  <div class="cover-band">
    <div>
      <p class="eyebrow">American International School in Abu Dhabi</p>
      <h1>Teacher MAP Dashboard<span>Video source pack</span></h1>
      <p class="purpose">This document is the source for a short explainer video for AISA teachers. It walks through the Teacher MAP Dashboard scene by scene: a real screenshot of the page for each scene, what is on screen, what it means for a teacher, and a ready-to-speak narration. The dashboard is a free, single web page that turns a teacher’s NWEA MAP Growth exports into a classroom planning view — who grew, who needs support, how to group the class, what to say at a data meeting and what to put on the wall — without the file ever leaving the teacher’s computer.</p>
    </div>
    <img src="${brand.sealReverse}" alt="AISA seal">
  </div>
  <div class="cover-foot">
    <div>
      <p><strong>${SCENES.length} scenes · about ${minutes} minutes of narration.</strong> Every screenshot was captured from the dashboard itself using its built-in <em>Load Sample Data</em> demo: a fictional cohort of 90 grade 5 and 6 students in four classes at “AISA Demo School”, tested Fall 2025 and Spring 2026. No real student appears anywhere in this pack.</p>
    </div>
    <img src="${wordmark}" alt="${escapeHTML(brand.school)}">
  </div>
</div>

<div class="page">
  <h1 class="pg-title">How to use this document (for NotebookLM)</h1>
  <div class="cols">
    <div>
      <div class="card rule"><h3>The video follows the scenes in order</h3>
      <p>This pack is a storyboard. It contains ${SCENES.length} numbered scenes, one per page, starting on page 5. Make the video in exactly that order, from Scene 1 to Scene ${SCENES.length}.</p></div>
      <div class="card rule"><h3>Each scene has one screenshot, identified by its file name</h3>
      <p>At the top right of every scene page is a purple label, for example <strong>Screenshot: ${escapeHTML(SCENES.find((scene) => scene.slug === "insights").file)}</strong>. The large picture on that page is that screenshot. While a scene is being narrated, show <strong>only that scene’s screenshot</strong>; switch to the next picture when the next scene begins. The picture of a scene always sits on the same page as its narration, and the Screenshot index at the end lists every ID.</p></div>
      <div class="card rule"><h3>Narrate from “What to say”</h3>
      <p>The block headed <strong>What to say (narration)</strong> is the script for that scene. “What is on screen” tells you which parts of the picture the narration refers to (so you can zoom or highlight them); “What it tells a teacher” and “Teacher action / tip” give the meaning and the practical takeaway, which you may weave in. “Timing” is the approximate length of that scene.</p></div>
    </div>
    <div>
      <div class="card"><h3>Tone and length</h3>
      <p>Warm, practical, teacher-to-teacher: a colleague showing another colleague a tool that saves them time, not a sales pitch and not a statistics lecture. Target total length <strong>6 to 8 minutes</strong> (the scene timings add up to about ${minutes} minutes). If time is short, shorten the full-analysis scenes (marked “Full analysis”) rather than the opening, the essentials or the close.</p></div>
      <div class="card"><h3>The privacy message is essential</h3>
      <p>Say clearly, near the start and again at the end: <strong>the teacher’s file never leaves their computer.</strong> The page reads it in the browser, sends nothing anywhere, loads nothing from the internet, needs no sign-in, works offline, and forgets the file when the tab closes. Nothing it remembers names a student.</p></div>
      <div class="card"><h3>Stay accurate</h3>
      <p>Do not invent features, buttons, numbers or claims that are not on these pages. Numbers quoted in the scenes come from the screenshots and are <strong>demo data</strong>: the sample school, classes (5A, 5B, 6A, 6B), teachers and students are fictional. Present them as “in the sample”, never as real results. The dashboard describes what the data shows; it never claims to explain why.</p></div>
      <div class="card"><h3>Audience</h3>
      <p>Classroom teachers at AISA who give the NWEA MAP Growth test, plus coordinators and leaders. Assume they know what MAP is but not every statistic; the Glossary near the end explains the terms.</p></div>
    </div>
  </div>
</div>

<div class="page">
  <h1 class="pg-title">The tool in one page</h1>
  <p style="font-size:10.5pt"><strong>What it is.</strong> The AISA Teacher MAP Dashboard is one web page (a single file, <em>index.html</em>). A teacher opens it in any modern browser, loads the CSV files exported from NWEA MAP Growth, and the page instantly builds about 25 planning sections from them: headline insights, growth and achievement, movement between colour bands, gap closure, growth goals, a weekly action board, priority and celebration lists, table groups with a seating planner, classroom wall posters, a quiz to rehearse for data meetings, and more. <strong>Who it is for:</strong> classroom teachers first, and coordinators and leaders preparing data conversations.</p>
  <div class="steps">
    <div class="step"><b>1</b><h3>Export from NWEA</h3><p>In MAP Growth, open MAP Reports and download the <em>Achievement Status and Growth (ASG)</em> report as CSV (it carries growth), and the <em>Class Profile</em> report as CSV, once per subject (it carries the instructional areas). Same class, same term.</p></div>
    <div class="step"><b>2</b><h3>Upload</h3><p>Drag all the files onto the upload box at once, or click to browse. The page reads them in the browser, matches the columns automatically and folds each student’s records together. <em>Load Sample Data</em> shows everything with a fictional class first.</p></div>
    <div class="step"><b>3</b><h3>Plan</h3><p>Read the essentials, filter to a class or subject, then act: print goal sheets, build table groups and a seating plan, copy the summary into PLC notes, print student-friendly wall posters, and rehearse for the data meeting.</p></div>
  </div>
  <div class="cols">
    <div class="card"><h3>The promises</h3>
      ${list([
        "<strong>Private.</strong> The file is read in the browser and never uploaded. There is no server, no analytics, and the page makes no network request of its own.",
        "<strong>Offline.</strong> Scripts, styles, the DM Sans typeface and the AISA marks are all inside the one file, so it works without internet and behind a school filter.",
        "<strong>No sign-in, no setup.</strong> Open the page and drop the file.",
        "<strong>Free.</strong> Built for AISA teachers.",
        "<strong>Nothing remembered names a student.</strong> Only preferences (theme, motion, view, chart settings, the room shape of the seating planner) are kept on the device."
      ])}
    </div>
    <div>
      <h3 style="font-size:11pt;margin-bottom:5pt">Three data modes — the page adapts to the file</h3>
      <div class="modes">
        <div class="mode"><h3>Growth file</h3><p>Two test windows (e.g. Fall to Spring) on most records. Everything is measured: growth, gap closure, quadrant movement.</p></div>
        <div class="mode"><h3>Mixed file</h3><p>A growth file where a meaningful share of records has only the current window (often late joiners). Growth panels describe the records that have a prior score.</p></div>
        <div class="mode"><h3>Fall baseline</h3><p>One window only, as in September. Growth panels are hidden rather than shown empty; a start-of-year view (Starting Point, tiers, norm placement, targets) takes their place.</p></div>
      </div>
      <p style="margin-top:8pt;font-size:9pt;color:var(--muted)">The page opens on nine <strong>essentials</strong> (Spoken Briefing, Insights, Class Snapshot, Growth and Achievement, Growth Goals, Action Board, Priority Students, Wall Posters, Check My Understanding); <em>More analysis</em> reveals the rest, and every section follows the filters.</p>
    </div>
  </div>
</div>

<div class="page">
  <h1 class="pg-title">Run order at a glance</h1>
  <p>The ${SCENES.length} scenes in the order the video plays them, with each scene\u2019s screenshot file and approximate narration time (about ${minutes} minutes in all). One page per scene follows.</p>
  <ol class="run">${runOrder}</ol>
</div>

${scenePages}

<div class="page" style="break-before:page">
  <h1 class="pg-title">Glossary</h1>
  <dl>${glossary}</dl>
</div>

<div class="page" style="break-before:page">
  <h1 class="pg-title">Screenshot index</h1>
  <table><thead><tr><th>ID</th><th>File name</th><th>Scene</th><th>What the screenshot shows</th><th>Time</th></tr></thead><tbody>${indexRows}</tbody></table>
  <p style="margin-top:6pt;font-size:8.5pt;color:var(--muted)">All screenshots are real captures of the dashboard (light theme unless stated, 1440-pixel-wide window) showing the fictional sample data. Total narration about ${minutes} minutes.</p>
</div>

</body></html>`;
}

// ---------------------------------------------------------------------------

async function main() {
  const modulePath = process.env.PLAYWRIGHT_MODULE;
  const { chromium } = modulePath ? await import(pathToFileURL(path.resolve(modulePath)).href) : await import("playwright");
  if (!SKIP_CAPTURE) {
    console.log("capturing from " + INDEX);
    const errors = await capture(chromium);
    if (errors.length) {
      console.error("page errors while capturing:\n" + errors.join("\n"));
      process.exit(1);
    }
    console.log("capture: zero page errors");
  }
  await build(chromium);
  const size = fs.statSync(OUTPUT).size;
  console.log("wrote " + path.relative(ROOT, OUTPUT) + " (" + (size / 1048576).toFixed(1) + " MB)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
