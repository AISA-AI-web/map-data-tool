#!/usr/bin/env node
// Builds teacher-dashboard-guide.pdf from the dashboard itself.
//
// The section titles and the "what it shows / how to read it / what to do
// with it" text come straight out of index.html (SECTION_PLAN and
// SECTION_HELP), and every picture is the page rendered with its own sample
// data, so the guide cannot drift from the app it describes.
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node build-guide.js
//
// Needs Node and Playwright with a Chromium build. PLAYWRIGHT_MODULE points
// at Playwright's index.mjs, as for check-planner.mjs; without it the script
// falls back to require("playwright") (set NODE_PATH for a global install).
// Set PLAYWRIGHT_CHROMIUM to point at a specific Chromium binary.
//
// Paths are resolved from this script's directory. GUIDE_INDEX and
// GUIDE_OUTPUT override the page and the PDF, GUIDE_TITLE the running header,
// and GUIDE_HTML writes the guide's HTML as well, for checking the text
// without opening the PDF.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = __dirname;
const INDEX = pathToFileURL(path.resolve(ROOT, process.env.GUIDE_INDEX || "index.html")).href;
const OUTPUT = path.resolve(ROOT, process.env.GUIDE_OUTPUT || "teacher-dashboard-guide.pdf");
const TITLE = process.env.GUIDE_TITLE || "Teacher MAP Dashboard | AISA";
const HTML_OUT = process.env.GUIDE_HTML ? path.resolve(ROOT, process.env.GUIDE_HTML) : null;

async function loadChromium() {
  if (process.env.PLAYWRIGHT_MODULE) {
    return (await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href)).chromium;
  }
  return require("playwright").chromium;
}

const HIDE_STICKY = ".filter-bar,.section-nav,.toast-stack,.support-dock,.back-to-top,.celebrate-layer{display:none!important}";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// A section taller than about two screens is photographed from the top down
// to at most a fixed depth: a picture of a whole 200-row table teaches
// nothing at page width, and the caption says the picture is the top of the
// section.
const MAX_SHOT_HEIGHT = 1500;

// Where to stop a picture of a tall section. Runs in the page. A cut at a
// fixed depth lands wherever it lands - through a chart, a table row, a line
// of text or a KPI tile - so the cut is moved up to the end of the last whole
// thing above that depth: a card, a tile, a paragraph, a list item, a table.
// Nothing small or textual may be cut through (a chart, an image, a row, a
// line, a tile, a button); a tall card may be when nothing better exists, and
// the fewer of those a cut crosses the better. A cut never ends on a heading,
// a lead-in or a row of controls, so a picture does not stop on a title with
// nothing under it. Returns the height of the picture in CSS pixels.
function cleanCut({ selector, limit }) {
  const root = document.querySelector(selector);
  const top = root.getBoundingClientRect().top;
  const hardTags = new Set(["svg", "img", "canvas", "tr", "thead", "p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "button", "select", "input", "textarea", "label", "summary", "figure"]);
  const endTags = new Set(["p", "table", "ul", "ol", "li", "figure", "svg", "article", "section", "details"]);
  const introClass = /(title|heading|label|eyebrow|lead|hint|intro|legend|caption)/i;
  const controls = "button, select, input, label, summary, [role='tablist'], .btn-row, .viz-controls, .viz-seg";
  const lexLess = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  // What is actually drawn: the contents of a closed <details> and the rows
  // scrolled out of sight inside a scroll box still have boxes, but they are
  // not in the picture and cannot be cut through.
  const clipCache = new Map();
  const visibleSpan = (el) => {
    let t = -Infinity;
    let b = Infinity;
    for (let node = el.parentElement; node && node !== root.parentElement; node = node.parentElement) {
      if (!clipCache.has(node)) {
        const style = getComputedStyle(node);
        const clips = style.overflowY !== "visible" || style.overflowX !== "visible";
        const rect = node.getBoundingClientRect();
        clipCache.set(node, clips ? [rect.top, rect.bottom] : null);
      }
      const span = clipCache.get(node);
      if (span) { t = Math.max(t, span[0]); b = Math.min(b, span[1]); }
    }
    return [t, b];
  };
  const items = [];
  for (const el of root.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    if (tag !== "svg" && el.closest("svg")) continue;
    const closed = el.closest("details:not([open])");
    if (closed && closed !== el && !el.closest("summary")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.height < 1 || rect.width < 1) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.position === "fixed") continue;
    const [clipTop, clipBottom] = visibleSpan(el);
    const t = Math.max(rect.top, clipTop) - top;
    const b = Math.min(rect.bottom, clipBottom) - top;
    if (b - t < 1) continue;
    const leaf = ![...el.children].some((child) => child.getBoundingClientRect().height > 0);
    const boxy = (style.borderTopStyle !== "none" && parseFloat(style.borderTopWidth) > 0) ||
      style.backgroundColor !== "rgba(0, 0, 0, 0)" || style.boxShadow !== "none";
    const hard = hardTags.has(tag) || leaf || (boxy && rect.height <= limit * 0.4);
    const className = el.getAttribute("class") || "";
    const isEnd = (endTags.has(tag) || boxy) && !/^h[1-6]$/.test(tag) &&
      !introClass.test(className) && !el.closest(controls);
    items.push({ t, b, hard, soft: !hard && boxy, isEnd });
  }
  let best = null;
  for (const item of items) {
    if (!item.isEnd) continue;
    // Leave a little air under the last thing kept, if there is room for it.
    for (const pad of [10, 4, 0]) {
      const y = item.b + pad;
      if (y > limit) continue;
      let crossed = 0;
      let clean = true;
      for (const other of items) {
        if (other.t < y - 0.5 && other.b > y + 0.5) {
          if (other.hard) { clean = false; break; }
          if (other.soft) crossed++;
        }
      }
      if (!clean) continue;
      // Prefer a cut that crosses nothing, as long as it keeps a fair share
      // of the depth; otherwise the fewest cards crossed, then the deepest.
      const shallow = y < limit * 0.45 ? 1 : 0;
      const rank = [shallow, crossed, -y];
      if (!best || lexLess(rank, best.rank)) best = { y, rank };
      break;
    }
  }
  return Math.ceil(best ? best.y : limit);
}

// A picture of a section, or of one block in it. `pad` adds a margin of the
// page around a block that has no card edge of its own, so its first line
// does not sit on the picture's border.
async function shot(page, selector, { pad = 0 } = {}) {
  const node = await page.$(selector);
  if (!node) return null;
  await node.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const box = await node.boundingBox();
  if (!box) return null;
  const tall = box.height > MAX_SHOT_HEIGHT;
  if (!tall && !pad) {
    const buffer = await node.screenshot({ type: "jpeg", quality: 80 });
    return { src: "data:image/jpeg;base64," + buffer.toString("base64"), clipped: false };
  }
  if (tall) {
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "start" }), selector);
    await page.waitForTimeout(150);
  }
  const height = tall ? await page.evaluate(cleanCut, { selector, limit: MAX_SHOT_HEIGHT }) : box.height;
  // Without fullPage a clip stops at the bottom of the window, which cut
  // every tall section at about 900 pixels; with it the clip is measured
  // from the top of the document.
  const fresh = await node.boundingBox();
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 80,
    fullPage: true,
    clip: { x: fresh.x + scroll.x - pad, y: fresh.y + scroll.y - pad, width: fresh.width + pad * 2, height: height + pad * 2 }
  });
  return { src: "data:image/jpeg;base64," + buffer.toString("base64"), clipped: tall };
}

