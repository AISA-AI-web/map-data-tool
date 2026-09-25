# teachermap.ensdashboards.xyz

This directory is **generated**. Do not edit `index.html` here.

It is built from the repository root `index.html` by:

    node build/build-clone.mjs

The build applies the differences that make this a separate instance — the
teal and wine palette, the ENS Dashboards title and favicon, and the removal
of the support prompt — and asserts that every one of them matched. If the
upstream page changes in a way that moves a token or a block, the build fails
rather than shipping a half-themed page.

So the workflow for any dashboard change is: edit the root `index.html`, run
the build, commit both.

## The user guide

`teacher-dashboard-guide.pdf` in this directory is the instance's own copy of
the guide, built from this instance's page so the pictures carry its colours
and its name. The page links to it relatively, so it has to be here or the
link is dead. Rebuild it after the clone build whenever a section changes:

    GUIDE_INDEX=ensdashboards/index.html \
    GUIDE_OUTPUT=ensdashboards/teacher-dashboard-guide.pdf \
    GUIDE_TITLE="Teacher MAP Dashboard | ENS Dashboards" \
    node guide/build-guide.js

`vercel.json` exempts the PDF from the frame-denying headers the page itself
carries, because a browser's PDF viewer loads the document inside a frame.

## Where the brand comes from

The logo is the Emirates National Schools mark, checked in at
`build/assets/ens-logo.png` (the full lockup) and `build/assets/ens-symbol.png`
(the symbol alone, for the favicon — 709x130 of Arabic and English is a smear
at 16px). Replace either file and rebuild; nothing else needs editing.

Both are inlined as data URIs. A logo on a CDN would be the one request that
breaks the promise the upload panel makes, and the first thing to vanish on a
school network that blocks image hosts.

The palette steps come from the ENS Dashboards portal (`rainetech/ens-portal`,
`tailwind.config.ts`), so this dashboard and the portal that links to it read
as one product. The portal calls the second colour *plum*, so this does too.

### The logo and the brand colours do not match

Worth knowing before anyone tries to "fix" it. The logo file is plain sRGB and
contains **teal #007c85 and plum #a30046**. The brand colours specified for
this instance — and the ones the portal's config uses — are **#007272 and
#8e2344**. That is a CIE76 Delta E of 6.8 and 13.4: not a colour-management
artefact, and far enough apart to look like a printing error if the two teals
ever share an edge.

The interface therefore uses the specified colours, and the logo is always
placed on white, where its own teal never abuts the interface's. If the logo
file is the canonical brand rather than the hex values, the fix is to change
the palette in `build/build-clone.mjs` — not to recolour the logo.

## The Vercel project

Already created and building from this directory:

- Project: `teachermap` (`prj_Ty8HzQDdj0dv0k6jLM0KAtU2u7kH`)
- Team: `ENS_Platforms` (slug `ensplatforms`, `team_Iwl363H4TKfoqdwtWfICSO0V`)
- Linked to `rainetech/teachermapdata.github.io`, production branch `main`
- Root Directory: `ensdashboards`

Pushing to `main` redeploys it. GitHub Pages still serves the repository root
independently, so both sites come from the same commit.

### Why the .vercel.app URL asks you to log in

Deployment protection is left at Vercel's default, `Vercel Authentication`
scoped to *all except custom domains*. That means `teachermap.vercel.app` and
every preview URL sit behind a Vercel login, and the custom domain is public.
That is the right way round for this project - teachers reach it on the real
domain, and half-finished preview builds are not indexable - so if the
`.vercel.app` link asks for a login, it is working as intended rather than
broken.

## Deploying

Vercel project settings:

- **Root Directory**: `ensdashboards`
- **Framework Preset**: Other
- **Build Command**: none (leave empty — the file is already built)
- **Output Directory**: leave empty

`vercel.json` sets the security headers. The Content-Security-Policy is
deliberately strict: the dashboard loads no scripts, styles, fonts or images
from anywhere, and `connect-src 'none'` means the page cannot make a network
request even if one were somehow introduced. That is the same promise the
upload panel makes to teachers, enforced by the browser rather than trusted.

## Custom domain

Add `teachermap.ensdashboards.xyz` in the Vercel project's Domains tab, then
create the DNS record Vercel shows you on the `ensdashboards.xyz` zone —
normally a CNAME on the `teachermap` host pointing at `cname.vercel-dns.com`.
