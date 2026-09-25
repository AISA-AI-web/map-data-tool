#!/usr/bin/env node
// Builds the dashboard's demo data, and inlines it into index.html.
//
//   node sample/make-sample.mjs              write the two CSVs and inline them
//   node sample/make-sample.mjs --no-inline  write the two CSVs only
//   node sample/make-sample.mjs --report     also print the signals it built in
//
// The demo is a made-up grade 5 and 6 cohort at a made-up school, exported
// the way a teacher exports their own: one Achievement Status and Growth
// (ASG) file for Fall 2025 to Spring 2026, and one Class Profile file for the
// spring window carrying the instructional areas. loadSample() hands the two
// to the same multi-file path a teacher's two uploads take, so the demo
// exercises the merge that folds each student's ASG and Class Profile
// records into one.
//
//   sample/sample-asg.csv            -> SAMPLE_CSV in index.html
//   sample/sample-class-profile.csv  -> SAMPLE_CLASS_PROFILE_CSV
//
// Everything is drawn from one seeded generator (no Math.random), so a run
// rebuilds the same files byte for byte. Change SEED to draw a different
// cohort with the same shape.
//
// How the numbers are made, so they hang together the way NWEA's do:
//   - Scores come from the page's own norm tables (US_ACHIEVEMENT_NORMS and
//     US_GROWTH_NORMS, read out of index.html), so every percentile in the
//     files agrees with the norm comparisons the page draws from the RIT.
//     A percentile is the normal approximation Phi((RIT - mean) / SD),
//     rounded and held to 1-99 as NWEA reports it.
//   - Projected growth is the published fall-to-spring growth norm for the
//     grade and subject, conditioned on the starting score: a start score
//     regresses toward the middle (retest correlation RHO), so a low starter
//     projects more growth than a high one, and more so in reading, where the
//     spread does not widen over the year, than in maths, where it does.
//   - Observed growth = end RIT - start RIT. Growth index = observed -
//     projected. Conditional growth index = growth index / the growth norm's
//     SD, and the conditional growth percentile is Phi(CGI) as a whole
//     percentile, 1-99. Met projection is observed >= projected.
//   - The class-level columns (share that met, share of projected growth
//     met, median CGP, the two counts) are computed from the records of that
//     class and subject exactly as the ASG report computes them.
//
// The signals built in, so the analysis sections have something real to
// find without anything cartoonish (run with --report to see them measured):
//   - 6A grew notably more than typical in every subject; 5B grew less than
//     typical in Mathematics only.
//   - In Reading, lower starters grew more than similar students nationally
//     (catch-up growth, the pattern a school with many English learners
//     often shows), a mild negative start/growth relationship.
//   - A handful of genuine outliers, four tests with rapid guessing, one
//     short test, band moves both ways.
//   - Two students missed one spring test, and one joined in January and has
//     no fall scores, so the Data Check has something to say.
//   - Class Profile areas scatter around each student's overall RIT with
//     NWEA-sized standard errors; Vocabulary in Reading and Measurement and
//     Data in grade 5 Mathematics sit a little below the students' own
//     level class-wide, and Grammar and Usage in Language a little above.
//
// Nothing here is a real student, teacher or school.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const INDEX = path.join(root, "index.html");
const ASG_FILE = path.join(here, "sample-asg.csv");
const CP_FILE = path.join(here, "sample-class-profile.csv");
const args = new Set(process.argv.slice(2));
const INLINE = !args.has("--no-inline");
const REPORT = args.has("--report");

// Any seed draws a cohort with the same design; this one was kept because its
// draw shows each built-in signal at about its designed size, no larger.
const SEED = 24;
const RHO = 0.88;

// ---------------------------------------------------------------------------
// The norm tables, read from the page so the demo and the page cannot drift.
// ---------------------------------------------------------------------------
function readObjectLiteral(html, name) {
  const marker = "const " + name + " = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("make-sample: " + name + " not found in index.html.");
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < html.length; i += 1) {
    if (html[i] === "{") depth += 1;
    else if (html[i] === "}") {
      depth -= 1;
      if (depth === 0) return new Function("return " + html.slice(open, i + 1))();
    }
  }
  throw new Error("make-sample: " + name + " is not a closed object literal.");
}

const pageHTML = fs.readFileSync(INDEX, "utf8");
const ACHIEVEMENT = readObjectLiteral(pageHTML, "US_ACHIEVEMENT_NORMS");
const GROWTH = readObjectLiteral(pageHTML, "US_GROWTH_NORMS");

