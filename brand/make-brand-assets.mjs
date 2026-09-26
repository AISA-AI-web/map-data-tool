#!/usr/bin/env node
// Builds the AISA marks the dashboard carries from the school's official logo
// files, and inlines them into index.html.
//
//   node brand/make-brand-assets.mjs              render the PNGs and inline them
//   node brand/make-brand-assets.mjs --no-inline  render the PNGs only
//   node brand/make-brand-assets.mjs --inline-only inline the PNGs already here
//
// Needs Playwright with a Chromium build (set PLAYWRIGHT_MODULE to its
// index.mjs if it is not resolvable from here).
//
// The sources are the official files in brand/official/, exactly as the
// school supplied them:
//
//   aisa-seal-white.webp     the full seal - "AMERICAN INTERNATIONAL SCHOOL
//                            · ABU DHABI" round the AISA monogram - in white on
//                            transparent, for purple grounds
//   aisa-mark.png            the monogram alone in its purple disc, for white
//   aisa-seal-on-purple.jpg  the seal on the logo's own purple field; the same
//                            drawing as the white seal, kept for reference and
//                            not drawn from (its field is the logo purple
//                            #343474, which would sit as a visible box on the
//                            interface purple #21076C)
//
// Nothing is redrawn: every mark below is a crop, a scale or a recolouring of
// those files, done in a canvas, with the school name typeset beside the disc
// in the same DM Sans the page embeds (read out of index.html's
// <style id="brandFonts">). The seal's own lettering runs round a circle about
// 3px tall at masthead size, which is a smear, so the small lockups use the
// monogram disc and set the name as type beside it; the whole seal is kept for
// places big enough to read it.
//
//   aisa-wordmark.png          purple disc + purple name, for white paper:
//                              the poster footer
//   aisa-wordmark-reverse.png  white disc + white name, for purple: the
//                              masthead, the goal sheet, the seating plan and
//                              print-sheet headers, the guide cover
//   aisa-seal-reverse.png      the whole white seal, for the guide cover
//   aisa-symbol.png            the purple disc alone, square, for the favicon
//
// Everything is inlined as a data: URI. A logo fetched from a server would be
// the one request that breaks the promise the upload panel makes, and the
// Content-Security-Policy in vercel.json would block it anyway.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const INDEX = path.join(root, "index.html");
const OFFICIAL = path.join(here, "official");
const args = new Set(process.argv.slice(2));
const known = new Set(["--no-inline", "--inline-only"]);
for (const arg of args) if (!known.has(arg)) throw new Error(`make-brand-assets: unknown option ${arg}`);
const INLINE = !args.has("--no-inline");
const RENDER = !args.has("--inline-only");

const WHITE = "#FFFFFF";
// The purple the logo files themselves are drawn in (aisa-mark.png), used for
// the name beside the purple disc so the lockup is one colour, as the school's
// own mark is. The interface purple #21076C is a little deeper; the two never
// share an edge because the lockup always sits on white.
const LOGO_PURPLE = "#2D266C";

// Where the monogram disc sits inside aisa-seal-white.webp (2000x1661),
// measured from its alpha channel: centre (1000, 825), radius 492.
const SEAL_DISC = { cx: 1000, cy: 825, r: 492 };

const SCHOOL = ["American International School", "in Abu Dhabi"];

function readFontCSS(html) {
  const match = html.match(/<style id="brandFonts">([\s\S]*?)<\/style>/);
  if (!match) throw new Error("make-brand-assets: <style id=\"brandFonts\"> not found in index.html.");
  return match[1];
}

function fileURI(file, type) {
  return `data:${type};base64,` + fs.readFileSync(path.join(OFFICIAL, file)).toString("base64");
}

// Runs in the page: crops, scales and recolours the official files in a
// canvas and returns PNG data URIs. Kept free of anything outside its
// arguments because Playwright serialises it.
async function prepareMarks({ sealURI, markURI, disc }) {
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not decode " + src.slice(0, 40)));
    img.src = src;
  });
  const [seal, mark] = await Promise.all([load(sealURI), load(markURI)]);

  // Bounding box of the opaque pixels, so every mark is trimmed to the ink.
  function inkBox(img) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  function draw(img, box, size, { clipCircle = false, square = false } = {}) {
    const scale = size / Math.max(box.w, box.h);
    const w = square ? size : Math.round(box.w * scale);
    const h = square ? size : Math.round(box.h * scale);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    if (clipCircle) {
      g.beginPath();
      g.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      g.clip();
    }
    const dw = box.w * scale, dh = box.h * scale;
    g.drawImage(img, box.x, box.y, box.w, box.h, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c.toDataURL("image/png");
  }

  const sealBox = inkBox(seal);
  const markBox = inkBox(mark);
  const discBox = { x: disc.cx - disc.r, y: disc.cy - disc.r, w: disc.r * 2, h: disc.r * 2 };
  return {
    // The seal, trimmed to its ink. 440px is sharp at the 40mm the guide
    // cover prints it (about 280 dpi) and keeps the inlined copy small.
    sealReverse: draw(seal, sealBox, 440),
    // The monogram disc cut out of the white seal. Its letters are the
    // transparent holes the school drew, so the ground shows through them.
    discReverse: draw(seal, discBox, 200, { clipCircle: true, square: true }),
    // The purple disc, trimmed and centred on a square canvas. The source is
    // a few pixels taller than it is wide at the edges of its antialiasing;
    // the square canvas keeps it round.
    disc: draw(mark, markBox, 200, { square: true }),
    favicon: draw(mark, markBox, 64, { square: true })
  };
}

