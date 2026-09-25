#!/usr/bin/env node
// Builds the ENS Dashboards instance from the same index.html the GitHub Pages
// site serves.
//
// This is a build rather than a copy on purpose. A duplicated 18,000-line file
// diverges the first time either side is touched, and every fix after that has
// to be made twice and remembered twice. Here there is one source of truth and
// a list of differences, so a change to the dashboard reaches both sites by
// re-running this.
//
// Every substitution below asserts that it matched. If a token is renamed or a
// block is edited upstream, this fails loudly at build time instead of quietly
// shipping a half-themed page.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "index.html");
const OUT_DIR = path.join(root, "ensdashboards");
const OUT = path.join(OUT_DIR, "index.html");

let html = fs.readFileSync(SRC, "utf8");
const applied = [];

function swap(label, find, replace, expected = 1) {
  const count = html.split(find).length - 1;
  if (count !== expected) {
    throw new Error(`build-clone: "${label}" matched ${count} time(s), expected ${expected}.\n` +
      `The upstream markup or token has changed. Fix this rule rather than shipping a partial theme.\n` +
      `Looked for: ${find.slice(0, 120)}`);
  }
  html = html.split(find).join(replace);
  applied.push(`${label} (${count})`);
}

function cut(label, find, expected = 1) {
  swap(label, find, "", expected);
}

// ---------------------------------------------------------------------------
// 1. Palette
// ---------------------------------------------------------------------------
// The ENS brand teal #007272 and plum #8e2344. The intermediate steps are not
// invented here: they come from the ENS Dashboards portal's own Tailwind
// config (rainetech/ens-portal, tailwind.config.ts), so this dashboard and the
// portal that links to it read as one product rather than two things that
// happen to share two hex values. The portal calls the second colour plum, so
// so does this.
//
// Both were measured before use: on white they run 5.75:1 and 8.49:1, which
// matches the portal's own note, and both clear a CIE76 Delta E of 15 against
// all five NWEA achievement bands (closest are teal to the green band at 32.6
// and plum to the red band at 31.8).
//
// The five band colours are NOT touched. They are not decoration - NWEA names
// those bands Red, Orange, Yellow, Green and Blue, and a poster that prints a
// teal square under the word "Red" is wrong in a way no brand guideline
// outranks.
swap("light: page accent wash", "--bg-accent: rgba(36, 84, 166, 0.06);", "--bg-accent: rgba(0, 114, 114, 0.07);");
swap("light: accent rule", "--line-accent: #87a4dc;", "--line-accent: #0a8a8a;");
swap("light: brand", "--brand: #2454a6;", "--brand: #007272;");
swap("light: brand dark", "--brand-dark: #173d7d;", "--brand-dark: #005c5c;");
swap("light: brand soft", "--brand-soft: #e9f0ff;", "--brand-soft: #e6f2f2;");
swap("light: brand ink", "--brand-ink: #173d7d;", "--brand-ink: #005c5c;");

// Dark theme is declared twice: once for the explicit toggle, once for the
// system preference. Both carry the same values upstream, so both are swapped.
swap("dark: page accent wash", "--bg-accent: rgba(122, 162, 247, 0.09);", "--bg-accent: rgba(77, 190, 186, 0.10);", 2);
swap("dark: accent rule", "--line-accent: #4c6da8;", "--line-accent: #2f7f7d;", 2);
swap("dark: brand", "--brand: #6c9cf0;", "--brand: #4fbdb8;", 2);
swap("dark: brand dark", "--brand-dark: #8fb6f8;", "--brand-dark: #7fd6d1;", 2);
swap("dark: brand soft", "--brand-soft: rgba(108, 156, 240, 0.16);", "--brand-soft: rgba(79, 189, 184, 0.18);", 2);
swap("dark: brand ink", "--brand-ink: #b6d0ff;", "--brand-ink: #a5e6e2;", 2);

// The print stylesheet is its own world: a poster carries no CSS variables from
// the page, so it declares fixed values.
swap("poster: brand", "--brand: #1d4ed8;", "--brand: #007272;");
swap("poster: brand deep", "--brand-deep: #14307f;", "--brand-deep: #00393a;");
swap("poster: brand wash", "--brand-wash: #e3ecfd;", "--brand-wash: #e6f2f2;");

