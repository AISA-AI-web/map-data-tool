// The storyboard for the video source pack: one entry per scene, in the
// order the video plays them. Each scene names its screenshot (numbered from
// its position here), the words that go with it and, for the scenes that are
// a picture of one part of the page, where that picture starts and ends.
// Numbers quoted in the text are the fictional sample's, as the screenshots
// show them; rerun the build and check them if the sample changes.

import { TEXT, GLOSSARY } from "./script-text.mjs";

export { GLOSSARY };

const S = (slug, title, part, shot) => ({ slug, title, part, shot, ...TEXT[slug] });

const RAW = [
  S("landing", "The landing page", "Getting started"),
  S("getting-started", "The Getting Started card", "Getting started"),
  S("export-steps", "How do I get this file? The NWEA export steps", "Getting started"),
  S("sample-loaded", "Sample data loaded", "Getting started"),
  S("filters-and-jump-to", "Filters and the Jump to bar", "Finding your way"),
  S("essentials-vs-full", "Essentials or the full analysis", "Finding your way"),
  S("briefing", "Spoken Briefing", "Essentials", { from: "#sec-briefing" }),
  S("insights", "Insights: the headline numbers", "Essentials", { from: "#sec-insights", to: ".insights-kpis" }),
  S("insights-findings", "Insights: what stands out", "Essentials", { from: ".insights-controls", to: ".insights-list > li:nth-child(2)", padBottom: 6 }),
  S("class-snapshot", "Class Snapshot", "Essentials", { from: "#sec-snapshot" }),
  S("achievement-profile", "Achievement Profile (tiers)", "Full analysis", { from: "#sec-baseline", to: "#tierLadder" }),
  S("subject-overview", "Subject Overview", "Full analysis", { from: "#sec-overview" }),
  S("subject-charts", "Subject Charts", "Full analysis", { from: "#sec-charts", to: "#chartsWrap > section:nth-child(1)" }),
  S("distributions", "Distributions", "Full analysis", { from: "#sec-distributions", to: ".dist-card" }),
  S("growth-and-achievement", "Growth and Achievement: the quadrants", "Essentials", { from: "#sec-growth", to: "#quadrantMovement" }),
  S("growth-quadrant-maps", "Growth and Achievement: by subject", "Essentials", { from: "#quadrantBreakdownTitle", to: "#quadrantSubjectBreakdown > article:nth-child(1) .quadrant-map", pad: 8 }),
  S("movement", "Movement", "Full analysis", { from: ".move-scope", to: ".move-matrix-card" }),
  S("gap-closure", "Gap Closure", "Full analysis", { from: "#sec-gap", to: "#gapCards" }),
  S("growth-goals", "Growth Goals", "Essentials", { from: "#sec-goals", height: 700 }),
  S("action-board", "Action Board", "Essentials", { from: "#sec-actions" }),
  S("what-would-it-take", "What Would It Take? (targets)", "Full analysis", { from: "#sec-target", height: 700 }),
  S("cross-subject", "Cross-Subject Profiles", "Full analysis", { from: "#sec-crosssubject", height: 700 }),
  S("heatmap", "Heatmap: groups by subject", "Full analysis", { from: "#sec-heatmap", to: "#heatmapMatrix" }),
  S("heatmap-student-areas", "Heatmap: students by instructional area", "Full analysis", { from: "#heatmapAreas", height: 780 }),
  S("instructional-areas", "Instructional Areas", "Full analysis", { from: "#strandCards", to: "#strandSubjects > article:nth-child(1)", pad: 10 }),
  S("class-summary", "Class Summary Report", "Full analysis", { from: "#sec-summary" }),
  S("explorer", "Explorer", "Full analysis", { from: "#explorerWrap" }),
  S("table-groups", "Table Groups and Seating Plan", "Full analysis", {
    from: "#sec-tables", height: 740,
    before: async (page) => {
      // A seating plan is for one room: pick class 5A, as the page suggests.
      await page.evaluate(() => document.querySelector("#sec-tables [data-plan-class='5A']").click());
      await page.waitForTimeout(700);
    }
  }),
  S("seating-planner", "The seating planner room view", "Full analysis", {
    shoot: async (page) => {
      await page.click("#plannerLaunch");
      await page.waitForFunction("state.plannerOpen === true");
      await page.waitForTimeout(800);
      const buffer = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
      await page.click("#plannerClose");
      await page.waitForTimeout(400);
      return buffer;
    },
    after: async (page) => {
      await page.evaluate(() => document.getElementById("resetFiltersBtn").click());
      await page.waitForTimeout(700);
    }
  }),
  S("student-grouping", "Student Grouping Report", "Full analysis", { from: "#sec-grouping" }),
  S("priority-students", "Priority Students", "Essentials", { from: "#sec-priority" }),
  S("wall-posters", "Wall Posters", "Essentials", { from: "#posterGrid", to: "#posterGrid > article:nth-of-type(8)" }),
  S("quiz", "Check My Understanding (quiz)", "Essentials", {
    from: "#sec-quiz",
    before: async (page) => {
      await page.click("[data-quiz-action='start']");
      await page.waitForTimeout(200);
      const wrong = await page.evaluate(() => (state.quiz.questions[0].answer + 1) % state.quiz.questions[0].options.length);
      await page.click("[data-quiz-answer='" + wrong + "']");
      await page.waitForTimeout(250);
    }
  }),
  S("celebration", "Celebration Students", "Full analysis", { from: "#sec-celebration" }),
  S("data-check", "Data Check", "Full analysis", { from: "#sec-quality", to: "#qualityDetail > :nth-child(4)" }),
  S("section-help", "Every section explains itself", "Help and outputs"),
  S("student-spotlight", "A student's spotlight", "Help and outputs"),
  S("goal-sheet-print", "Printed goal sheets", "Help and outputs"),
  S("fall-baseline", "A fall file: the page adapts", "Other situations"),
  S("fall-starting-point", "Starting Point on a fall file", "Other situations"),
  S("dark-mode", "Dark mode", "Other situations"),
  S("phone-view", "On a phone", "Other situations"),
  S("privacy-offline", "Private, offline, free", "Close")
];

// Spoken length: about 2.7 words a second (160 a minute), plus a beat.
const seconds = (text) => Math.round(text.split(/\s+/).length / 2.7 + 1);

export const SCENES = RAW.map((scene, index) => {
  for (const key of ["caption", "onScreen", "tells", "say", "tip"]) {
    if (!scene[key]) throw new Error("scene " + scene.slug + " has no " + key);
  }
  return {
    ...scene,
    n: index + 1,
    file: String(index + 1).padStart(2, "0") + "-" + scene.slug + ".png",
    seconds: seconds(scene.say)
  };
});