function achievementNorm(subject, grade, season) {
  const row = ACHIEVEMENT[subject][grade];
  const index = { fall: 0, winter: 1, spring: 2 }[season];
  return { mean: row[index * 2], sd: row[index * 2 + 1] };
}

function fallToSpringNorm(subject, grade) {
  const row = GROWTH[subject][grade];
  return { mean: row[4], sd: row[5] };
}

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
function gauss() {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function randInt(lo, hi) {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

// Normal CDF (Abramowitz and Stegun 7.1.26 through erf; error < 2e-7).
function phi(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const percentileFromZ = (z) => clamp(Math.round(phi(z) * 100), 1, 99);
const round1 = (value) => Math.round(value * 10) / 10;
const fixed = (value, digits) => {
  const text = value.toFixed(digits);
  return /^-0\.0+$/.test(text) ? text.slice(1) : text;
};
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// The school
// ---------------------------------------------------------------------------
const DISTRICT = "AISA (sample data)";
const SCHOOL = "AISA Demo School";
const TERM = "Spring 2025-2026";
const PERIOD = "Fall 2025 - Spring 2026";
const NORMS_YEAR = "2025";
// Weeks of instruction at each window, as NWEA reports them.
const WEEKS = { start: 3, end: 32 };

// The four subjects, as the two exports name them. The page reads Course
// first: "Language Usage" and "Math K-12" are the course names on a real
// export, and both resolve to the page's Language and Mathematics.
const SUBJECTS = [
  { key: "Reading", asgSubject: "Reading", course: "Reading", cpSubject: "Reading" },
  { key: "Language", asgSubject: "Language Arts", course: "Language Usage", cpSubject: "Language Usage" },
  { key: "Mathematics", asgSubject: "Mathematics", course: "Math K-12", cpSubject: "Mathematics" },
  { key: "Science", asgSubject: "Science", course: "Science K-12", cpSubject: "Science" }
];

// Growth, in conditional growth index units, above or below typical for the
// class and subject. The school sits a little above typical overall.
const SCHOOL_GROWTH = 0.08;
const CLASSES = [
  { name: "5A", grade: "5", teacher: "Okafor", level: 0.1, growth: { Reading: 0, Language: 0, Mathematics: 0.05, Science: -0.05 } },
  { name: "5B", grade: "5", teacher: "Lindqvist", level: 0, growth: { Reading: 0.05, Language: 0, Mathematics: -0.65, Science: 0 } },
  { name: "6A", grade: "6", teacher: "Rahimi", level: 0.15, growth: { Reading: 0.5, Language: 0.55, Mathematics: 0.6, Science: 0.5 } },
  { name: "6B", grade: "6", teacher: "Rahimi", level: -0.05, growth: { Reading: -0.05, Language: -0.1, Mathematics: 0, Science: -0.15 } }
];
// An international school: on average above the US middle.
const SCHOOL_LEVEL = 0.28;

// Diverse, international and made up. Unique first names, so a teacher can
// tell every chip apart, and unique full names.
const ROSTER = {
  "5A": ["Amara Mensah", "Omar Khoury", "Priya Iyer", "Haruto Tanaka", "Elena Rossi", "Santiago Herrera", "Zanele Nkosi", "Lukas Müller",
    "Layla Nasser", "Arjun Nair", "Yuna Nakamura", "Aylin Yılmaz", "Kwame Boateng", "Chloé Dubois", "Hamza Qureshi", "Freya Schmidt",
    "Min-jun Park", "Valentina Rojas", "Tendai Moyo", "Nils Andersson", "Mariam Aziz", "Eoin O'Donnell", "Kavya Chatterjee"],
  "5B": ["Karim Mansour", "Seo-yeon Kim", "Matteo Bianchi", "Adaeze Nwosu", "Rohan Menon", "Camila Castillo", "Dariush Karimi", "Anouk Jansen",
    "Kenji Sato", "Noor Farouk", "Thandiwe Dlamini", "Diego Vargas", "Ananya Reddy", "Tomas Novak", "Linh Tran", "Emir Demir",
    "Isla Campbell", "Kofi Asante", "Salma Darwish", "Mateus Silva", "Hana Yamamoto", "Oliver Bennett"],
  "6A": ["Yousef Saleh", "Sofia Papadopoulos", "Ishaan Kapoor", "Abebe Tesfaye", "Zofia Kowalska", "Joaquín Ortiz", "Shirin Hosseini", "Jia Hui Lim",
    "Hugo Fernandes", "Rania Hamdi", "Chidi Eze", "Astrid Nyberg", "Aarav Sharma", "Lucía Mendoza", "Minh Nguyen", "Inès Moreau",
    "Tariq Qasim", "Nia Mwangi", "Luka Horvat", "Defne Kaya", "Farhan Chowdhury", "Olivia Hughes", "Sora Watanabe", "Makena Ochieng"],
  "6B": ["Hadi Barakat", "Meera Pillai", "Mateo Ramírez", "Fatou Diallo", "Ilya Sokolov", "Zara Siddiqui", "Ji-ho Lee", "Isabela Costa",
    "Ayo Adeyemi", "Lina Sabbagh", "Arman Aliyev", "Saanvi Joshi", "Anya Ivanova", "Liam Walsh", "Reem Jaber", "Jun Wong",
    "Grace Okoro", "Faisal Othman", "Aditi Rao", "Tobias Berg", "Samira Haddad"]
};

// Split "Jia Hui Lim" as first "Jia Hui", last "Lim": the last word is the
// family name for every name on this roster.
function splitName(full) {
  const parts = full.split(" ");
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

// The records that tell a story. Everything else is the same generator.
const MISSED_SPRING = [
  { name: "Tendai Moyo", subject: "Science" },
  { name: "Emir Demir", subject: "Reading" }
];
const JOINED_IN_JANUARY = "Grace Okoro";
// Conditional growth index set outright: a far-out result either way.
const OUTLIERS = [
  { name: "Priya Iyer", subject: "Mathematics", cgi: 2.9 },
  { name: "Adaeze Nwosu", subject: "Science", cgi: 2.6 },
  { name: "Ilya Sokolov", subject: "Reading", cgi: -2.7 }
];
// NWEA's rapid-guessing share on the spring test, and what it did to the
// score and the clock.
const RAPID_GUESSERS = [
  { name: "Liam Walsh", subject: "Science", pct: 31, minutes: 16, cost: 9 },
  { name: "Omar Khoury", subject: "Reading", pct: 18, minutes: 27, cost: 7 },
  { name: "Noor Farouk", subject: "Science", pct: 14, minutes: 29, cost: 6 },
  { name: "Luka Horvat", subject: "Language", pct: 12, minutes: 31, cost: 5 }
];
// Finished very fast without enough rapid guessing to be flagged for it.
const SHORT_TEST = { name: "Freya Schmidt", subject: "Language", minutes: 19 };

// Class Profile instructional areas, in NWEA's goal order, with the class-
// wide lean of each (RIT above or below the student's own overall score; each
// subject's leans sum to zero, as areas scatter around the overall score).
const AREAS = {
  Reading: {
    test: { "5": "Growth: Reading 2-5 CCSS 2010 V4", "6": "Growth: Reading 6+ CCSS 2010 V4" },
    se: 7.4,
    areas: {
      all: [
        ["Literary Text: Key Ideas and Details", 1.0],
        ["Literary Text: Language, Craft, and Structure", 0.5],
        ["Informational Text: Key Ideas and Details", 0.5],
        ["Informational Text: Language, Craft, and Structure", 0.5],
        ["Vocabulary: Acquisition and Use", -2.5]
      ]
    }
  },
  Language: {
    test: { "5": "Growth: Language 2-12 CCSS 2010 V2", "6": "Growth: Language 2-12 CCSS 2010 V2" },
    se: 6.2,
    areas: {
      all: [
        ["Writing: Write, Revise Texts for Purpose and Audience", -1.0],
        ["Language: Understand, Edit for Grammar, Usage", 2.0],
        ["Language: Understand, Edit for Mechanics", -1.0]
      ]
    }
  },
  Mathematics: {
    test: { "5": "Growth: Math 2-5 CCSS 2010 V2", "6": "Growth: Math 6+ CCSS 2010 V2" },
    se: 6.6,
    areas: {
      "5": [
        ["Operations and Algebraic Thinking", 1.0],
        ["Number and Operations", 0.5],
        ["Measurement and Data", -3.0],
        ["Geometry", 1.5]
      ],
      "6": [
        ["Operations and Algebraic Thinking", 0.5],
        ["The Real and Complex Number Systems", 1.0],
        ["Geometry", -1.0],
        ["Statistics and Probability", -0.5]
      ]
    }
  },
  Science: {
    test: { "5": "Growth: Science 3-5 for use with NGSS 2013", "6": "Growth: Science 6-8 for use with NGSS 2013" },
    se: 6.4,
    areas: {
      all: [
        ["Life Science", 0.5],
        ["Earth and Space Science", -1.0],
        ["Physical Science", 0.5]
      ]
    }
  }
};
const MAX_AREAS = 5;

// Testing days. Each grade sits one subject a day; a few students sit a
// make-up session the week after.
const TEST_DAYS = {
  fall: {
    "5": { Reading: "2025-09-09", Language: "2025-09-11", Mathematics: "2025-09-16", Science: "2025-09-18" },
    "6": { Reading: "2025-09-10", Language: "2025-09-12", Mathematics: "2025-09-17", Science: "2025-09-19" },
    makeUp: ["2025-09-24", "2025-09-25"]
  },
  spring: {
    "5": { Reading: "2026-05-05", Language: "2026-05-07", Mathematics: "2026-05-12", Science: "2026-05-14" },
    "6": { Reading: "2026-05-06", Language: "2026-05-08", Mathematics: "2026-05-13", Science: "2026-05-15" },
    makeUp: ["2026-05-19", "2026-05-20"]
  }
};
// Typical minutes on each test; a student's own pace scales all of them.
const BASE_MINUTES = { Reading: 50, Language: 45, Mathematics: 55, Science: 42 };

// The Class Profile export writes dates month first.
function usDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return month + "/" + day + "/" + year;
}

// Lexile and Quantile measures from a RIT: a rough linear reading of NWEA's
// published linking, which is all a demo needs.
const lexileFromRIT = (rit) => Math.round((600 + (rit - 200) * 16.5) / 5) * 5 + "L";
const quantileFromRIT = (rit) => Math.round((565 + (rit - 200) * 15) / 5) * 5 + "Q";

// The quadrant labels use three levels on each axis, cut where the page's
// colour bands are cut: 40 and below is low, 41 to 60 average, 61 and above
// high. Growth reads the CGP, achievement the percentile of that window.
function growthLevel(cgp) {
  return cgp <= 40 ? "Low" : cgp <= 60 ? "Average" : "High";
}
function achievementLevel(percentile) {
  return percentile <= 40 ? "Low" : percentile <= 60 ? "Average" : "High";
}
const quadrant = (cgp, percentile) => growthLevel(cgp) + " Growth / " + achievementLevel(percentile) + " Achievement";

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
const students = [];
let serial = 0;
CLASSES.forEach((cls) => {
  ROSTER[cls.name].forEach((full) => {
    serial += 1;
    const { first, last } = splitName(full);
    students.push({
      id: "D" + String(250000 + serial),
      full,
      first,
      last,
      cls,
      // General attainment, shared across subjects.
      g: gauss(),
      // Growth that travels with the student across subjects.
      ownGrowth: gauss() * 0.25,
      // Pace at the keyboard, shared across tests.
      pace: Math.exp(gauss() * 0.18),
      // Still learning English. Not in either export; it only shapes scores.
      learningEnglish: rand() < 0.18,
      makeUp: { fall: rand() < 0.04, spring: rand() < 0.04 }
    });
  });
});

const names = new Set(students.map((s) => s.full));
if (names.size !== students.length) throw new Error("make-sample: two students share a name.");
const firstNames = new Set(students.map((s) => s.first));
if (firstNames.size !== students.length) throw new Error("make-sample: two students share a first name.");
const byName = new Map(students.map((s) => [s.full, s]));
[...MISSED_SPRING.map((x) => x.name), JOINED_IN_JANUARY, ...OUTLIERS.map((x) => x.name), ...RAPID_GUESSERS.map((x) => x.name), SHORT_TEST.name]
  .forEach((name) => { if (!byName.has(name)) throw new Error("make-sample: " + name + " is not on the roster."); });

const find = (list, student, subject) => list.find((item) => item.name === student.full && item.subject === subject) || null;

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
const records = [];
students.forEach((student) => {
  const { cls } = student;
  SUBJECTS.forEach((subject) => {
    const key = subject.key;
    const fall = achievementNorm(key, cls.grade, "fall");
    const spring = achievementNorm(key, cls.grade, "spring");
    const growthNorm = fallToSpringNorm(key, cls.grade);

    // Start score: the school's level, the class's, the student's own, and a
    // subject-specific part. Subjects correlate about 0.7, as MAP's do, and
    // the spread is a little narrower than the national one, as a single
    // school's usually is.
    let z = SCHOOL_LEVEL + cls.level + 0.8 * student.g + 0.5 * gauss();
    if (student.learningEnglish && (key === "Reading" || key === "Language")) z -= 0.75;
    if (student.learningEnglish && key === "Science") z -= 0.3;
    const startRIT = Math.round(fall.mean + z * fall.sd);
    const startZ = (startRIT - fall.mean) / fall.sd;

    // NWEA's projection: the typical gain for this grade and subject,
    // conditioned on the start score through the regression of the spring
    // score on the fall score.
    const slope = (1 - RHO * spring.sd / fall.sd) * fall.sd;
    const projected = Math.max(1, Math.round(growthNorm.mean - slope * startZ));

    // Growth against typical, in conditional growth index units: the
    // school's, the class's, the student's own, and the rest chance. In
    // Reading, lower starters gain a little more than similar students
    // nationally (the mild negative start/growth slope), and students still
    // learning English catch up in Reading and Language.
    let cgiTarget = SCHOOL_GROWTH + cls.growth[key] + student.ownGrowth + 0.85 * gauss();
    if (key === "Reading") cgiTarget += -0.3 * (startZ - SCHOOL_LEVEL);
    if (student.learningEnglish && (key === "Reading" || key === "Language")) cgiTarget += 0.45;
    // Past about three SD a result stops being a surprise and starts being a
    // typo; the far-out results this demo carries are the chosen ones below.
    cgiTarget = clamp(cgiTarget, -2.8, 2.8);
    const outlier = find(OUTLIERS, student, key);
    if (outlier) cgiTarget = outlier.cgi;
    const rapid = find(RAPID_GUESSERS, student, key);
    let observed = Math.round(projected + cgiTarget * growthNorm.sd);
    if (rapid) observed -= rapid.cost;
    const endRIT = startRIT + observed;
    const endZ = (endRIT - spring.mean) / spring.sd;

    // Test time and standard errors.
    const minutes = (base) => clamp(Math.round(base * student.pace * Math.exp(gauss() * 0.07)), 24, 110);
    const startMinutes = minutes(BASE_MINUTES[key]);
    let endMinutes = minutes(BASE_MINUTES[key] - 2);
    const short = SHORT_TEST.name === student.full && SHORT_TEST.subject === key;
    if (rapid) endMinutes = rapid.minutes;
    if (short) endMinutes = SHORT_TEST.minutes;
    const sem = (zScore) => clamp(round1(3.0 + 0.12 * Math.abs(zScore) + gauss() * 0.1), 2.8, 3.9);
    const startSEM = sem(startZ);
    const endSEM = rapid ? round1(3.6 + rand() * 0.4) : sem(endZ);

    let rapidPct;
    const u = rand();
    if (u < 0.55) rapidPct = 0;
    else if (u < 0.88) rapidPct = randInt(1, 4);
    else rapidPct = randInt(5, 8);
    if (rapid) rapidPct = rapid.pct;
    if (short) rapidPct = 6;

    const day = (season) => (student.makeUp[season] ? TEST_DAYS[season].makeUp[randInt(0, 1)] : TEST_DAYS[season][cls.grade][key]);
    const startDate = day("fall");
    const endDate = day("spring");

    // Area scores for the spring Class Profile.
    const spec = AREAS[key];
    const areaList = spec.areas.all || spec.areas[cls.grade];
    const raw = areaList.map(([name, lean]) => {
      let effect = lean;
      if (student.learningEnglish && key === "Reading") effect += name.startsWith("Vocabulary") ? -2.5 : 0.625;
      return { name, lean: effect, delta: effect + gauss() * 3 + gauss() * spec.se, se: round1(spec.se + (rand() - 0.5) * 0.8 + (rapid ? 0.8 : 0)) };
    });
    // Area scores rest on subsets of the same items, so together they sit
    // around the overall score: most of any shared drift is taken back out.
    const drift = raw.reduce((sum, area) => sum + area.delta - area.lean, 0) / raw.length;
    const areas = raw.map((area) => ({ name: area.name, rit: endRIT + Math.round(area.delta - 0.85 * drift), se: area.se }));

    records.push({
      student, cls, subject, key,
      startRIT, startSEM, startPercentile: percentileFromZ(startZ), startMinutes, startDate,
      endRIT, endSEM, endPercentile: percentileFromZ(endZ), endMinutes, endDate,
      projected, observed, growthSD: growthNorm.sd, rapidPct, areas,
      testName: spec.test[cls.grade],
      hasStart: student.full !== JOINED_IN_JANUARY,
      hasEnd: !find(MISSED_SPRING, student, key)
    });
  });
});

records.forEach((record) => {
  record.hasGrowth = record.hasStart && record.hasEnd;
  if (!record.hasGrowth) return;
  record.growthIndex = record.observed - record.projected;
  record.cgi = Math.round(record.growthIndex / record.growthSD * 100) / 100;
  record.cgp = percentileFromZ(record.cgi);
  record.met = record.observed >= record.projected;
  // NWEA's asterisk on the growth call, where test time changed by 30% or
  // more between the windows: a change in how the test was taken that NWEA's
  // growth reports flag as possibly affecting the result.
  record.qualified = Math.abs(record.endMinutes - record.startMinutes) / record.startMinutes >= 0.3;
  record.growthSE = round1(Math.sqrt(record.startSEM ** 2 + record.endSEM ** 2));
});

// Class-level columns, per class and subject, from the records with growth.
const classStats = new Map();
records.forEach((record) => {
  const key = record.cls.name + "|" + record.key;
  if (!classStats.has(key)) classStats.set(key, []);
  if (record.hasGrowth) classStats.get(key).push(record);
});
classStats.forEach((list, key) => {
  const met = list.filter((record) => record.met).length;
  const observed = list.reduce((sum, record) => sum + record.observed, 0);
  const projected = list.reduce((sum, record) => sum + record.projected, 0);
  classStats.set(key, {
    count: list.length,
    met,
    pctMet: Math.round(met / list.length * 100),
    pctProjectedMet: Math.round(observed / projected * 100),
    medianCGP: Math.round(median(list.map((record) => record.cgp)))
  });
});

// ---------------------------------------------------------------------------
// The two exports
// ---------------------------------------------------------------------------
const SUBJECT_ORDER = SUBJECTS.map((subject) => subject.key);
const ordered = records.slice().sort((a, b) =>
  a.cls.name.localeCompare(b.cls.name) ||
  SUBJECT_ORDER.indexOf(a.key) - SUBJECT_ORDER.indexOf(b.key) ||
  a.student.last.localeCompare(b.student.last) ||
  a.student.first.localeCompare(b.student.first));

const ASG_COLUMNS = [
  ["TermTested", () => TERM],
  ["TermRostered", () => TERM],
  ["DistrictName", () => DISTRICT],
  ["SchoolName", () => SCHOOL],
  ["Teacher", (r) => r.cls.teacher],
  ["ClassName", (r) => r.cls.name],
  ["Subject", (r) => r.subject.asgSubject],
  ["Course", (r) => r.subject.course],
  ["ASGType", () => "Class"],
  ["GrowthComparisonPeriod", () => PERIOD],
  ["NormsReferenceData", () => NORMS_YEAR],
  ["WIStartTerm", () => WEEKS.start],
  ["WIEndTerm", () => WEEKS.end],
  ["StudentID", (r) => r.student.id],
  ["StudentLastName", (r) => r.student.last],
  ["StudentFirstName", (r) => r.student.first],
  ["StudentGrade", (r) => r.cls.grade],
  ["TestDate", (r) => (r.hasStart ? r.startDate : "")],
  ["StartRIT", (r) => (r.hasStart ? r.startRIT : "")],
  ["StartRITSEM", (r) => (r.hasStart ? fixed(r.startSEM, 1) : "")],
  ["StartPercentile", (r) => (r.hasStart ? r.startPercentile : "")],
  ["StartTestDuration", (r) => (r.hasStart ? r.startMinutes : "")],
  ["EndTestDate", (r) => (r.hasEnd ? r.endDate : "")],
  ["EndRIT", (r) => (r.hasEnd ? r.endRIT : "")],
  ["EndRITSEM", (r) => (r.hasEnd ? fixed(r.endSEM, 1) : "")],
  ["EndPercentile", (r) => (r.hasEnd ? r.endPercentile : "")],
  ["EndTestDuration", (r) => (r.hasEnd ? r.endMinutes : "")],
  ["ProjectedRIT", (r) => (r.hasStart ? r.startRIT + r.projected : "")],
  ["ProjectedGrowth", (r) => (r.hasStart ? r.projected : "")],
  ["ObservedGrowth", (r) => (r.hasGrowth ? r.observed : "")],
  ["ObservedGrowthSE", (r) => (r.hasGrowth ? fixed(r.growthSE, 1) : "")],
  ["GrowthIndex", (r) => (r.hasGrowth ? r.growthIndex : "")],
  ["MetGrowthProjection?", (r) => (r.hasGrowth ? (r.met ? "Yes" : "No") + (r.qualified ? "*" : "") : "")],
  ["ConditionalGrowthIndex", (r) => (r.hasGrowth ? fixed(r.cgi, 2) : "")],
  ["ConditionalGrowthPercentile", (r) => (r.hasGrowth ? r.cgp : "")],
  ["CountofStudentswithGrowthProjectionAvailableandValidBeginningandEndingTermScores", (r) => classStats.get(r.cls.name + "|" + r.key).count],
  ["CountofStudentswhoMetorExceededtheirProjectedGrowth", (r) => classStats.get(r.cls.name + "|" + r.key).met],
  ["PercentageofStudentswhoMetorExceededtheirProjectedRIT", (r) => classStats.get(r.cls.name + "|" + r.key).pctMet],
  ["PercentageofProjectedGrowthMet", (r) => classStats.get(r.cls.name + "|" + r.key).pctProjectedMet],
  ["MedianConditionalGrowthPercentile", (r) => classStats.get(r.cls.name + "|" + r.key).medianCGP],
  ["StartGrowthandAchievement", (r) => (r.hasGrowth ? quadrant(r.cgp, r.startPercentile) : "")],
  ["EndGrowthandAchievement", (r) => (r.hasGrowth ? quadrant(r.cgp, r.endPercentile) : "")],
  ["ConditionalGrowthPercentileAxis", (r) => (r.hasGrowth ? r.cgp : "")],
  ["AchievementPercentileAxis", (r) => (r.hasGrowth ? r.endPercentile : "")]
];

// The ASG file is written with no quoting at all, so build-guide.js can
// split it on commas to make the fall file the guide pictures.
function asgCell(value) {
  const text = String(value);
  if (/[",\r\n`\\]|\$\{/.test(text)) throw new Error("make-sample: ASG cell needs quoting: " + text);
  return text;
}
const asgLines = [ASG_COLUMNS.map(([name]) => name).join(",")].concat(
  ordered.map((record) => ASG_COLUMNS.map(([, get]) => asgCell(get(record))).join(",")));

const CP_COLUMNS = [
  ["Term Tested", () => TERM],
  ["District Name", () => DISTRICT],
  ["School Name", () => SCHOOL],
  ["Instructor Name", (r) => r.cls.teacher],
  ["Class Name", (r) => r.cls.name],
  ["Student ID", (r) => r.student.id],
  ["Student Last Name", (r) => r.student.last],
  ["Student First Name", (r) => r.student.first],
  ["Student Grade", (r) => r.cls.grade],
  ["Subject", (r) => r.subject.cpSubject],
  ["Course", (r) => r.subject.course],
  ["Test Name", (r) => r.testName],
  ["Date Tested", (r) => usDate(r.endDate)],
  ["Duration", (r) => r.endMinutes],
  ["Test RIT Score", (r) => r.endRIT],
  ["Standard Error", (r) => fixed(r.endSEM, 1)],
  ["Test Percentile", (r) => r.endPercentile],
  ["Percent Rapid Guessed", (r) => r.rapidPct],
  ["Lexile", (r) => (r.key === "Reading" ? lexileFromRIT(r.endRIT) : "")],
  ["Quantile", (r) => (r.key === "Mathematics" ? quantileFromRIT(r.endRIT) : "")]
];
for (let i = 1; i <= MAX_AREAS; i += 1) {
  CP_COLUMNS.push(["Instructional Area " + i + " Name", (r) => (r.areas[i - 1] ? r.areas[i - 1].name : "")]);
  CP_COLUMNS.push(["Instructional Area " + i + " RIT", (r) => (r.areas[i - 1] ? r.areas[i - 1].rit : "")]);
  CP_COLUMNS.push(["Instructional Area " + i + " StdErr", (r) => (r.areas[i - 1] ? fixed(r.areas[i - 1].se, 1) : "")]);
}

function cpCell(value) {
  const text = String(value);
  if (/[`\\\r\n]|\$\{/.test(text)) throw new Error("make-sample: Class Profile cell cannot be inlined: " + text);
  return /[",]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
// One row per spring test: the Class Profile describes the window tested.
const cpRecords = ordered.filter((record) => record.hasEnd);
const cpLines = [CP_COLUMNS.map(([name]) => cpCell(name)).join(",")].concat(
  cpRecords.map((record) => CP_COLUMNS.map(([, get]) => cpCell(get(record))).join(",")));

const asgText = asgLines.join("\n");
const cpText = cpLines.join("\n");
fs.writeFileSync(ASG_FILE, asgText + "\n");
fs.writeFileSync(CP_FILE, cpText + "\n");
console.log("wrote sample/sample-asg.csv (" + (asgLines.length - 1) + " records, " + (Buffer.byteLength(asgText) / 1024).toFixed(1) + " KB)");
console.log("wrote sample/sample-class-profile.csv (" + (cpLines.length - 1) + " records, " + (Buffer.byteLength(cpText) / 1024).toFixed(1) + " KB)");

// ---------------------------------------------------------------------------
// Inline, in the style of brand/make-brand-assets.mjs: every substitution
// must match exactly once.
// ---------------------------------------------------------------------------
function inline() {
  let html = fs.readFileSync(INDEX, "utf8");
  const swap = (label, pattern, replacement) => {
    const matches = html.match(new RegExp(pattern.source, "g")) || [];
    if (matches.length !== 1) throw new Error(`make-sample: "${label}" matched ${matches.length} time(s), expected 1.`);
    html = html.replace(pattern, () => replacement);
  };
  swap("SAMPLE_CSV", /const SAMPLE_CSV = `[^`]*`;/, "const SAMPLE_CSV = `" + asgText + "`;");
  swap("SAMPLE_CLASS_PROFILE_CSV", /const SAMPLE_CLASS_PROFILE_CSV = `[^`]*`;/, "const SAMPLE_CLASS_PROFILE_CSV = `" + cpText + "`;");
  fs.writeFileSync(INDEX, html);
  console.log("inlined both files into index.html");
}
if (INLINE) inline();

// ---------------------------------------------------------------------------
// What was built in, measured on the files just written.
// ---------------------------------------------------------------------------
if (REPORT) {
  const growthRecords = records.filter((record) => record.hasGrowth);
  const pearson = (xs, ys) => {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0; let sxx = 0; let syy = 0;
    for (let i = 0; i < n; i += 1) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    return sxy / Math.sqrt(sxx * syy);
  };
  console.log("\n" + students.length + " students, " + records.length + " ASG records (" + growthRecords.length + " with growth), " + cpRecords.length + " Class Profile records");
  console.log("learning English (not exported): " + students.filter((s) => s.learningEnglish).length);
  console.log("\nmedian CGP by class and subject");
  CLASSES.forEach((cls) => {
    console.log("  " + cls.name + "  " + SUBJECT_ORDER.map((key) => key.slice(0, 4) + " " + String(classStats.get(cls.name + "|" + key).medianCGP).padStart(2)).join("  ") +
      "   all " + Math.round(median(growthRecords.filter((r) => r.cls === cls).map((r) => r.cgp))));
  });
  console.log("\nstart percentile vs CGP, r by subject");
  SUBJECT_ORDER.forEach((key) => {
    const list = growthRecords.filter((r) => r.key === key);
    console.log("  " + key.padEnd(12) + pearson(list.map((r) => r.startPercentile), list.map((r) => r.cgp)).toFixed(3) + "  (n " + list.length + ")");
  });
  console.log("  all         " + pearson(growthRecords.map((r) => r.startPercentile), growthRecords.map((r) => r.cgp)).toFixed(3));
  const cgis = growthRecords.map((r) => r.cgi);
  const mean = cgis.reduce((a, b) => a + b, 0) / cgis.length;
  const sd = Math.sqrt(cgis.reduce((a, b) => a + (b - mean) ** 2, 0) / (cgis.length - 1));
  const far = growthRecords.filter((r) => Math.abs((r.cgi - mean) / sd) >= 2);
  console.log("\nCGI mean " + mean.toFixed(2) + ", SD " + sd.toFixed(2) + "; " + far.length + " results 2+ SD out: " +
    far.map((r) => r.student.full + " " + r.key + " " + fixed(r.cgi, 2)).join("; "));
  const band = (p) => (p <= 20 ? 1 : p <= 40 ? 2 : p <= 60 ? 3 : p <= 80 ? 4 : 5);
  const up = growthRecords.filter((r) => band(r.endPercentile) > band(r.startPercentile)).length;
  const down = growthRecords.filter((r) => band(r.endPercentile) < band(r.startPercentile)).length;
  console.log("band moves: " + up + " up, " + down + " down");
  console.log("met projection: " + growthRecords.filter((r) => r.met).length + " of " + growthRecords.length +
    "; qualified (*): " + growthRecords.filter((r) => r.qualified).length);
  console.log("median start percentile " + median(records.filter((r) => r.hasStart).map((r) => r.startPercentile)) +
    ", median end percentile " + median(records.filter((r) => r.hasEnd).map((r) => r.endPercentile)));
}