// One lockup, two colourings: the disc, then the school's name as type. The
// name sits beside the disc rather than under it so the mark keeps its height
// in a one-line masthead.
function lockupHTML({ disc, name }) {
  return `
    <div class="mark" id="mark">
      <img src="${disc}" alt="">
      <span class="name">${SCHOOL.join("<br>")}</span>
    </div>
    <style>
      .mark { display: inline-flex; align-items: center; gap: 12px; padding: 2px 3px; }
      .mark img { width: 48px; height: 48px; display: block; }
      .name { font-weight: 600; font-size: 14.5px; line-height: 1.2; letter-spacing: 0.01em; color: ${name}; }
    </style>`;
}

function dataToFile(uri, file) {
  fs.writeFileSync(path.join(here, file), Buffer.from(uri.split(",")[1], "base64"));
  console.log("wrote brand/" + file);
}

async function render(fontCSS) {
  const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
  const { chromium } = await import(playwrightModule);
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 300 } });
  await page.setContent("<!doctype html><html><body></body></html>");
  const marks = await page.evaluate(prepareMarks, {
    sealURI: fileURI("aisa-seal-white.webp", "image/webp"),
    markURI: fileURI("aisa-mark.png", "image/png"),
    disc: SEAL_DISC
  });
  dataToFile(marks.sealReverse, "aisa-seal-reverse.png");
  dataToFile(marks.favicon, "aisa-symbol.png");

  const lockups = [
    { file: "aisa-wordmark.png", html: lockupHTML({ disc: marks.disc, name: LOGO_PURPLE }) },
    { file: "aisa-wordmark-reverse.png", html: lockupHTML({ disc: marks.discReverse, name: WHITE }) }
  ];
  for (const lockup of lockups) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
      html, body { margin: 0; background: transparent; }
      body { font-family: "DM Sans"; padding: 8px; }
    </style></head><body>${lockup.html}</body></html>`);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]));
    const family = await page.evaluate(() => document.fonts.check('600 14.5px "DM Sans"'));
    if (!family) throw new Error("make-brand-assets: DM Sans did not load; refusing to set the name in a fallback face.");
    await page.locator("#mark").screenshot({ path: path.join(here, lockup.file), omitBackground: true });
    console.log("drew brand/" + lockup.file);
  }
  await browser.close();
}

function dataURI(file) {
  return "data:image/png;base64," + fs.readFileSync(path.join(here, file)).toString("base64");
}

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(here, file));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// Each substitution asserts that it matched exactly once, so a renamed key or
// a moved tag fails here rather than leaving a stale mark in the page.
function inline() {
  let html = fs.readFileSync(INDEX, "utf8");
  const swap = (label, pattern, replacement) => {
    const matches = html.match(new RegExp(pattern.source, "g")) || [];
    if (matches.length !== 1) throw new Error(`make-brand-assets: "${label}" matched ${matches.length} time(s), expected 1.`);
    html = html.replace(pattern, replacement);
  };
  swap("favicon", /<link rel="icon" href="data:image\/png;base64,[^"]*">/,
    `<link rel="icon" href="${dataURI("aisa-symbol.png")}">`);
  swap("BRAND.wordmark", /wordmark: "data:image\/png;base64,[^"]*"/,
    `wordmark: "${dataURI("aisa-wordmark.png")}"`);
  swap("BRAND.wordmarkReverse", /wordmarkReverse: "data:image\/png;base64,[^"]*"/,
    `wordmarkReverse: "${dataURI("aisa-wordmark-reverse.png")}"`);
  swap("BRAND.sealReverse", /sealReverse: "data:image\/png;base64,[^"]*"/,
    `sealReverse: "${dataURI("aisa-seal-reverse.png")}"`);
  // The masthead reserves the mark's box before the image decodes, at half
  // the PNG's pixel size (the lockups are drawn at 2x).
  const size = pngSize("aisa-wordmark-reverse.png");
  swap("masthead logo size", /(<img class="brand-logo" id="brandLogo"[^>]*?) width="\d+" height="\d+"/,
    `$1 width="${Math.round(size.width / 2)}" height="${Math.round(size.height / 2)}"`);
  fs.writeFileSync(INDEX, html);
  console.log("inlined the marks into index.html");
}

if (RENDER) await render(readFontCSS(fs.readFileSync(INDEX, "utf8")));
if (INLINE) inline();