// The wine is the second voice: section rules, the poster's secondary mark and
// anywhere the page needs emphasis that is not the primary action. It is added
// rather than swapped, because upstream has no equivalent token.
swap("accent tokens (light)", "      --brand: #007272;", `      --brand: #007272;
      --accent: #8e2344;
      --accent-soft: #f9ebef;
      --accent-ink: #741c38;`);
swap("accent tokens (dark)", "      --brand: #4fbdb8;", `      --brand: #4fbdb8;
      --accent: #d4809a;
      --accent-soft: rgba(212, 128, 154, 0.18);
      --accent-ink: #f0d3dc;`, 2);

// ---------------------------------------------------------------------------
// 2. Identity
// ---------------------------------------------------------------------------
swap("title", "<title>NWEA MAP ASG Teacher Dashboard</title>",
  "<title>Teacher MAP Dashboard | ENS Dashboards</title>");
swap("theme colour (light)", '<meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" content="#e6f2f2" media="(prefers-color-scheme: light)">');

// ---------------------------------------------------------------------------
// The ENS logo
// ---------------------------------------------------------------------------
// The Emirates National Schools mark, from build/assets. Two files rather than
// one: the full lockup for anywhere with room for a wordmark, and the symbol
// on its own for the favicon, where 709x130 of Arabic and English would be a
// smear at 16px. Both are checked in as real files so they can be reviewed and
// replaced without touching this script.
//
// Inlined as data URIs, like every other asset here. A logo fetched from a CDN
// would be the one request that breaks the promise the upload panel makes, and
// the first thing to vanish on a school network that blocks image hosts.
//
// A note on colour, because the two do not match. The logo file is plain sRGB
// and contains teal #007c85 and plum #a30046, while the brand colours given
// for this instance - and the ones the ENS Dashboards portal uses - are
// #007272 and #8e2344. That is a CIE76 Delta E of 6.8 and 13.4: not a colour
// management artefact, and far enough apart to read as a mistake if the two
// teals ever touch. So the chrome uses the specified colours, and the logo is
// always placed on white, where its own teal never abuts the interface's.
const logoDataUri = (file) =>
  "data:image/png;base64," + fs.readFileSync(path.join(root, "build", "assets", file)).toString("base64");
const ENS_LOGO = logoDataUri("ens-logo.png");
const ENS_SYMBOL = logoDataUri("ens-symbol.png");

{
  const icon = html.match(/  <link rel="icon" href="[^"]*">/);
  if (!icon) throw new Error("build-clone: favicon link not found.");
  swap("favicon", icon[0], '  <link rel="icon" href="' + ENS_SYMBOL + '">');
}

swap("masthead logo",
  '      <section class="brand-panel">\n        <div>\n          <p class="eyebrow">NWEA MAP ASG</p>',
  '      <section class="brand-panel">\n        <div>\n' +
  '          <img class="ens-logo" src="' + ENS_LOGO +
  '" alt="Emirates National Schools" width="709" height="130">\n' +
  '          <p class="eyebrow">ENS Dashboards \u00b7 NWEA MAP ASG</p>');

// A poster goes on a wall in a school, so it carries the school's name rather
// than an abstract mark. It sits in the footer, small, beside the class line.
swap("poster logo",
  '\'<span class="poster-meta">\' + escapeHTML(posterContextLine(scope)) + "</span></footer>" +',
  '\'<span class="poster-meta">\' + escapeHTML(posterContextLine(scope)) + "</span>" +\n' +
  '        \'<img class="poster-logo" src="' + ENS_LOGO + '" alt="Emirates National Schools">\' + "</footer>" +');

// ---------------------------------------------------------------------------
// 3. No support asks on this instance
// ---------------------------------------------------------------------------
// Emptying the link is the switch the dashboard already has: hasSupportLink()
// gates the dock chip, and supportPromptDue() returns false, so nothing is
// scheduled and nothing can appear. The markup is then removed as well, so the
// words never ship even in hidden DOM.
swap("support links", `    const SUPPORT_LINKS = {
      coffee: "https://www.buymeacoffee.com/Rainetech",
      feedback: ""
    };`, `    // This instance carries no support asks. Both links are empty, which is
    // the dashboard's own off switch: hasSupportLink() hides the dock chip and
    // supportPromptDue() returns false, so no prompt is ever scheduled.
    const SUPPORT_LINKS = {
      coffee: "",
      feedback: ""
    };`);

