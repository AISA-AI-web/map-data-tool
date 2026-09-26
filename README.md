# Teacher MAP Dashboard | AISA

An NWEA MAP Growth (ASG) dashboard for teachers at the American International
School in Abu Dhabi. The whole product is one file, `index.html`: it opens in
a browser, reads the teacher's CSV exports on their own machine, and turns
them into a planning view - who grew, who needs support, how to group the
class, what to say at a data meeting and what to put on the wall.

## The promise

The upload panel tells teachers their file never leaves their computer, and
the page is built so that stays true:

- **Nothing is sent anywhere.** Files are read in the browser and forgotten
  when the tab closes. There is no server code and no analytics, and the
  page makes no request of its own.
- **Nothing is loaded from anywhere.** Scripts, styles, the DM Sans typeface
  and the AISA marks are all inside `index.html`, as inline code and data
  URIs. The page works offline and behind a school filter; a teacher can save
  it and open it from disk.
- **The browser enforces it.** The Content-Security-Policy in `vercel.json`
  allows inline code and `data:` images and fonts only, and sets
  `connect-src 'none'`, so the page cannot make a network request even if one
  were somehow introduced.
- **Nothing remembered names a student.** `localStorage` holds the theme,
  motion and view preferences (`asg-dashboard-preferences`), the last chart
  axes and metrics as short tokens (`asg-dashboard-viz`), and the seating
  planner's room shape (`asg-room-layout`). No name, ID, score, class or file.

Anything added to the page keeps all four.

## The files

- `index.html` - the dashboard.
- `vercel.json` - hosting headers (see *Deploying*).
- `teacher-dashboard-guide.pdf` - the user guide the page links to from
  every section's **?** panel.
- `build-guide.js` - builds the guide from the page itself.
- `check-planner.mjs` - the regression checks.
- `brand/` - the AISA marks and the script that draws them.
- `sample/` - the demo data behind *Load Sample Data* and the script that
  draws it.

## What is on the page

A teacher loads an ASG export, and optionally Class Profile exports for the
instructional areas; the page folds each student's records together. A file
with two test windows gets the growth view; a fall file with one window gets
a start-of-year view instead of empty growth panels. Every section follows the
filters.

The page opens on nine **essentials** (`ESSENTIAL_SECTIONS`); the rest sit
behind *More analysis* and the choice is remembered. In page order, with the
essentials marked *(E)*:

- **Spoken Briefing** *(E)* - a narrated walk through the file, read aloud by
  the teacher's own device.
- **Insights** *(E)* - headline KPI tiles against national references, then
  a ranked list of statistical findings, each saying how many students it
  rests on and how sure it is.
- **Class Snapshot** *(E)* - the headline counts and shares in one card.
- **Achievement Profile** - the tier ladder and placement against US norms
  (called Starting Point on a single-window file).
- **Subject Overview** - one card per subject.
- **Subject Charts** - start and end achievement, projected against observed
  growth, band distribution, per subject.
- **Distributions** - a box plot per subject or class with every record as a
  dot on it, and a table of summary statistics.
- **Growth and Achievement** *(E)* - NWEA's quadrants, quadrant movement and
  growth by starting band. Growth files only.
- **Movement** - a band-to-band transition matrix and a dumbbell per record
  from start to end percentile. Growth files only.
- **Gap Closure** - who closed, reduced or widened the gap to the 61st
  percentile. Growth files only.
- **Growth Goals** *(E)* - RIT targets for the next test, and the printed
  goal sheets.
- **Action Board** *(E)* - the week's highest-leverage moves, with the
  students each applies to.
- **What Would It Take?** - how far the group is from a chosen target, and
  who is closest to it.
- **Cross-Subject Profiles** - each student's strongest and weakest subject.
- **Heatmap** - groups against subjects coloured by the chosen measure, and,
  with Class Profile data, students against instructional areas.
- **Instructional Areas** - class strengths and gaps inside each subject.
  Class Profile exports only.
- **Class Summary Report** - a copy-ready narrative of the view.
- **Explorer** - a scatter of any two measures, with an OLS trend line, r,
  R², a pinned student, and SVG and CSV export.