// The sample file is a growth export. Blanking its end window turns it into
// the fall file a teacher uploads in September, which is the other mode the
// guide has to show. A student with no fall score joined later in the year
// and would not be in a fall export at all, so that row is left out.
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

// The part of a section that a picture of its top leaves out, when that part
// is what the section is for: Movement's dumbbell chart sits under the
// transition matrix, and the Heatmap's student-by-area grid under the group
// grid. Each is pictured on its own, after the section's text.
const EXTRA_SHOTS = {
  "sec-movement": { selector: "#movementDumbbell", caption: "Further down Movement: every record's percentile change as a dumbbell, from the start percentile (hollow dot) to the end percentile (filled dot)." },
  "sec-heatmap": { selector: "#heatmapAreas", pad: 16, caption: "Further down the Heatmap: every student's instructional areas against their own overall RIT, which appears when a Class Profile export is loaded." }
};

async function main() {
  const chromium = await loadChromium();
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", colorScheme: "light" });
  await context.addInitScript(() => {
    try {
      // The page opens on the essentials; the guide photographs every section.
      localStorage.setItem("asg-dashboard-preferences", JSON.stringify({ theme: "light", reducedMotion: true, supportPromptOff: true, supportPromptLastShown: 0, view: "full" }));
    } catch (error) { /* private mode */ }
  });
  const page = await context.newPage();
  await page.goto(INDEX);
  await page.click("#sampleBtn");
  await page.waitForFunction(() => document.body.classList.contains("has-data"));
  await page.waitForTimeout(400);

  // ---- text straight from the page ---------------------------------------
  const data = await page.evaluate(() => ({
    sections: SECTION_PLAN.map((section) => ({
      id: section.id,
      label: section.label,
      modes: section.modes,
      growthTitle: (document.querySelector("#" + section.id + " .section-header h2") || {}).textContent || section.label,
      help: SECTION_HELP[section.id] || null
    })),
    bands: BANDS.map((band) => ({ name: band.name, min: band.min, max: band.max })),
    tiers: ACHIEVEMENT_TIERS.map((tier) => ({ name: tier.name, label: tier.tierLabel, blurb: tier.blurb })),
    groups: GROUP_ACTIONS,
    notes: METHOD_NOTES,
    minShare: MIN_SHARE_N,
    secure: SECURE_BENCHMARK,
    posterMin: POSTER_MIN_STUDENTS,
    posters: POSTERS.map((poster) => ({ id: poster.id, title: poster.title, blurb: poster.blurb })),
    sample: SAMPLE_CSV,
    essentials: [...ESSENTIAL_SECTIONS],
    // The guide wears the page's own brand: its wordmark and its DM Sans,
    // read from the page so the two can never disagree.
    brand: { school: BRAND.school, wordmarkReverse: BRAND.wordmarkReverse, sealReverse: BRAND.sealReverse, fontCSS: BRAND_FONT_CSS }
  }));

  // ---- pictures: growth mode --------------------------------------------
  const pictures = {};
  pictures.topbar = await shot(page, ".topbar");
  pictures.filters = await shot(page, ".filter-bar");
  pictures.banner = await shot(page, "#modeBanner");
  await page.addStyleTag({ content: HIDE_STICKY });
  for (const section of data.sections) {
    const visible = await page.evaluate((id) => { const node = document.getElementById(id); return Boolean(node && !node.hidden); }, section.id);
    if (!visible) continue;
    if (section.id === "sec-quiz") {
      await page.click("[data-quiz-action='start']");
      await page.waitForTimeout(150);
      const wrong = await page.evaluate(() => (state.quiz.questions[0].answer + 1) % state.quiz.questions[0].options.length);
      await page.click("[data-quiz-answer='" + wrong + "']");
      await page.waitForTimeout(150);
    }
    if (section.id === "sec-snapshot") {
      await page.click(".section-help-btn[data-help='sec-snapshot']");
      await page.waitForTimeout(100);
    }
    pictures[section.id] = await shot(page, "#" + section.id);
    const extra = EXTRA_SHOTS[section.id];
    if (extra) {
      const picture = await shot(page, extra.selector, { pad: extra.pad || 0 });
      if (picture) pictures[section.id + ":extra"] = Object.assign(picture, { caption: extra.caption });
    }
    if (section.id === "sec-snapshot") await page.click(".section-help-btn[data-help='sec-snapshot']");
  }

  // ---- pictures: a fall file ----------------------------------------------
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "map-guide-"));
  const fallFile = path.join(tempDir, "sample-fall.csv");
  fs.writeFileSync(fallFile, baselineFrom(data.sample));
  await page.setInputFiles("#csvInput", fallFile);
  await page.waitForFunction(() => document.body.dataset.dataMode === "baseline");
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: HIDE_STICKY });
  pictures.baselineBanner = await shot(page, "#modeBanner");
  pictures.baselineSection = await shot(page, "#sec-baseline");
  pictures.baselinePriority = await shot(page, "#sec-priority");
  const baselineTitles = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll("main .section")].map((node) => [node.id, (node.querySelector(".section-header h2") || {}).textContent || ""])
  ));
  await browser.close();

  // ---- the document --------------------------------------------------------
  const html = buildHTML(data, pictures, baselineTitles);
  if (HTML_OUT) fs.writeFileSync(HTML_OUT, html);
  const printer = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
  const printPage = await printer.newPage();
  await printPage.setContent(html, { waitUntil: "load" });
  await printPage.pdf({
    path: OUTPUT,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#555555;width:100%;padding:0 16mm;font-family:DM Sans,ui-sans-serif,system-ui,sans-serif;">' + escapeHTML(TITLE) + ' - User guide</div>',
    footerTemplate: '<div style="font-size:8px;color:#555555;width:100%;padding:0 16mm;font-family:DM Sans,ui-sans-serif,system-ui,sans-serif;display:flex;justify-content:space-between;"><span>Your file never leaves your computer.</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
  });
  await printer.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  const size = fs.statSync(OUTPUT).size;
  console.log("wrote " + path.relative(ROOT, OUTPUT) + " (" + Math.round(size / 1024) + " KB)");
}

