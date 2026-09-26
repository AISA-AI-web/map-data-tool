#!/usr/bin/env node
// Draws the AISA marks the dashboard carries, and inlines them into index.html.
//
//   node brand/make-brand-assets.mjs            render the PNGs and inline them
//   node brand/make-brand-assets.mjs --no-inline render the PNGs only
//
// Needs Playwright with a Chromium build (set PLAYWRIGHT_MODULE to its
// index.mjs if it is not resolvable from here).
//
// There is no official AISA logo file in this repository, so the marks are a
// typeset wordmark: "AISA" in DM Sans Bold with the school's full name beside
// it, in the brand purple and gold. They are drawn from HTML with the same DM
// Sans the page embeds - read out of index.html's <style id="brandFonts">, so
// there is one copy of the font and the marks cannot drift from the page's
// type - and photographed at twice their display size so they stay sharp on a
// high-density screen and on paper.
//
//   aisa-wordmark.png          purple, for white: the poster footer
//   aisa-wordmark-reverse.png  gold and white, for purple: the masthead, the
//                              goal sheet and the seating plan headers
//   aisa-symbol.png            a gold A on a purple tile, for the favicon,
//                              where a whole wordmark would be a smear at 16px
//
// When a real logo arrives, drop it in as aisa-wordmark.png and
// aisa-wordmark-reverse.png (keeping roughly this 7:1 shape, or adjust the
// width and height on the masthead <img>) and run this with --inline-only; the
// page reads every copy from the one BRAND constant, so nothing else changes.
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
const args = new Set(process.argv.slice(2));
const INLINE = !args.has("--no-inline");
const RENDER = !args.has("--inline-only");

// The palette, as the brand guide gives it.
const PURPLE = "#21076C";
const GOLD = "#D8B664";
const WHITE = "#FFFFFF";

const SCHOOL = ["American International School", "in Abu Dhabi"];

function readFontCSS(html) {
  const match = html.match(/<style id="brandFonts">([\s\S]*?)<\/style>/);
  if (!match) throw new Error("make-brand-assets: <style id=\"brandFonts\"> not found in index.html.");
  return match[1];
}

// One lockup, two colourings. The name sits beside the letters rather than
// under them so the mark keeps its height in a one-line masthead.
function wordmarkHTML({ letters, rule, name }) {
  return `
    <div class="mark" id="mark">
      <span class="letters">AISA</span>
      <span class="rule" aria-hidden="true"></span>
      <span class="name">${SCHOOL.join("<br>")}</span>
    </div>
    <style>
      .mark { display: inline-flex; align-items: center; gap: 13px; padding: 2px 3px; }
      .letters { font-weight: 700; font-size: 46px; line-height: 1; letter-spacing: 0.015em; color: ${letters}; }
      .rule { width: 2.5px; height: 38px; border-radius: 2px; background: ${rule}; }
      .name { font-weight: 500; font-size: 13.5px; line-height: 1.22; letter-spacing: 0.005em; color: ${name}; }
    </style>`;
}

function symbolHTML() {
  return `
    <div class="mark" id="mark"><span>A</span></div>
    <style>
      .mark { width: 64px; height: 64px; border-radius: 14px; background: ${PURPLE};
              display: grid; place-items: center; }
      .mark span { font-weight: 700; font-size: 46px; line-height: 1; color: ${GOLD};
                   transform: translateY(1px); }
    </style>`;
}

const ASSETS = [
  { file: "aisa-wordmark.png", html: () => wordmarkHTML({ letters: PURPLE, rule: GOLD, name: PURPLE }) },
  { file: "aisa-wordmark-reverse.png", html: () => wordmarkHTML({ letters: GOLD, rule: "rgba(255, 255, 255, 0.4)", name: WHITE }) },
  { file: "aisa-symbol.png", html: symbolHTML }
];

async function render(fontCSS) {
  const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
  const { chromium } = await import(playwrightModule);
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 300 } });
  for (const asset of ASSETS) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
      html, body { margin: 0; background: transparent; }
      body { font-family: "DM Sans"; padding: 8px; }
    </style></head><body>${asset.html()}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const family = await page.evaluate(() => document.fonts.check('700 46px "DM Sans"'));
    if (!family) throw new Error("make-brand-assets: DM Sans did not load; refusing to draw the marks in a fallback face.");
    await page.locator("#mark").screenshot({ path: path.join(here, asset.file), omitBackground: true });
    console.log("drew brand/" + asset.file);
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
  // The masthead reserves the mark's box before the image decodes, at half
  // the PNG's pixel size (the PNGs are drawn at 2x).
  const size = pngSize("aisa-wordmark-reverse.png");
  swap("masthead logo size", /(<img class="brand-logo" id="brandLogo"[^>]*?) width="\d+" height="\d+"/,
    `$1 width="${Math.round(size.width / 2)}" height="${Math.round(size.height / 2)}"`);
  fs.writeFileSync(INDEX, html);
  console.log("inlined the marks into index.html");
}

if (RENDER) await render(readFontCSS(fs.readFileSync(INDEX, "utf8")));
if (INLINE) inline();