- **Table Groups and Seating Plan** - table groups by strategy, and a room
  planner with teacher and wall prints.
- **Student Grouping Report** - every record in one sortable table.
- **Priority Students** *(E)* - records that need attention first, with the
  reasons.
- **Wall Posters** *(E)* - class-level posters for students; no name, no
  individual score.
- **Check My Understanding** *(E)* - practice questions for the data
  conversation, marked against the page.
- **Celebration Students** - records with something to celebrate.
- **Data Check** - what was read from the file, what was not, and why.

Insights, Distributions, Movement, Heatmap and Explorer are the analytical
sections, drawn with the viz kit below.

### Adding or changing a section

`SECTION_PLAN` lists the sections, the file modes each appears in and any
availability test; it drives the *Jump to* bar and what is shown.
`SECTION_HELP` is the text behind each **?** and becomes the section's page in
the guide, so write it as three short answers (what it shows, how to read it,
what to do with it) plus a `baseline` variant where a single-window file
changes the meaning. Decide whether the section belongs in
`ESSENTIAL_SECTIONS`; if it is heavy and not essential, register its renderer
in `DEFERRED_RENDERERS` so it draws only when shown. Then rebuild the guide.

## The viz kit

The analytical sections share one chart system so they read as one piece and
nobody writes a second quantile or a second tooltip. It has two halves that
change together: the CSS block headed `AISA viz kit` at the end of the
stylesheet, and the JavaScript block `---- AISA viz kit ----` after
`chartCard()`. Each section then has its own `AISA: <Label>` block in both the
stylesheet and the script. Search for those strings.

- `vizStats` - pure, null-safe statistics: quantile (type 7, as Excel's
  PERCENTILE.INC), box stats, mean, SD, t-based 95% intervals, Pearson, OLS,
  Welch's test, paired t, Cohen's d. They drop non-numbers and answer `null`,
  never NaN, when there is too little to say anything.
- `vizColor` - the AISA data palette by job: categorical, subject,
  sequential, diverging, and the ink for a label on a fill.
- Scales, axes, `vizFrame`, marks, cards, legends, `vizTable`, `vizKpiTile`,
  and the one tooltip (`vizTip` / `vizTipAttrs`, by `data-tip` delegation).
- `vizChartSlot` / `vizMount` - draw at the container's real width and redraw
  on resize, theme change and print.

The rules, which the kit's own header comment explains in full:

- **Colour by job.** Identity takes the categorical slots in order (or
  `vizColor.subject(name)`), magnitude the purple ramp, either side of a
  centre the gold-neutral-purple ramp. The five NWEA band colours
  (`--red` to `--blue`) are semantic: they are never recoloured, and a chart
  that shows bands never also shows a purple or gold series.
- **Text never wears a series colour.** Gold text on a light surface is
  `--accent-ink`.
- **Every tip goes through `vizTip`**, so it is escaped, reachable by
  keyboard and read aloud. Never a `<title>` tip. Every other interpolated
  string goes through `escapeHTML` or `escapeAttr`.
- **Every chart has its numbers without hovering**: a direct label, or a
  table in a "Show the numbers" toggle (`vizTableToggle`).
- **Thin data says so.** Under `MIN_SHARE_N` (10) records a mark is hatched
  and a share prints as a count.
- **Describe, never explain.** A finding says how large a difference or a
  relationship is and how sure the data can be of it; it never says what
  caused it.

## Checks

    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node check-planner.mjs

must end with `All planner checks passed`. It drives the page in Chromium with
the sample data: the seating planner's layout, keyboard and drag moves, and
prints, and the rule the whole page keeps - nothing written to `localStorage`
may name a student. `TARGET` points it at another copy of the page, and
`FIXTURES` at other exports (a comma-separated list).

## The sample data