function figure(picture, caption, clippedNote) {
  if (!picture) return "";
  const text = (caption || "") + (picture.clipped ? " " + (clippedNote || "(The top of the section; it continues below on screen.)") : "");
  return '<figure><img src="' + picture.src + '" alt="">' + (text ? "<figcaption>" + escapeHTML(text) + "</figcaption>" : "") + "</figure>";
}

function paragraphs(text) {
  return String(text).split(/\n\n+/).map((part) => "<p>" + escapeHTML(part) + "</p>").join("");
}

function buildHTML(data, pictures, baselineTitles) {
  const bySection = Object.fromEntries(data.sections.map((section) => [section.id, section]));
  const chapterOrder = data.sections.filter((section) => section.help);
  const essentials = new Set(data.essentials);
  const sectionChapters = chapterOrder.map((section, index) => {
    const help = section.help;
    const baselineTitle = baselineTitles[section.id];
    const baselineOnly = !section.modes.includes("growth");
    const growthOnly = !section.modes.includes("baseline");
    const titleLine = baselineTitle && baselineTitle !== section.growthTitle
      ? section.growthTitle + " (called " + baselineTitle + " on a single-window file)"
      : section.growthTitle;
    return '<section class="section-chapter">' +
      '<div class="keep">' +
      "<h3>5." + (index + 1) + " " + escapeHTML(titleLine) + "</h3>" +
      (essentials.has(section.id)
        ? '<p class="view-tag"><span>Essentials</span>On the page as it opens.</p>'
        : '<p class="view-tag"><span>Full analysis</span>Choose <em>More analysis</em> in the Jump to bar to show it.</p>') +
      (growthOnly ? '<p class="note">Growth files only: this section is hidden when the export carries a single test window.</p>' : "") +
      (baselineOnly ? '<p class="note">Single-window files only.</p>' : "") +
      (section.id === "sec-strands" ? '<p class="note">Class Profile exports only: an ASG export does not carry instructional areas, so this section appears only when a Class Profile file is loaded.</p>' : "") +
      figure(pictures[section.id], section.growthTitle + ", shown with the sample data.") +
      "</div>" +
      '<div class="triple">' +
      '<div class="answer"><h4>What it shows</h4><div>' + paragraphs(help.what) + "</div></div>" +
      '<div class="answer"><h4>How to read it</h4><div>' + paragraphs(help.read) + "</div></div>" +
      '<div class="answer"><h4>What to do with it</h4><div>' + paragraphs(help.act) + "</div></div>" +
      "</div>" +
      (help.baseline ? '<div class="baseline-box"><h4>On a single-window file</h4>' +
        (help.baseline.what ? paragraphs(help.baseline.what) : "") +
        (help.baseline.read ? paragraphs(help.baseline.read) : "") +
        (help.baseline.act ? paragraphs(help.baseline.act) : "") + "</div>" : "") +
      (section.id === "sec-baseline" ? figure(pictures.baselineSection, "The same section on a fall file, where it is called Starting Point.") : "") +
      (section.id === "sec-priority" ? figure(pictures.baselinePriority, "On a fall file the list becomes the Start-of-Year Support List, with start-of-year reasons.") : "") +
      (pictures[section.id + ":extra"] ? figure(pictures[section.id + ":extra"], pictures[section.id + ":extra"].caption, "(The top of it; it continues below on screen.)") : "") +
      "</section>";
  }).join("");

  const bandRows = data.bands.map((band) => "<tr><td>" + escapeHTML(band.name) + "</td><td>" + band.min + " to " + band.max + "</td></tr>").join("");
  const tierRows = data.tiers.map((tier) => "<tr><td>" + escapeHTML(tier.name) + "</td><td>" + escapeHTML(tier.label) + "</td><td>" + escapeHTML(tier.blurb) + "</td></tr>").join("");
  const groupRows = Object.entries(data.groups).map(([group, action]) => "<tr><td>" + escapeHTML(group) + "</td><td>" + escapeHTML(action) + "</td></tr>").join("");
  const posterRows = data.posters.map((poster) => "<tr><td>" + escapeHTML(poster.title) + "</td><td>" + escapeHTML(poster.blurb) + "</td></tr>").join("");
  const contents = [
    ["1", "What this tool is, and what it never does"],
    ["2", "Getting your files out of NWEA MAP"],
    ["3", "Loading a file and choosing what you look at"],
    ["4", "Reading the numbers"],
    ["5", "The sections, one by one"],
    ["6", "Printing, exporting and the classroom wall"],
    ["7", "Before a data meeting"],
    ["8", "When something looks wrong"],
    ["A", "Glossary and reference tables"]
  ].map(([number, title]) => "<li><span>" + number + "</span>" + escapeHTML(title) + "</li>").join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHTML(TITLE)} - User guide</title>
