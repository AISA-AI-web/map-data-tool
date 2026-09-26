# Video source pack

`aisa-map-dashboard-video-pack.pdf` is a storyboard for Google NotebookLM's
Video Overview: one page per scene, each with a real screenshot of the
dashboard, its file name, what is on screen, what it tells a teacher, a
ready-to-speak narration, a teacher tip and a timing. It opens with a page
addressed to NotebookLM (follow the scenes in order, show each scene's
screenshot while narrating it, keep the privacy message, invent nothing, the
demo data is fictional) and ends with a glossary and a screenshot index.

`screenshots/` holds the same pictures as numbered PNGs (`01-landing.png` ...
`43-privacy-offline.png`), captured from `../../index.html` with its own
*Load Sample Data* demo (fictional AISA Demo School, grades 5-6).

## Rebuilding

    PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node docs/video/build-video-pack.mjs

It opens the page in Chromium (1440 wide, light theme, captured at 2x and
saved at 1.5x), photographs every scene, fails if the page logs any error,
and prints the PDF. `SKIP_CAPTURE=1` rebuilds the PDF from the PNGs already
here; `PACK_HTML=1` also writes the PDF's HTML for checking the text.

- `scenes.mjs` - the scene order and, for each section scene, where its
  picture starts and ends on the page.
- `script-text.mjs` - the words for every scene and the glossary. Numbers
  quoted there are the sample's as the screenshots show them: if the sample
  or a section changes, rebuild and reread them. Timings are computed from
  the narration's length (about 160 words a minute).
- The fall (single-window) scenes use the sample with its spring window
  blanked, made the same way `build-guide.js` makes it.
- The quiz draws its questions at random, so the capture seeds the page's
  `Math.random`: every rebuild shows the same question, and the words written
  for Scene 33 stay true. Change the seed and you must rewrite that scene.
- The running header and footer carry their own copy of DM Sans, so the
  whole PDF is set in the brand font.
- Headless Chromium has no system voices, so the capture gives the page one
  stand-in voice ("System voice") to show the Spoken Briefing as it looks on
  a teacher's laptop; nothing is spoken.