*Load Sample Data* loads a made-up cohort - four grade 5 and 6 classes at
"AISA Demo School", Fall 2025 to Spring 2026 - as two exports, an ASG file and
a spring Class Profile file, through the same multi-file path a teacher's own
uploads take. `sample/make-sample.mjs` draws both from a seeded generator,
scored against the norm tables in `index.html` so every percentile agrees
with the page's own norm comparisons, and writes them to
`sample/sample-asg.csv` and `sample/sample-class-profile.csv` and into
`SAMPLE_CSV` and `SAMPLE_CLASS_PROFILE_CSV` in the page:

    node sample/make-sample.mjs            # --report lists the signals it built in; --no-inline writes the CSVs only

Change the generator and rerun it rather than editing the strings by hand.
No student, teacher or school in it is real.

## The user guide

The section titles and the "what it shows / how to read it / what to do with
it" text come out of `index.html` (`SECTION_PLAN` and `SECTION_HELP`), and
every picture is the page rendered with its own sample data in the full view,
so rebuild the guide whenever a section or the sample changes:

    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node build-guide.js

It writes `teacher-dashboard-guide.pdf` next to the script. A section taller
than 1500 pixels is pictured from the top, cut at the end of the last whole
card, table or paragraph rather than through a chart; where the part left out
is the point of the section (Movement's dumbbells, the Heatmap's student
grid) it gets a picture of its own. `GUIDE_INDEX`, `GUIDE_OUTPUT` and
`GUIDE_TITLE` (default `Teacher MAP Dashboard | AISA`) override the page, the
PDF and the running header; `GUIDE_HTML` also writes the guide's HTML for
checking the text. Without `PLAYWRIGHT_MODULE` it falls back to
`require("playwright")`.

## The brand

The dashboard follows the AISA brand guide: DM Sans throughout, Deep Royal
Purple `#21076C` for structure and Warm Mustard Gold `#D8B664` for emphasis,
white surfaces, the purple tint `#F2EFFA` as the only off-white, `#C8BEE8` for
lines, `#1A1A1A` for body text and `#555555` for muted text. The tokens live
at the top of the stylesheet in `index.html`: the `--aisa-*` values are the
brand's own and are the same in both themes; the component tokens (`--brand`,
`--accent`, `--accent-ink`, `--heading`, `--line`, ...) are built from them
and have a light and a dark value each.

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
`BRAND`, near the top of `<body>`, and the guide reads it from the page. To
use the official AISA lion logo, export it as PNG with a transparent
background and save it over the marks in `brand/`: the version for white as
`aisa-wordmark.png`, the reversed version for purple as
`aisa-wordmark-reverse.png`, and a square crop of the lion as
`aisa-symbol.png` for the favicon. Draw them at twice the size they should
show - the masthead is sized at half the reverse PNG's pixels - and keep
roughly the current 7:1 lockup so the masthead and print headers keep their
layout. Then run

    node brand/make-brand-assets.mjs --inline-only

which writes all three into `BRAND`, the masthead and the favicon as data
URIs and fails loudly if any substitution does not match; it needs no
browser. Rebuild the guide afterwards so its cover
carries the new mark. Run the script without `--inline-only` (and with
`PLAYWRIGHT_MODULE` set) to redraw the typeset marks instead; `--no-inline`
draws them without touching the page.

### The typeface

DM Sans (SIL Open Font License 1.1, from `@fontsource-variable/dm-sans`) is
embedded as two variable-weight WOFF2 files - latin and latin-ext, because
student names carry accents - in `<style id="brandFonts">` in the head. The
print sheets and the guide open as separate documents, so they are handed the
same rules through `BRAND_FONT_CSS` rather than a second copy of the font.

## Deploying

The site is static and has no build step: Vercel serves the repository as it
is, and `index.html` is the page. `vercel.json` sets the headers:

- on everything except the guide: the Content-Security-Policy above (with
  `form-action`, `frame-ancestors` and `base-uri` also `'none'`),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer` and a Permissions-Policy that turns off
  geolocation, camera and microphone;
- on `teacher-dashboard-guide.pdf`: the same without the frame-denying
  headers, because a browser's PDF viewer loads the document inside a frame;
- `Cache-Control: max-age=0, must-revalidate` on `index.html` and the guide,
  so a new version reaches teachers on their next visit.

Anything that needs a new origin in the CSP is a change to the promise, not a
configuration detail.