<style>
  ${data.brand.fontCSS}
  /* The AISA palette: purple for structure, gold for the accent, the purple
     tint as the only off-white, and the gold ink wherever gold is read. */
  :root { --ink: #1A1A1A; --muted: #555555; --brand: #21076C; --brand-deep: #21076C; --gold: #D8B664; --gold-ink: #7A5A12; --wash: #F2EFFA; --line: #C8BEE8; --border: #C8BEE8; }
  * { box-sizing: border-box; }
  body { font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.5; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, h2, h3, h4 { margin: 0; line-height: 1.2; letter-spacing: -0.01em; }
  h2 { font-size: 20pt; color: var(--brand-deep); margin: 0 0 10pt; padding-bottom: 6pt; border-bottom: 1px solid var(--border); break-after: avoid; }
  h3 { font-size: 13.5pt; margin: 16pt 0 6pt; color: var(--brand-deep); break-after: avoid; }
  h4 { font-size: 8.5pt; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--brand-deep); margin: 0 0 3pt; }
  p { margin: 0 0 7pt; }
  ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
  li { margin-bottom: 3pt; }
  .chapter { break-before: page; }
  .cover { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; }
  /* The cover is the AISA cover: a purple block with the wordmark, a gold
     eyebrow and a white title, ruled off in gold. */
  .cover-band { background: var(--brand); color: #ffffff; border-radius: 8px; padding: 12mm 12mm 14mm; border-bottom: 2mm solid var(--gold); position: relative; }
  .cover-band .cover-seal { position: absolute; right: 12mm; bottom: 14mm; height: 40mm; width: auto; margin: 0; }
  .cover-band img { display: block; height: 13mm; width: auto; margin-bottom: 22mm; }
  .cover .eyebrow { color: var(--gold); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-size: 9pt; margin: 0; }
  .cover h1 { font-size: 34pt; color: #ffffff; margin: 6pt 0 0; }
  .cover .lede { font-size: 13pt; color: var(--muted); max-width: 130mm; margin-top: 12mm; }
  .cover .meta { color: var(--muted); font-size: 9.5pt; }
  .contents { break-before: page; }
  .contents ol { list-style: none; margin: 0; }
  .contents li { display: flex; gap: 10pt; padding: 6pt 0; border-bottom: 1px solid var(--line); font-size: 12pt; }
  .contents li span { color: var(--gold-ink); font-weight: 700; min-width: 18pt; }
  figure { margin: 8pt 0 10pt; break-inside: avoid; }
  figure img { display: block; max-width: 100%; max-height: 190mm; width: auto; margin: 0 auto; border: 1px solid var(--line); border-radius: 4pt; }
  .keep { break-inside: avoid; }
  figcaption { font-size: 8.5pt; color: var(--muted); margin-top: 3pt; }
  /* The three answers stacked, each a full-width row with its eyebrow in a
     left column: three narrow columns made one tall block that would not
     split, and pushed it whole onto the next page. A row can move on its own. */
  .triple { margin: 4pt 0 8pt; }
  .answer { display: grid; grid-template-columns: 38mm 1fr; gap: 8pt; background: var(--wash); border: 1px solid var(--border); border-radius: 6pt; padding: 7pt 10pt; margin-bottom: 5pt; font-size: 9.5pt; break-inside: avoid; }
  .answer h4 { margin-top: 2pt; }
  .answer p:last-child { margin-bottom: 0; }
  /* The single-window variant of a section: white, ruled in purple, so it
     reads as a different case from the tinted three-part answer above it. */
  .baseline-box { border: 1px solid var(--border); border-left: 4px solid var(--brand); border-radius: 6pt; background: #ffffff; padding: 7pt 10pt; margin: 0 0 10pt; font-size: 9.5pt; break-inside: avoid; }
  .baseline-box p:last-child { margin-bottom: 0; }
  .note { font-size: 9.5pt; color: var(--muted); font-style: italic; }
  .view-tag { font-size: 9pt; color: var(--muted); margin: 0 0 4pt; }
  .view-tag span { color: var(--gold-ink); font-weight: 700; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; margin-right: 6pt; }
  .callout { border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 6pt; padding: 8pt 10pt; margin: 8pt 0 10pt; background: var(--wash); break-inside: avoid; }
  .callout p:last-child { margin-bottom: 0; }
  .callout.good { border-left-color: var(--brand); }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; font-size: 9.5pt; break-inside: auto; }
  th, td { text-align: left; padding: 5pt 7pt; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { background: var(--wash); color: var(--brand-deep); font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.05em; }
  tr { break-inside: avoid; }
  .section-chapter { break-inside: auto; margin-bottom: 8pt; }
  .section-chapter h3 { margin-top: 18pt; }
  dl { margin: 0 0 10pt; }
  dt { font-weight: 800; margin-top: 6pt; }
  dd { margin: 1pt 0 0 0; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
</style></head><body>

<div class="cover">
  <div>
    <div class="cover-band">
      <img src="${data.brand.wordmarkReverse}" alt="${escapeHTML(data.brand.school)}">
      <p class="eyebrow">${escapeHTML(TITLE)}</p>
      <h1>User guide</h1>
      <img class="cover-seal" src="${data.brand.sealReverse}" alt="">
    </div>
    <p class="lede">How to get your files out of NWEA, what every number means, what each section of the dashboard tells you, and what to do about it before the next data conversation.</p>
  </div>
  <div class="meta">
    <p>Built from the dashboard itself, using its own sample data, so the pictures and the section text are the same ones you see on screen. Every section on the page also carries a <strong>?</strong> in its corner that says the same in three short answers.</p>
    <p>Your file never leaves your computer. The dashboard reads it in your browser, loads nothing from the internet, and stores nothing about your students.</p>
  </div>
</div>

<div class="contents">
  <h2>Contents</h2>
  <ol>${contents}</ol>
</div>

<div class="chapter">
  <h2>1. What this tool is, and what it never does</h2>
  <p>The dashboard turns an NWEA MAP Growth export into a classroom planning view: who grew, who needs support, who closed a gap, how to group the class, what to say at a data meeting and what to put on the wall. It is one web page. Open it, drop your CSV on it, and everything you see is computed from that file in your own browser.</p>
  <div class="callout good">
    <h4>Privacy</h4>
    <p>Nothing is uploaded anywhere. The page loads no third-party scripts, fonts or trackers, so it also works offline and behind a school filter. The only things remembered between visits are your theme and motion preferences; no student data is ever written to disk or sent to a server. Closing the tab forgets the file.</p>
  </div>
  <p>It is built for teachers rather than analysts. Three habits run through every section:</p>
  <ul>
    <li><strong>It says when a number is too thin to trust.</strong> Any share resting on fewer than ${data.minShare} records is shown as a count ("3 of 4") rather than a percentage, because a percentage over a handful of students is one child rounded to a whole number.</li>
    <li><strong>It separates achievement from growth.</strong> Where a score sits is one question; how far it moved compared with students who started in the same place is another. High achievement can hide low growth, and a low start can hide strong growth.</li>
    <li><strong>It explains itself.</strong> Method notes sit under the figures they qualify, and the <strong>?</strong> in the corner of every section opens a short explanation in place.</li>
  </ul>
  <p>Two words it uses precisely: a <strong>record</strong> is one student in one subject, so a student tested in three subjects is three records; a <strong>student</strong> is a person. Most figures count records, and the page says which.</p>
</div>

<div class="chapter">
  <h2>2. Getting your files out of NWEA MAP</h2>
  <p>You need two kinds of export for the whole picture, and they have to match. The <strong>Achievement Status and Growth (ASG)</strong> report carries growth: where each student started, where they are now, and NWEA's projection. The <strong>Class Profile</strong> report carries the instructional areas inside each subject, one file per subject. Load both and the dashboard folds each student's two records into one.</p>
  <h3>The Achievement Status and Growth (ASG) export</h3>
  <ol>
    <li>Sign in to MAP Growth and open <em>MAP Reports</em>.</li>
    <li>Choose the <em>Achievement Status and Growth</em> report for your class and the two terms you want compared (for example Fall to Spring).</li>
    <li>Use the export or download option and choose <em>CSV</em>.</li>
    <li>Save the file somewhere you can find it. You do not need to open or edit it.</li>
  </ol>
  <h3>The Class Profile exports</h3>
  <ol>
    <li>In <em>MAP Reports</em>, choose the <em>Class Profile</em> report for the same class and the current term.</li>
    <li>Run it once per subject - mathematics, reading, language usage, science - and download each as <em>CSV</em>. Each file is one test.</li>
    <li>Keep them with the ASG file. You will upload all of them together.</li>
  </ol>
  <div class="callout">
    <h4>Get both right</h4>
    <p>Same class, same term, every student in both. The dashboard matches each student's ASG record to their Class Profile record by student ID and subject. If the two exports disagree about a student's score - the same test with two different results - the Data Check names the student, both figures and both files, and keeps the growth record. Check the exports rather than trust either number for that student.</p>
  </div>
  <p>Column names are matched automatically, so slightly different exports still work, and comma, semicolon and tab separated files are all read. Suppressed values (the asterisks NWEA prints for small groups) and missing scores are handled.</p>
  <h3>A fall upload with one test window</h3>
  <p>In September there is nothing to compare against yet. Upload the single-window export anyway: the dashboard detects it and switches to a start-of-year view with tiers, norm placement and growth targets instead of showing empty growth panels. It does not matter whether the export puts the fall test in the Start or the End columns.</p>
  <h3>Several files at once</h3>
  <p>Select all the files at once when you upload and they are read as one data set. Where an ASG file and a Class Profile file describe the same test, the two are folded into one record so growth and instructional areas sit on the same student. An ASG file on its own gives you everything except the instructional areas; Class Profile files on their own give you the areas and one window, but no growth.</p>
  <div class="callout">
    <h4>Not ready to export?</h4>
    <p>Click <em>Load Sample Data</em> on the upload panel to explore every feature first, with a made-up grade 5 and 6 cohort of four classes, loaded the way yours would be: an ASG export and a Class Profile export together. Everything in this guide was pictured with that sample.</p>
  </div>
</div>

<div class="chapter">
  <h2>3. Loading a file and choosing what you look at</h2>
  ${figure(pictures.topbar, "The upload panel. Drag files onto the dashed box or click it to browse.")}
  <p>Drop your CSV on the upload box, or click it and choose the file. Once a file is loaded the panel shrinks to a status line with the record and student counts; <em>Change file</em> brings it back. The banner below the panel says what kind of file it is:</p>
  ${figure(pictures.banner, "A growth file: two windows, so growth, gap closure and quadrant movement are all measured.")}
  ${figure(pictures.baselineBanner, "A single-window file: the dashboard says why no growth figure appears and analyses the window it has.")}
  <ul>
    <li><strong>Growth file</strong> - most records carry both windows. Everything is available.</li>
    <li><strong>Mixed file</strong> - a growth file where a meaningful share of records only have the current window, usually students who joined after the earlier test. Growth panels describe the records with a prior score; the others are read from the achievement and norm columns.</li>
    <li><strong>Baseline file</strong> - one window only. Growth, gap closure and quadrant panels are hidden rather than shown empty; the Starting Point section, tiers, norm placement and targets take their place.</li>
  </ul>
  <h3>Filters</h3>
  ${figure(pictures.filters, "The filter bar stays at the top of the page as you scroll.")}
  <p>Every section, card, poster and export follows the filters. Search by student name or ID; narrow to a subject or a class; <em>More filters</em> adds teacher, grade, band, met growth, planning group, gap status and tier, and a switch between the subject lens and the class lens for the overview cards. When the export marks a test as not valid, a tick box lets you put those records back. <em>Reset</em> clears everything.</p>
  <p>The quick-question chips at the top jump straight to the section that answers them, and the <em>Jump to</em> bar lists every section the file makes available.</p>
  <p><strong>Essentials and the full analysis.</strong> The page opens on the ${data.essentials.length} sections a class teacher acts on each term; the rest are one click away, with <em>More analysis</em> at the end of the <em>Jump to</em> bar or <em>Show the full analysis</em> at the foot of the page. The choice is remembered, as a preference about the page and nothing about a student, and <em>Essentials only</em> puts it back. Chapter 5 marks which sections are which.</p>
</div>

<div class="chapter">
  <h2>4. Reading the numbers</h2>
  <dl>
    <dt>RIT score</dt>
    <dd>NWEA's equal-interval scale, roughly 140 to 260, running through every year of school without restarting. Growth is measured in RIT points. It is the number to quote when you talk about progress.</dd>
    <dt>Percentile</dt>
    <dd>Where a RIT sits against students in the same grade nationally, out of 100; 50 is the middle. It is not the share of questions answered correctly.</dd>
    <dt>Colour bands and tiers</dt>
    <dd>Percentiles are grouped into five bands twenty points wide, and the same cut points give the instructional tiers used for planning. A band is where a student is today, not a label.</dd>
    <dt>Projected and observed growth</dt>
    <dd>NWEA projects, from each student's own starting RIT and grade, how much a typical peer grows between the two windows. Observed growth is what happened. <em>Met growth</em> means observed was at least the projection; <em>exceeded</em> means more.</dd>
    <dt>Conditional growth percentile (CGP)</dt>
    <dd>A student's growth ranked against students nationally who started at the same RIT and grade. 50 is typical growth from that start, which makes it fair to low and high starters alike. Above 50 is faster than typical.</dd>
    <dt>US norms and grade-level equivalence</dt>
    <dd>The mean RIT for each grade and season in NWEA's norms study, built into the page as a reference table. "vs US norm" is the distance from that mean; "testing a grade below" is an approximation from grade means, not a reading or maths grade level, and least reliable at the ends of the scale. When a file says it was scored against a different norms study, the Data Check says so and the RIT-versus-norm figures should be read with care.</dd>
    <dt>The secure benchmark</dt>
    <dd>The ${data.secure}st percentile is a locally chosen line for "secure", not an NWEA definition. The 41st is the on-track line, the 21st the top of the intensive tier, the 81st the start of advanced. Gap closure measures movement towards or past the ${data.secure}st among students who started below it.</dd>
    <dt>Counts instead of percentages</dt>
    <dd>Under ${data.minShare} records a figure prints as a count. Widen the filters, or read the counts as counts; they carry the same fact without implying a precision the denominator cannot support.</dd>
    <dt>Too close to call</dt>
    <dd>Where the export carries a standard error, a met-growth result that sits within measurement error of the projection is marked "too close": the test pair cannot resolve it either way, and it is neither a miss to chase nor a win to celebrate.</dd>
  </dl>
  <div class="two">
    <div>
      <table><thead><tr><th>Band</th><th>Percentile</th></tr></thead><tbody>${bandRows}</tbody></table>
    </div>
    <div>
      <table><thead><tr><th>Tier</th><th>Level</th><th>Range</th></tr></thead><tbody>${tierRows}</tbody></table>
    </div>
  </div>
</div>

<div class="chapter">
  <h2>5. The sections, one by one</h2>
  <p>Each entry below is the text behind the section's <strong>?</strong> button: what it shows, how to read it, and what to do with it. Each says whether it is one of the essentials the page opens on or part of the full analysis, and sections that mean something different on a single-window file say so.</p>
  <p>Five of them are built for a closer look at the numbers: <strong>Insights</strong> (the headline figures and a ranked list of what stands out, each with how sure it is), <strong>Distributions</strong> (every record as a dot over a box plot), <strong>Movement</strong> (which band each record started and ended in), <strong>Heatmap</strong> (groups against subjects, and students against instructional areas) and <strong>Explorer</strong> (any two measures plotted against each other). They describe the students in the file: where two groups differ, or two measures move together, they say how strongly, never why.</p>
  ${sectionChapters}
</div>

<div class="chapter">
  <h2>6. Printing, exporting and the classroom wall</h2>
  <h3>Exports</h3>
  <ul>
    <li><strong>Summary TXT</strong> from Class Snapshot or the Class Summary Report - the narrative as plain text for notes or an email.</li>
    <li><strong>CSV exports</strong> from Grouping, Priority, Celebration, Gap Closure, Growth Goals, Instructional Areas, What Would It Take and Table Groups, and from the analytical sections: the Insights findings, the Distributions statistics, the Movement records, the Heatmap cells and the Explorer points. Exports always include every row, even when the table on screen shows a page of them. The table groups export has one row per seat: table, seat, shape, the order the strategy placed each student and whether you moved them by hand, then the student's scores.</li>
    <li><strong>The Explorer chart as a picture</strong> - <em>Download SVG</em> saves the scatter as you have set it up, trend line and all, for a slide or a department document.</li>
    <li><strong>Copy</strong> buttons on the Insights findings, the Summary, the Action Board, a student's spotlight and the quiz results put the text on your clipboard.</li>
    <li><strong>Show the numbers</strong> under the charts in the analytical sections opens the table behind the chart, for reading instead of looking.</li>
  </ul>
  <h3>Printing</h3>
  <ul>
    <li><strong>Goal sheets</strong> - two pages per student from Growth Goals. Page one is the data: where they are now in each subject, their next step, and the instructional areas inside each subject. Page two is theirs to fill in: the same targets in one line each, the part of each subject to work on first, and ruled space for the goal they set, what they will do about it and how you will help, with a line for both signatures and the date.</li>
    <li><strong>The action plan</strong> - the Action Board as a printable list of moves with the students named.</li>
    <li><strong>The seating plan</strong> - two prints from the planner. The <em>teacher copy</em> draws the room as you arranged it, every seat with the student's band colour and score, then adds a roster page per table with band, percentile, growth and planning group, and the paragraph that says how the plan was built. The <em>wall plan</em> draws the same room with names only: no score, no colour, nothing a visitor can read as data. Both fit A4 or A3, landscape or portrait to match the room's shape; choose A3 for a wall plan or a room with more than six tables.</li>
    <li><strong>A student one-pager</strong> - open any student's name for their spotlight, then print it for a conference.</li>
    <li><strong>The page itself</strong> - the browser's print command prints the dashboard; the quiz and the seating tools are left out.</li>
  </ul>
  <h3>Wall posters</h3>
  <p>Posters are written for students, in student language, and carry class shares, medians and counts only: no name, no individual score, no rank. They follow your filters, so filter to one class before you print, and the footer of each records which group it describes. Which posters are available depends on the file: growth posters need two windows and at least ${data.minShare} growth results, the learning-areas poster needs a Class Profile export, and every poster needs at least ${data.posterMin} students in view.</p>
  <table><thead><tr><th>Poster</th><th>What it says</th></tr></thead><tbody>${posterRows}</tbody></table>
  <p>Choose A3 or A4, landscape or portrait; add the class name the students know; tick the posters you want and print. In the print dialog turn on background graphics and choose fit to page.</p>
</div>

<div class="chapter">
  <h2>7. Before a data meeting</h2>
  <p>Four sections are built for the conversation with a leader rather than for planning.</p>
  <ul>
    <li><strong>Insights</strong> puts the headline figures against national references and ranks what stands out by the strength of the evidence, each finding saying how many students it rests on and how sure it is. Take the top two into the meeting and copy the rest into your notes.</li>
    <li><strong>Class Summary Report</strong> writes the narrative for you, from the same figures as the cards. Edit it into your own voice and paste it into your notes.</li>
    <li><strong>Check My Understanding</strong> asks you the questions a principal, inspector, governor, data lead or head of department would ask about the records in view, marks your answers against the page, and shows where each figure lives. Filter to the class the meeting is about, run a set, read back what you missed, and copy the prep notes.</li>
    <li><strong>Data Check</strong> is the section to read first, so that nothing in the meeting surprises you: which students have no score, which tests were short, whether the file was scored against the norms study the page expects.</li>
  </ul>
  <div class="callout">
    <h4>A useful order</h4>
    <p>Data Check, then Insights and the Class Snapshot, then the Priority list and the Action Board, then the Summary. That is the order a leader will ask about them.</p>
  </div>
</div>

<div class="chapter">
  <h2>8. When something looks wrong</h2>
  <dl>
    <dt>The file was skipped or nothing loaded</dt>
    <dd>The file needs a RIT or percentile column. Check that it is a MAP export rather than a roster or a summary sheet, and that it is the CSV rather than the PDF or Excel version. Data Check lists any file that was skipped and why.</dd>
    <dt>A section is missing</dt>
    <dd>The page opens on the essentials: choose <em>More analysis</em> in the <em>Jump to</em> bar to show the rest. Beyond that, sections a file cannot support are hidden rather than shown empty: growth sections (Growth, Movement, Gap Closure) need two windows, the Instructional Areas section and the Heatmap's student grid need a Class Profile export, and any column the export lacks hides the feature that depends on it.</dd>
    <dt>A figure shows "3 of 4" instead of a percentage, or "Too few"</dt>
    <dd>Fewer than ${data.minShare} records sit behind it. Widen the filters or read the count as a count.</dd>
    <dt>"No US norm available"</dt>
    <dd>NWEA publishes norms for Reading and Mathematics from kindergarten and for Language and Science from grade 2, and a record needs a grade to match. The Data Check counts the records that could not be matched and recovers grades suppressed on one row from the same student's other rows.</dd>
    <dt>The RIT-versus-norm figures do not match my MAP report</dt>
    <dd>The file was scored against a different norms study from the table built into the page; Data Check names both. Everything driven by the percentiles in your file is unaffected.</dd>
    <dt>Printing opened nothing</dt>
    <dd>A popup blocker stopped the print window. The dashboard downloads the same document as an HTML file instead; open it and print from there.</dd>
    <dt>The posters are not available</dt>
    <dd>Posters need at least ${data.posterMin} students in view, and any poster built on a percentage needs at least ${data.minShare} records behind it. Clear the search and filters.</dd>
  </dl>
</div>

<div class="chapter">
  <h2>A. Glossary and reference tables</h2>
  <h3>Planning groups and the teacher action that goes with them</h3>
  <table><thead><tr><th>Group</th><th>Suggested action</th></tr></thead><tbody>${groupRows}</tbody></table>
  <h3>Method notes, as they appear on the page</h3>
  <dl>
    ${Object.entries(data.notes).map(([key, note]) => "<dt>" + escapeHTML(key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())) + "</dt><dd>" + escapeHTML(note) + "</dd>").join("")}
  </dl>
</div>

</body></html>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