const dockChip = html.match(/    <a class="support-chip coffee" id="supportDockCoffee"[\s\S]*?<\/a>\n/);
if (!dockChip) throw new Error("build-clone: support dock coffee chip not found.");
cut("support dock chip", dockChip[0]);

const prompt = html.match(/  <div class="support-backdrop" id="supportBackdrop" hidden>[\s\S]*?\n  <\/div>\n/);
if (!prompt) throw new Error("build-clone: support prompt dialog not found.");
cut("support prompt dialog", prompt[0]);

// The Buy Me a Coffee brand styling is dead once the button is gone, and it
// carries their colours and their name, neither of which belongs on a
// white-labelled instance.
const bmcCss = html.match(/    \/\* Buy Me a Coffee brand treatment[\s\S]*?\n    \.coffee-btn \{[\s\S]*?\n    \}\n/);
if (!bmcCss) throw new Error("build-clone: Buy Me a Coffee stylesheet block not found.");
cut("Buy Me a Coffee styling", bmcCss[0]);

if (/buy me a coffee|bmc-blue/i.test(html)) {
  throw new Error("build-clone: Buy Me a Coffee traces remain after stripping.");
}

// ---------------------------------------------------------------------------
// 4. Where the second colour actually does something
// ---------------------------------------------------------------------------
// Injected as one marked block rather than edited into rules all over the
// upstream stylesheet, so the difference between the two instances stays
// readable and this file stays the only place it is described.
//
// The wine is given jobs, not sprinkled. It marks the briefing - the section
// the page now opens on - it rules the poster masthead so a printed sheet
// carries both colours, and it carries the export actions, which are the
// moments the teacher is producing something rather than reading.
swap("instance stylesheet", "\n  </style>\n</head>\n<body>\n  <script>", `
    /* ---- ENS Dashboards instance ------------------------------------- */
    /* Always on white. The logo's own teal is a few Delta E off the interface
       teal, which is invisible apart and looks like a printing error together,
       so the two never share an edge. White is also the background the mark
       was drawn for, and the one it keeps in dark mode. */
    .ens-logo {
      display: block;
      width: auto;
      height: 52px;
      max-width: 100%;
      margin: 0 0 16px;
      padding: 9px 14px;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
    }

    #sec-briefing .section-header h2::before { background: var(--accent); }
    .briefing { border-color: var(--accent-soft); }
    .briefing.is-playing {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent) inset;
    }
    .briefing.is-playing .briefing-say span.is-speaking {
      box-shadow: inset 0 -0.55em 0 var(--accent-soft);
    }
    .briefing-progress i { background: linear-gradient(90deg, var(--brand), var(--accent)); }
    .briefing-step[aria-selected="true"] {
      border-color: var(--accent);
      color: var(--accent-ink);
      background: var(--accent-soft);
    }
    .briefing-step[aria-selected="true"] i { background: var(--accent); }
  </style>
</head>
<body>
  <script>`);

// ---------------------------------------------------------------------------
// The goal sheet is a third stylesheet - printed, and the one page that goes
// home with a child - so it carries the instance's colours and its mark too.
// Measured on the sheet's own dark header (#00393a): kicker 6.85:1, meta
// 8.97:1, the name in white 12.76:1, all at or above the blue they replace.
// ---------------------------------------------------------------------------
swap("goal sheet header", "  .gs-head { background: #14307f; color: #fff; padding: 7mm 16mm 6mm; }",
  `  .gs-head {
    background: #00393a; color: #fff; padding: 7mm 16mm 6mm;
    border-bottom: 1.4mm solid #8e2344;
    display: grid; grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 6mm; align-items: center;
  }
  /* The mark sits on white, never against the header's own teal: the logo
     carries a teal of its own and the two do not match. */
  .gs-logo {
    grid-row: 1 / span 3; grid-column: 2;
    height: 11mm; width: auto; align-self: center;
    background: #ffffff; padding: 2mm 3mm; border-radius: 2mm;
  }`);
