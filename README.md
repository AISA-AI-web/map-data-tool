# Teacher MAP Dashboard | AISA

An NWEA MAP Growth (ASG) dashboard for teachers at the American International
School in Abu Dhabi. The whole product is one file, `index.html`: it opens in
a browser, reads the teacher's CSV exports on their own machine, and never
sends anything anywhere.

## The files

- `index.html` - the dashboard. Everything it needs is inside it, including
  the DM Sans typeface and the AISA marks, as data URIs.
- `vercel.json` - security headers for hosting. The Content-Security-Policy
  is deliberately strict: no scripts, styles, fonts or images from anywhere,
  and `connect-src 'none'`, so the page cannot make a network request even if
  one were somehow introduced. That is the promise the upload panel makes to
  teachers, enforced by the browser rather than trusted.
- `teacher-dashboard-guide.pdf` - the user guide the page links to.
  `vercel.json` exempts it from the frame-denying headers, because a
  browser's PDF viewer loads the document inside a frame.
- `build-guide.js` - builds the guide from the page itself (below).
- `check-planner.mjs` - the seating planner's regression checks (below).
- `brand/` - the AISA marks and the script that draws them (below).

## Checks

    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node check-planner.mjs

must end with `All planner checks passed`. Among other things it holds the
planner to the privacy rule the whole page keeps: nothing written to
`localStorage` may name a student.

## The user guide

The section titles and the "what it shows / how to read it / what to do with
it" text come out of `index.html` (`SECTION_PLAN` and `SECTION_HELP`), and
every picture is the page rendered with its own sample data, so rebuild the
guide whenever a section changes. `build-guide.js` resolves paths from the
directory above it, so from the parent of this repository:

    GUIDE_INDEX=map-data-tool/index.html \
    GUIDE_OUTPUT=map-data-tool/teacher-dashboard-guide.pdf \
    NODE_PATH=/path/to/global/node_modules \
    node map-data-tool/build-guide.js

## The brand

The dashboard follows the AISA brand guide: DM Sans throughout, Deep Royal
Purple `#21076C` for structure and Warm Mustard Gold `#D8B664` for emphasis,
white surfaces, the purple tint `#F2EFFA` as the only off-white, and `#C8BEE8`
for borders. The tokens live at the top of the stylesheet in `index.html`:
the `--aisa-*` values are the brand's own and are the same in both themes;
the component tokens (`--brand`, `--accent`, `--accent-ink`, `--heading`,
`--line`, ...) are built from them and have a light and a dark value each.

Two rules worth knowing before adding anything:

- **Gold is never small text on a light surface.** `#D8B664` is 1.95:1 on
  white. It is for fills, bars, big numbers on purple, and the one chip on
  the masthead that has dark ink on it. Gold you need to *read* on a light
  surface is `--accent-ink` / `--aisa-gold-ink`, `#7A5A12` (6.4:1 on white).
- **The five NWEA band colours are not brand colours.** NWEA names the
  quintiles Red, Orange, Yellow, Green and Blue, and a chart that prints a
  purple square under the word "Blue" is wrong in a way no brand guide
  outranks. They are never recoloured, and gold is kept out of any chart that
  also shows the Yellow band.

The dark theme is not an inversion: surfaces are a deep purple-black, the
brand purple is lifted to a lavender (`#bfa8fa`) that clears 7.6:1 on every
surface, the gold is used as it is, and the masthead keeps the real
`#21076C` in both themes.

### The marks

No official AISA logo file was available, so the marks are a typeset
wordmark - "AISA" in DM Sans Bold beside the school's full name - drawn by
`brand/make-brand-assets.mjs` from the same DM Sans the page embeds:

- `brand/aisa-wordmark.png` - purple, for white paper (the poster footer and
  the printed sheets);
- `brand/aisa-wordmark-reverse.png` - gold and white, for the purple bands
  (the masthead, the goal sheets, the seating plans, the guide cover);
- `brand/aisa-symbol.png` - a gold A on a purple tile, for the favicon.

Every copy on the page and on every printed sheet is read from one constant,
`BRAND`, near the top of `<body>`. To swap in a real logo, replace the two
wordmark PNGs (keeping roughly their 7:1 shape) and run

    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node brand/make-brand-assets.mjs --inline-only

which writes them into `BRAND` and the favicon and checks every substitution.
Run it without `--inline-only` to redraw the typeset marks.

### The typeface

DM Sans (SIL Open Font License 1.1, from `@fontsource-variable/dm-sans`) is
embedded as two variable-weight WOFF2 files - latin and latin-ext, because
student names carry accents - in `<style id="brandFonts">` in the head. The
print sheets open as separate documents, so they are handed the same rules
through `BRAND_FONT_CSS` rather than a second copy of the font.