swap("goal sheet kicker", "text-transform: uppercase; color: #a9c6f7;", "text-transform: uppercase; color: #7fcbc7;");
swap("goal sheet meta", "font-size: 10pt; color: #cfe0fb; }", "font-size: 10pt; color: #b9e0dd; }");
swap("goal sheet section rule", "border-bottom: 0.5mm solid #1d4ed8; padding-bottom: 1.5mm;",
  "border-bottom: 0.5mm solid #007272; padding-bottom: 1.5mm;");
swap("goal sheet RIT ink", "letter-spacing: -0.03em; color: #14307f; }", "letter-spacing: -0.03em; color: #00393a; }");

// Both sheets a student is handed carry the school's mark.
swap("goal sheet data page logo",
  '\'<header class="gs-head"><span class="gs-kicker">My learning goals</span>\' +',
  '\'<header class="gs-head"><img class="gs-logo" src="' + ENS_LOGO + '" alt="Emirates National Schools"><span class="gs-kicker">My learning goals</span>\' +');
swap("goal sheet plan page logo",
  '\'<header class="gs-head"><span class="gs-kicker">My plan</span>\' +',
  '\'<header class="gs-head"><img class="gs-logo" src="' + ENS_LOGO + '" alt="Emirates National Schools"><span class="gs-kicker">My plan</span>\' +');

// The seating plan prints (the teacher copy and the wall plan) share one
// masthead. Its three colours are declared once as tokens, and the empty
// logo slot upstream becomes the school's mark on white, as on the goal sheet.
swap("seating print tokens",
  "  :root { --sp-brand-deep: #14307f; --sp-brand: #1d4ed8; --sp-brand-soft: #a9c6f7; }",
  "  :root { --sp-brand-deep: #00393a; --sp-brand: #007272; --sp-brand-soft: #7fcbc7; }\n" +
  "  .sp-head { border-bottom: 1.2mm solid #8e2344; }\n" +
  "  .sp-head-meta { color: #b9e0dd; }\n" +
  "  .sp-logo { height: 10mm; width: auto; background: #ffffff; padding: 1.5mm 2.5mm; border-radius: 1.5mm; flex: 0 0 auto; }");
swap("seating print logo",
  '\'<header class="sp-head"><span class="sp-logo-slot"></span>',
  '\'<header class="sp-head"><img class="sp-logo" src="' + ENS_LOGO + '" alt="Emirates National Schools">');

// The poster stylesheet is separate and printed, so it gets its own rule.
swap("poster footer logo styling", "  .poster-foot {", `  .poster-logo {
    display: block;
    height: calc(9 * var(--s));
    width: auto;
    align-self: center;
    flex: none;
    background: #ffffff;
    padding: calc(1.6 * var(--s)) calc(2.4 * var(--s));
    border-radius: calc(2 * var(--s));
  }
  .poster-foot {`);

// The footer was a two-column grid and the mark is a third child, which
// otherwise wraps to a new row and pushes the callouts off the sheet.
swap("poster footer columns",
  "  .poster-foot {\n    display: grid;\n    grid-template-columns: minmax(0, 1fr) auto;",
  "  .poster-foot {\n    display: grid;\n    grid-template-columns: minmax(0, 1fr) auto auto;");

swap("poster accent rule", "  .poster-masthead {\n    background: var(--brand-deep);", `  .poster-masthead {
    border-bottom: calc(1.6 * var(--s)) solid #8e2344;
    background: var(--brand-deep);`);
swap("poster subject chip accent",
  "    background: rgba(255, 255, 255, 0.16);\n    color: #ffffff;",
  "    background: #8e2344;\n    color: #ffffff;");

// ---------------------------------------------------------------------------
// A substitution that lands inside a JS string literal can produce a file that
// looks right and does not parse, which takes the whole page down rather than
// one feature. Check before writing.
for (const block of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  try {
    new Function(block[1]);
  } catch (error) {
    throw new Error("build-clone: the generated page has a script error and was not written.\n" + error.message);
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`built ${path.relative(root, OUT)}  (${kb} KB)`);
applied.forEach((line) => console.log("  - " + line));
