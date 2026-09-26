// The words of the video source pack, one entry per scene (keyed by the
// scene's slug in scenes.mjs). Facts come from the page itself: SECTION_HELP,
// the README and what each screenshot shows. Numbers are the fictional
// sample's ("demo data") and must match the screenshots: after a change to
// the sample, rebuild and reread them.
//
//   caption   one line under the picture and in the screenshot index
//   onScreen  what is visible, so the narration can point at it
//   tells     what it means for a teacher
//   say       the narration, ready to speak (its length sets the timing)
//   tip       the practical takeaway

export const TEXT = {
  "landing": {
    caption: "The dashboard as it opens, before any file is loaded: the purple masthead with the AISA seal and the Load MAP Data panel.",
    onScreen: "The deep purple masthead: the American International School in Abu Dhabi logo top left, the full white AISA seal, the title “Teacher Dashboard” and five question chips (Who grew? Who needs support? Who closed gaps? How do I group them? Can I explain this data?). On the right, the white “Load MAP Data” panel: a dashed drop box, the Load Sample Data and “How do I get this file?” buttons, zero records and students, and a green dot beside the privacy line at the bottom.",
    tells: "This is the whole setup. There is no account, no install and no server: the dashboard is one web page that runs in the teacher’s own browser.",
    say: "This is the AISA Teacher MAP Dashboard. It turns the files you already export from NWEA MAP Growth into a plan for your class, with nothing to install and no sign-in. And notice the line at the bottom: your file never leaves this browser.",
    tip: "Drop your CSV files on the dashed box, or press Load Sample Data to explore everything first with fictional students."
  },
  "getting-started": {
    caption: "The Getting Started card under the upload panel: three steps from NWEA export to a plan.",
    onScreen: "The Getting Started card, \u201cTurn your MAP data into a plan in under a minute\u201d: \u201cNo sign-in, no setup\u201d, a note that a fall upload with one test window switches to a start-of-year view, the purple \u201cTry it with sample data\u201d button and \u201cUpload my CSV\u201d, a link to the user guide, and on the right three numbered steps: 1 Export two reports from NWEA MAP, 2 Upload it here, 3 Plan with confidence.",
    tells: "The whole workflow is three steps: export, upload, plan. No sign-in and no setup.",
    say: "A Getting Started card walks you through it. There are just three steps: export two reports from NWEA, upload them here, and plan. Or try it first with the sample data.",
    tip: "Not ready to export? Try it with sample data: a fictional class loaded exactly the way yours would be."
  },
  "export-steps": {
    caption: "\u201cHow do I get this file?\u201d opens the NWEA export steps and what the tool reads.",
    onScreen: "The panel \u201cWhich files do I export, and what does this tool read?\u201d. Left: \u201cExporting from NWEA MAP Growth - you need both\u201d, four numbered steps (sign in and open MAP Reports; run the Achievement Status and Growth report and download it as CSV; run the Class Profile report once per subject as CSV; upload them all together), then \u201cGet both right\u201d. Right: \u201cGood to know\u201d, covering automatic column matching, suppressed values, fall uploads, and that nothing is persisted. Below: a link to the user guide.",
    tells: "Two exports give the full picture: the Achievement Status and Growth (ASG) report carries growth; the Class Profile report, one per subject, carries the instructional areas. Same class, same term, every student in both.",
    say: "In MAP Reports, download the Achievement Status and Growth report as a CSV, plus the Class Profile report for each subject. Then select all the files at once and drop them in.",
    tip: "If the two exports disagree about a student\u2019s score, the Data Check names the student and both figures, so you can check the exports."
  },
  "sample-loaded": {
    caption: "After Load Sample Data: the one-line masthead, the file stats and the green “Growth file” banner.",
    onScreen: "The masthead shrinks to one line: logo, “Teacher Dashboard”, the question chips and the Dark and Motion buttons. Under it: Change file, RECORDS 360, STUDENTS 90, FILE Sample data. Then a banner with a green GROWTH FILE chip: “Fall 2025 to Spring 2026. 354 records carry both windows, so growth, gap closure and quadrant movement are all measured.” (demo data).",
    tells: "The banner says at once what kind of file was loaded and so what the page can measure. A record is one student in one subject: 90 students in 4 subjects make 360 records.",
    say: "Here is the built-in sample: 90 fictional grade 5 and 6 students. That is 360 records. The green banner says it is a growth file, Fall 2025 to Spring 2026, so growth can be measured.",
    tip: "Read the banner first: it tells you whether growth figures exist for the file you loaded."
  },
  "filters-and-jump-to": {
    caption: "The filter bar with More filters open, and the Jump to bar as the page opens.",
    onScreen: "Search (Student name or ID), Subject and Class drop-downs, the Fewer filters and Reset buttons. The second row, opened by More filters: Overview Lens, Teacher, Grade, End Band, Tier, Met Growth, Group and Gap Status. Below it, the Jump to bar: Briefing, Insights, Snapshot, Growth, Goals, Actions, Priority, Posters, Quiz, and a dashed “More analysis (16)” pill.",
    tells: "Every section, card, poster and export follows these filters, so one choice turns the whole page into a view of one class, one subject or one group of students.",
    say: "Everything follows these filters. Choose a class or a subject, and every card, chart and poster describes just that group. The Jump to bar takes you straight to any section.",
    tip: "Filter to one class before a data meeting or before printing posters. Reset clears everything."
  },
  "essentials-vs-full": {
    caption: "Essentials versus the full analysis: the Jump to bar in both states, and the More analysis card between them.",
    onScreen: "Top: the Jump to bar in the essentials view, nine sections and “More analysis (16)”. Middle: the More analysis card at the foot of the essentials, naming the 16 further sections, with a “Show the full analysis” button. Bottom: the Jump to bar in the full view, every section from Briefing to Data Check, ending with an “Essentials only” pill.",
    tells: "The page is not overwhelming: it opens on the nine sections a class teacher acts on each term, and the deeper analysis is one click away.",
    say: "The page opens on nine essentials, so it never overwhelms. More analysis adds sixteen deeper sections. The page remembers your choice, and Essentials only takes you back.",
    tip: "Start with the essentials; open the full analysis when you prepare for a department or leadership conversation."
  },
  "briefing": {
    caption: "Spoken Briefing: a narrated walk through the file, read aloud by the teacher’s own device.",
    onScreen: "The first slide, “Our class”, with big numbers (90 students, 360 records, 4 subjects; demo data) and its spoken text. A row of scene chips: The file, Where the group is, Growth, By subject, What to do next, Before you act on it. Play briefing and Stop buttons top right; arrows, a Voice picker and a Speed slider; the note that no audio is uploaded; and “Read the transcript instead”.",
    tells: "A short, shared summary of the file that everyone in a meeting hears together, built from the same figures as the sections below and following the filters.",
    say: "The Spoken Briefing reads a short summary of your data aloud. It uses your own device\u2019s voice, so nothing is sent anywhere. Play it at the start of a data meeting, or read the transcript.",
    tip: "Play it at the start of a data meeting, filtered to the class the meeting is about, so everyone starts from the same summary."
  },
  "insights": {
    caption: "Insights: six headline tiles, each set against a national reference.",
    onScreen: "Six tiles (demo data): Records in view 360 (90 students, 354 with both test windows); Median percentile 67th, “+17 vs US 50th”; At or above the 61st 58%, “+18 pts vs US 40%”; Met growth projection 57%, “+7 pts vs US 50%”; Median growth (CGP) 55.5, “+5.5 vs typical 50”; Mean RIT change +7.0, “+1.6 vs projected”. Small bars and histograms mark where the US reference sits. Copy findings and Export findings CSV buttons top right.",
    tells: "In one row: whether the group is above or below national references, for achievement and for growth.",
    say: "Insights starts with the headline numbers, each against a national reference. In the sample, the median student sits at the 67th percentile. And 57 percent met their growth projection, where about half nationally would.",
    tip: "The tiles follow your filters: choose one class and they describe that class."
  },
  "insights-findings": {
    caption: "Insights, further down: the ranked “What stands out” findings, each saying how sure it is.",
    onScreen: "A “Compare groups by” switch (Subjects, Classes, Teachers, Grades). “What stands out 7”. Finding 1, Achievement, marked Strong evidence: “Achievement sits above the national middle”, 65th median percentile, 58% at or above the 61st, and a dot plot against the US 50th. Finding 2, Growth, Strong evidence: “Growth is running above typical”, median growth percentile 55, 61% of students grew more than typical. Each card ends with a “How sure” line: students, test, p-value and 95% range (demo data).",
    tells: "Findings are ranked by the strength of the evidence and say how many students they rest on, so a teacher knows which patterns are solid and which could be chance. The page describes; it never claims to explain why.",
    say: "Below, Insights ranks what stands out, strongest evidence first. Each finding says how many students it rests on and how sure it is. It describes the pattern, and never guesses at the cause.",
    tip: "Take the top two findings into your data meeting, and use Compare groups by to see whether a gap sits between subjects, classes, teachers or grades."
  },
  "class-snapshot": {
    caption: "Class Snapshot: the headline counts and shares in one row.",
    onScreen: "Eight tiles (demo data): Records 360 (90 students); Met growth 57% of 354 records; Exceeded 55%; Avg start %ile 59.7; Avg end %ile 62.5; Gap closure 19%, pooled across 168 results below the benchmark; Priority 182; Celebration 196. An Export Summary TXT button top right.",
    tells: "The one-minute summary for a data meeting.",
    say: "The Class Snapshot is the one-minute version. In the sample, 57 percent of records met growth. And the group closed 19 percent of its distance to the secure line.",
    tip: "Any share resting on fewer than 10 records prints as a count instead of a percentage, so a handful of students is never made to look like a rate."
  },
  "achievement-profile": {
    caption: "Achievement Profile: the five instructional tiers, with counts and names.",
    onScreen: "Three explanation cards (What tiers do and do not say, What you can plan from, What to do next). Then INSTRUCTIONAL TIERS: coloured rows from Intensive (Tier 3, at or below the 20th percentile) through Strategic, On Track and Secure to Advanced (81st percentile and above), each with a bar, a count and share (demo data: 36, 49, 67, 81 and 127 records) and the first names in it.",
    tells: "How many records sit in each tier now, which sizes intervention and extension groups. Tiers describe achievement only: where a student is, not how far they moved.",
    say: "The Achievement Profile sorts every record into five tiers, from Intensive to Advanced. Each row shows how many, and who. Click one to filter the whole page.",
    tip: "Use the counts to size intervention and extension groups before the timetable is fixed."
  },
  "subject-overview": {
    caption: "Subject Overview: one card of key figures per subject.",
    onScreen: "Four cards, Language, Reading, Mathematics and Science, each listing met growth, exceeded, average start and end RIT, RIT change, start and end percentile, median CGP, pooled gap closure, distance from the US norm, and records that moved up or down a band. Demo data: Reading met growth 63%; Mathematics 52%, with an average percentile change of −2.2.",
    tells: "Which subject needs attention first. The Overview Lens under More filters turns it into one card per class instead.",
    say: "Subject Overview gives one card per subject. In the sample, Reading is strongest. Mathematics trails behind.",
    tip: "A card that shows a count instead of a percentage rests on fewer than 10 records: read it as a description, not a finding."
  },
  "subject-charts": {
    caption: "Subject Charts for Language: the same figures as pictures, repeated for every subject.",
    onScreen: "The Language block (demo data): Start vs end achievement percentile (58 to 62.5); Projected vs observed growth (+4.1 projected, +6.9 observed); Met and exceeded growth (61%, 58%); Distance from the US grade/season norm; the Spring 2026 percentile distribution with the 61st-percentile marker; and the band distribution, Spring 2026 above Fall 2025, in the five band colours.",
    tells: "A picture for a team meeting where a chart is quicker than a table.",
    say: "Subject Charts shows the same figures as pictures. In Language, the sample group beat its growth projection. The band bars compare spring with fall.",
    tip: "Bars start at zero, so lengths compare fairly. Print the page when a meeting is on paper."
  },
  "distributions": {
    caption: "Distributions: every record as a dot over a box plot, one row per subject.",
    onScreen: "A Measure switch: Current percentile, Current RIT, RIT change, Growth percentile (CGP). One row per subject: every record a dot in its band colour over a grey box for the middle half, a thick median line and a diamond for the mean, on faint Red-to-Blue band stripes with dashed lines at the 50th and the 61st (“secure”). The summary line reads: highest median Science (69), lowest Mathematics (59), widest middle half Mathematics, spanning 50 points (demo data).",
    tells: "The shape of the group, not just its average: a wide box is a spread-out group that one lesson pitched at the middle will not reach.",
    say: "Distributions shows every record as a dot. You see the shape of the class, not just its average. Mathematics is the most spread out.",
    tip: "Switch the measure to RIT change or growth percentile to see the shape of growth instead of achievement."
  },
  "growth-and-achievement": {
    caption: "Growth and Achievement: NWEA’s growth and achievement quadrants for the whole view.",
    onScreen: "Three explanation cards (What the quadrants mean, Why this matters, How to read movement). OVERALL: nine quadrant cards (demo data), from Hi-G/Hi-A 114 (32% of records with quadrant data) to Lo-G/Lo-A 48 (14%), including Lo-G/Hi-A 52 (15%) and Hi-G/Lo-A 26 (7%). The note below: quadrant movement 55 improved, 31 declined, 268 stayed the same.",
    tells: "It separates where a score sits (achievement) from how far it moved compared with students who started in the same place (growth). High achievement can hide low growth, and a low start can hide strong growth.",
    say: "Growth and Achievement separates where students are from how fast they are moving. Watch the high achievers with low growth: 52 records in the sample. And protect the low starters who are catching up.",
    tip: "Look for two patterns first: secure students who are coasting, and low starters whose catch-up growth is working and needs protecting."
  },
  "growth-quadrant-maps": {
    caption: "Growth and Achievement, by subject: the three-by-three quadrant maps for Language and Reading.",
    onScreen: "BY SUBJECT: for Language (90 records, 89 with quadrant data) and Reading, a three-by-three grid with achievement from low to high across the columns and growth from high (top row) to low (bottom row). Each cell holds a count, a share and a plain-language read (demo data), such as High Growth / Low Achievement 7, “Catch-up growth is working”; Low Growth / Low Achievement 13, “Highest priority for support”; Low Growth / High Achievement 14, “Achievement is strong; restart growth”.",
    tells: "The same quadrants for each subject, with a one-line teaching read in every cell.",
    say: "The quadrants are drawn for every subject too. Each cell says what it means in plain words. For example: catch-up growth is working.",
    tip: "Protect what is working: think twice before moving a fast-growing low starter out of the support that is producing the growth."
  },
  "movement": {
    caption: "Movement: band-to-band movement, the start-to-end band matrix and who moved down.",
    onScreen: "Four tiles (demo data): Moved up a band 26% (93 of 354), Stayed in band 56% (197), Moved down a band 18% (64), Median percentile change +1 pt, and a paragraph reading them. Left: the transition matrix, rows the Fall 2025 band and columns the Spring 2026 band, each cell a count and share, the diagonal outlined. Right: “Who is in it: Moved down a band”, students with their start and end band and percentile, for example Green 73rd to Orange 38th, −35.",
    tells: "Of the students who started in each band, where they ended up, and exactly who slipped.",
    say: "Movement shows where each record started and ended. In the sample, 26 percent moved up a band. The list on the right names who slipped.",
    tip: "Start with the records that slipped a band. Click any cell to list its students, and remember a change of a few points can be measurement error."
  },
  "gap-closure": {
    caption: "Gap Closure: movement towards the 61st-percentile secure line.",
    onScreen: "Four explanation cards, including “How to read the number”: the 61st percentile is a locally chosen secure line, not an NWEA definition. OVERALL cards (demo data): Closed the gap 21%, Reduced the gap 41%, Widened the gap 35%, Gap Closure (pooled) 19%, Moved up a band 26%, Moved down a band 18%, Secure and extending 40%, Secure but slipping 53%.",
    tells: "Among students who started below the secure line: how many closed, reduced or widened the gap. And whether students who started secure extended or slipped.",
    say: "Gap Closure follows students who started below the 61st percentile. Most closed or reduced the gap. But over half of the secure starters slipped.",
    tip: "Celebrate the closers by name, and look first at the secure students who slipped."
  },
  "growth-goals": {
    caption: "Growth Goals: RIT targets for the next test, and the Print Goal Sheets button.",
    onScreen: "Tiles (demo data): NWEA projected gain +6 (2 records carry NWEA’s own target), Records with a target 360, Typical gain ahead +3, Already past the target 226, Need above-typical growth 106, Largest stretch +38. A method note and “How these targets are worked out”. A table per record: current RIT and percentile, NWEA target, typical gain, keep-pace target and more. Export Goal Sheet CSV and Print Goal Sheets buttons top right.",
    tells: "A concrete RIT target for every student and subject at the next reporting point: typical gain, keep pace, grade level, and the stretch some students need.",
    say: "Growth Goals sets a RIT target for every student and subject for the next test, from typical gain to stretch. One button prints a goal sheet for every student.",
    tip: "Set a written target with every student who needs above-typical growth, and re-upload after the next test so the target becomes a result."
  },
  "action-board": {
    caption: "Action Board: this week’s highest-leverage moves, with the students named.",
    onScreen: "Six numbered cards (demo data), each with a coloured top edge, a student count, the reason, name chips with subjects and a bold “Move:” line: 1 Reteach with these students first (35), 2 Secure but slipping (40), 3 Protect what is working (31), 4 Watch for coasting (38), 5 Chase the missing data (4), 6 No prior window to compare (3). Print this week’s plan and Copy buttons top right.",
    tells: "A ready-made weekly plan: who to act on and what to do, with names deduplicated across subjects.",
    say: "The Action Board is this week\u2019s plan, written for you. Each card is one move, with the students named. Who to reteach first, who is slipping, and whose growth to protect.",
    tip: "Come back after the next test and see which cards emptied."
  },
  "what-would-it-take": {
    caption: "What Would It Take?: how far the group is from a chosen target, and who is closest to the line.",
    onScreen: "A Threshold drop-down set to “61st percentile - secure benchmark” and a Target share of 60. Tiles (demo data): At or above now 58% (208 of 360), Target 60%, Records still needed 8, Furthest of those 4 pts, Below the line 152. A caution note, then a table of the records closest to the line, the ones needed marked NEEDED, with points to the line, band, change and planning group.",
    tells: "It sizes a goal: how many more records would need to cross a line to reach a target share. It does not decide who gets taught.",
    say: "What Would It Take? sizes a goal. In the sample, 8 more records would reach a 60 percent target. It does not choose who gets taught.",
    tip: "Use it to set a target the class can own; use the Priority list to decide who gets the teaching."
  },
  "cross-subject": {
    caption: "Cross-Subject Profiles: each student’s strongest and weakest subject.",
    onScreen: "Tiles (demo data): Students with 2+ subjects 90, Uneven achievement 54 (30+ percentile points between strongest and weakest), Uneven growth 60, Widest spread 79, Median spread 37. A table: student, strongest subject with band and percentile, weakest subject, achievement and growth spread, coloured subject dots, and “What it means”, for example “Group this student differently in Mathematics than in Science.”",
    tells: "Students whose subjects disagree need different grouping in each block, not one label for the whole day.",
    say: "Cross-Subject Profiles compares each student\u2019s subjects. A student can be Blue in one and Red in another. Group them differently in each.",
    tip: "Use it when you group: one label rarely fits a student across the whole day."
  },
  "heatmap": {
    caption: "Heatmap: every class against every subject, coloured by median percentile.",
    onScreen: "A Rows switch (Class, Teacher, Grade) and a Colour by switch (Median %ile, 61st+ share, Met projection, Median CGP, RIT change). The grid: rows 5A, 5B, 6A, 6B and All classes; columns Language, Reading, Mathematics, Science and All subjects; each cell shaded in one of five purple steps (darker is higher) and showing its value and n. The line below: lowest 5B in Mathematics (46.5), highest 6A in Language (84) (demo data).",
    tells: "The cell that needs a conversation stands out before anyone reads a number.",
    say: "The Heatmap puts every class against every subject: the darker the purple, the higher the median. The lowest cell, 5B in Mathematics, is the one to talk about. It is a question, not a verdict.",
    tip: "A difference between two cells is a question, not a verdict: ask what is different about that group before deciding it is the teaching."
  },
  "heatmap-student-areas": {
    caption: "Heatmap, further down: every student’s instructional areas against their own overall RIT.",
    onScreen: "STUDENT AREAS, with a subject switch (Language, Reading 2-5, Reading 6+, Math 2-5, Math 6+, Science 3-5, Science 6-8). The Language grid: a Class median row on top, then one row per student with their RIT and a column per instructional area. Gold cells are below the student’s own level, purple above; differences of at least 8 RIT, the noise floor in this file, are printed as numbers (demo data).",
    tells: "Where in the class a gap sits: only near the top, or all the way down. It appears when a Class Profile export is loaded.",
    say: "A second grid shows each student\u2019s instructional areas against their own level. A gap down a whole column means reteach everyone.",
    tip: "Lighter tints are inside the noise floor; act on the cells that print a number."
  },
  "instructional-areas": {
    caption: "Instructional Areas: class strengths and gaps inside each subject (from Class Profile exports).",
    onScreen: "Tiles (demo data): Records with areas 358, Areas measured 27 across 7 subjects, Class patterns found 6, Teaching groups 27, Student flags 198. BY SUBJECT, with a note that an area is only named as a pattern when its 95% interval clears zero. The Language card: one bar per area against the students’ own overall RIT: Writing −1.5 “Class gap”, Mechanics −0.8 “Within noise”, Grammar and Usage +2.2 “Class strength”, each with how many students sit below the floor, then a plain-English read of the card.",
    tells: "What to reteach to the whole class, and which students need a small group, inside each subject.",
    say: "Instructional Areas looks inside each subject. Here, Writing is a class gap and Grammar a strength. Patterns are named only when the evidence is clear.",
    tip: "Reteach the class gaps to everyone, and take the flagged students as a small group."
  },
  "class-summary": {
    caption: "Class Summary Report: a copy-ready narrative of the current view.",
    onScreen: "A text box holding the written summary, beginning “This class view includes 360 student-subject records covering Fall 2025 to Spring 2026…”, then paragraphs on growth by subject and the key intervention groups (demo data). Regenerate, Copy and Export TXT buttons top right.",
    tells: "The narrative for PLC notes or a report to a leader, written from the same figures as the cards.",
    say: "The Class Summary Report writes the paragraph for you. Edit it into your own voice. Then paste it into your PLC notes.",
    tip: "Edit it into your own voice before you share it."
  },
  "explorer": {
    caption: "Explorer: any two measures plotted against each other, with a trend line and plain-English figures.",
    onScreen: "Controls: Across (X) Start percentile, Up (Y) Conditional growth percentile (CGP), Colour by Subject, a subject switch, Show Trend line, and Pin a student. A scatter of 354 points coloured by subject with a trend line and shaded band. On the right (demo data): Correlation −0.14 (weak negative, p = 0.011), R² 0.02, Records 354, Slope −0.13, and a read that ends “It describes this group; it does not show that one causes the other.”",
    tells: "Whether two measures move together in this group, and how strongly, stated honestly and never as a cause.",
    say: "Explorer plots any two measures, with a trend line. It says how strong a relationship is. It never claims a cause.",
    tip: "Look for the points far from the line, such as a student growing well beyond what their start predicts."
  },
  "table-groups": {
    caption: "Table Groups and Seating Plan: groups built from the data and drawn as a room (filtered to class 5A).",
    onScreen: "Filtered to class 5A (demo data). The heading line: 23 of 23 students seated at 5 tables, balanced mixed tables by end percentile. The “Open the seating planner” bar with its Open button. “How this plan was made” explains the snake deal round the tables. Below, the room drawn on a grid: the teacher desk, the board and Tables 1 to 4 (Table 5 and the door are further down), each seat a name card in the student’s band colour with CGP and percentile, and a band-colour strip on every table. Print teacher copy, Print wall plan and Export CSV buttons.",
    tells: "Seating groups from the data in seconds, balanced mixed tables or similar-score skill groups, with the method spelled out.",
    say: "Table Groups builds seating groups from the data, here for class 5A. It explains how the plan was made. Colour strips show each table\u2019s mix.",
    tip: "A seating plan is for one room: pick one class first; the page offers each class as a one-click button."
  },
  "seating-planner": {
    caption: "The full-screen seating planner: move students, tables and furniture, then print.",
    onScreen: "The Seating Planner overlay: 23 students, 5 tables, up to 5 per table. Toolbar: Undo, Show placement order, Add to room, Room, Hide grouping controls, Rebuild groups, Print teacher copy, Print wall plan, Export CSV, Close. Grouping controls: table size pattern 5, strategy Balanced mixed tables, score End percentile. The room on a grid: teacher desk, board, door and five tables with named seats (demo data).",
    tells: "Arrange the room like the real classroom and adjust any seat by hand.",
    say: "The seating planner opens a full-screen room. Drag students, tables and furniture. Print a teacher copy, and a wall plan with names only.",
    tip: "The room shape is remembered on this device; the students never are."
  },
  "student-grouping": {
    caption: "Student Grouping Report: every record in one sortable table.",
    onScreen: "360 records, sorted by student: student ID, subject, grade, class, start and end RIT, US norm grade level (for example “Norm level 4, vs grade 6 (−2 grades)”), RIT change, start and end percentile and percentile change; more columns scroll to the right. An Export Grouping CSV button (demo data).",
    tells: "The full evidence behind every card above. Further right, each row also carries the planning group the dashboard suggests and the teacher action that goes with it.",
    say: "The Grouping Report is every record in one sortable table: scores, percentiles, and where each student sits against the US norm for their grade. Export it for your own documents.",
    tip: "Click a student’s name for their one-page spotlight."
  },
  "priority-students": {
    caption: "Priority Students: the records that need attention first, with the reasons.",
    onScreen: "182 records (demo data). Columns: Student, Subject, Priority reason (for example “Did not meet growth; Low growth and low achievement at end; Negative observed growth; Finished below the 21st percentile; Widened the gap”), Action, Suggested group (Intensive Support, Secure but Regressing, Targeted Support, Catch-Up Growth), Gap status, End %ile, RIT change and US norm grade level. An Export Priority CSV button.",
    tells: "Where the first small groups come from. The reason matters more than the tier: a student can be listed for slipping, not only for a low score.",
    say: "Priority Students lists who needs attention first, and always says why: missed growth, a dropped band, a widened gap. Some are high achievers who slipped, not just low scorers.",
    tip: "Name three students and what changes for them this week, before anyone asks."
  },
  "wall-posters": {
    caption: "Wall Posters: student-friendly class posters, previewed before printing.",
    onScreen: "The previews in the section “Whole class, every subject together, 90 students, 11 posters” (demo data): We grew this year, Where we are now, Our learning areas, The RIT ladder, Growth is measured fairly, Take your time, Our next milestone, Catching up. Each has a tick box, a one-line description, a preview of the purple-headed poster and a “Print this one” button.",
    tells: "Posters for the classroom wall in student language: class shares, medians and counts only, with no name, no individual score and no rank.",
    say: "Wall Posters turn the data into something for your students, in student language. They show class figures only: no names, no individual scores, no ranks. Tick the ones you want, and print.",
    tip: "Filter to one class first and put the class name the students know in the poster heading box; in the print dialog, turn on background graphics and fit to page."
  },
  "quiz": {
    caption: "Check My Understanding: practice questions for a data conversation, marked against the page.",
    onScreen: "Question 1 of 12 with a gold progress bar and “0 of 1 answered correctly”. Tags: Governor asks, Snapshot. The question: “How many students are in this view? A student tested in two subjects is two records, and I want students, not records.” Four answers: A 89 is marked wrong in red, D 90 is marked correct in green (B 360 and C 87 are the other options). Then “Not quite. The answer is 90.” with the explanation that 90 students make 360 student-subject records, a “Likely follow-up” box, and the Next question and “Show me: Class Snapshot” buttons (demo data).",
    tells: "A rehearsal for the questions a principal, inspector or governor is likely to ask, with every answer worked out from the records in view.",
    say: "Check My Understanding is a practice run for a data meeting. It asks what a principal, inspector or governor would ask, and marks your answer. Then it shows you where the evidence is.",
    tip: "Filter to the class the meeting is about, run a set, and copy the prep notes."
  },
  "celebration": {
    caption: "Celebration Students: records with growth worth celebrating.",
    onScreen: "196 records (demo data). Columns: Student, Subject, Celebration reason (for example “Exceeded projected growth; Moved up a band; Improved RIT strongly”), Next extension, Growth efficiency with tags such as “Exceeded strongly” or “Met (too close to call)”, %ile change, Band movement, Gap status. An Export Celebration CSV button.",
    tells: "Celebration is about growth, not just high scores: a low starter who beat their projection is here; a secure student who grew slowly is not.",
    say: "Celebration Students is about growth, not just high scores. Low starters who beat their projection are here. Each row suggests the next step.",
    tip: "Name the success to the student, then set the next measurable target."
  },
  "data-check": {
    caption: "Data Check: what was read from the files, and anything worth confirming.",
    onScreen: "Tiles (demo data): Rows read 718 (77 columns, comma separated), Records with a score 360, No score in window 0, Suppressed cells 0, Short tests 2, Invalid tests removed n/a, Rapid guessing 4, Records set aside 0, No grade recorded 0, Issues to review 6. Notes: Files combined (sample-asg.csv, sample-class-profile.csv), Records combined across files (358), NWEA projection for the window ahead, Instructional areas found.",
    tells: "The section to read first: students with no score, tests that were short or rushed, and whether the files match what the page expects.",
    say: "Data Check is the section to read first. It shows what was read and combined. And it flags what to confirm, like short tests.",
    tip: "Chase the students with no score and confirm short tests before a placement decision."
  },
  "section-help": {
    caption: "Every section’s ? button opens a three-part explanation in place (Growth Goals shown).",
    onScreen: "The purple ? button at the top right of Growth Goals is pressed, opening a lilac panel with three columns, What it shows, How to read it and What to do with it, then “Download the guide (PDF)” and Close. The section’s tiles and table continue below.",
    tells: "No statistics training is needed: every section explains itself in three short answers.",
    say: "You never have to guess what a section means. Every section has a question-mark button. It opens three short answers: what it shows, how to read it, and what to do.",
    tip: "When a figure surprises you, open the ? before drawing a conclusion."
  },
  "student-spotlight": {
    caption: "A student’s spotlight: one (fictional) student across all their subjects, in a popup over the page.",
    onScreen: "The spotlight popup for the fictional student Aarav Sharma (ID, grade 6, class 6A, teacher, and the tier badge Strategic). A green STRENGTHS box (for example Reading: exceeded projected growth, moved up a band) and an orange WATCH box (Mathematics: did not meet growth, negative observed growth, finished below the 21st percentile). Then one card per subject, Reading and Language in view: Reading RIT 186 to 202, +16, percentile 9 to 28, met growth Yes, conditional growth percentile 89, a “Spring of grade 7 target”, and a bar for each instructional area against his own overall RIT (demo data).",
    tells: "Everything about one student on one page, ready for a parent conference or a conversation with the student.",
    say: "Click any student\u2019s name to open their spotlight. Every subject is together: strengths in green, things to watch in orange, and a target for next year in each subject.",
    tip: "At the foot of the spotlight, Copy conference notes and Print one-pager get you ready for a parent or student conference."
  },
  "goal-sheet-print": {
    caption: "The printed goal sheets, as the print window shows them (fictional student).",
    onScreen: "Two A4 pages side by side for the fictional student Nils Andersson, grade 5, class 5A. Page 1, “My learning goals”: a purple header with the AISA mark, “Where I am now” with each subject’s RIT and band and “My next step by spring of grade 6”, then “What is inside each subject”, a bar per instructional area. Page 2, “My plan”: the targets and the part to work on first, ruled space for “The goal I am setting myself”, “What I will do to get there” and “How my teacher will help”, and lines for Me, My teacher and Date.",
    tells: "A student-facing goal-setting sheet, two pages per student, made in one click from Growth Goals.",
    say: "Here is a printed goal sheet. Page one shows the student where they are and their next step. Page two is theirs to fill in: their goal, their plan, and how you will help.",
    tip: "Use them in student conferences, and keep them to revisit after the next test."
  },
  "fall-baseline": {
    caption: "A fall file with one test window: the orange “Baseline file” banner and the page adapted to it.",
    onScreen: "A single-window version of the sample (demo data), fall-2025-asg.csv: 356 records, 89 students. The question chips change to Where are we starting?, Who needs support?, What are the targets?, How do I group them?, Can I explain this data? An orange BASELINE FILE banner: “Fall 2025 baseline - one test window. No prior window to compare against, so growth, gap closure and quadrant movement are not shown…”. The Jump to bar now has Support List and Strengths, and no Growth, Movement or Gap Closure.",
    tells: "In September, with only one test, the page switches to a start-of-year view instead of showing empty growth panels.",
    say: "In September you only have the fall test, and the page adapts. The banner turns orange, and growth panels are hidden rather than left empty. The questions become: where are we starting, and what are the targets?",
    tip: "Upload in the fall to set targets; upload again in winter or spring to see growth against them."
  },
  "fall-starting-point": {
    caption: "Starting Point on a fall file: tiers and placement against US norms from one test window.",
    onScreen: "Starting Point: “Where this group is beginning, from the Fall 2025 window.” Cards: Why there is no growth here, What you can plan from, What to do next. The fall tier ladder (demo data): Intensive 44, Strategic 54, On Track 71, Secure 70, Advanced 117. Below, PLACEMENT AGAINST US NORMS: Mean RIT vs norm +5.4, At or above norm 66%, Testing a grade+ below 98, Testing a grade+ above 96, Median RIT 211.",
    tells: "What can be planned from one test: tiers, placement against the US grade and season norms, approximate grade-level equivalence, and targets for the year.",
    say: "Starting Point shows the tiers and placement against US norms. Size your groups and set targets now. The spring upload measures against them.",
    tip: "Grade-level equivalence is an approximation from grade means, not a reading or maths grade level."
  },
  "dark-mode": {
    caption: "Dark mode: the masthead and Insights in the dark theme.",
    onScreen: "Top: the masthead, file stats, green Growth file banner and filters on a deep purple-black background, with a “Light” button top right. Bottom: Insights, its six tiles in lavender on dark cards (demo data).",
    tells: "A comfortable dark theme for evening planning, remembered for next time.",
    say: "There is a dark theme for evening planning. One click in the header switches it. The page remembers your choice.",
    tip: "Theme, motion and view are the kind of things the page remembers: preferences, never student data."
  },
  "phone-view": {
    caption: "On a phone (390 pixels wide): the same dashboard, stacked into one column.",
    onScreen: "Three phone-width screens: the top of the page with the stacked masthead, question chips, file stats, the Growth file banner and the filters; Insights with its tiles two to a row under the Jump to bar; Priority Students with its table scrolling sideways (demo data).",
    tells: "The page works on a phone or tablet too, for a quick look between lessons or in a meeting.",
    say: "It works on a phone or tablet too. The layout stacks into one column. And it all still runs on the device.",
    tip: "For printing, grouping and the seating planner, a laptop screen is more comfortable."
  },
  "privacy-offline": {
    caption: "Closing: the upload panel and its privacy promise.",
    onScreen: "The Load MAP Data panel: the dashed “Choose or drop your MAP CSV files” box, Load Sample Data and “How do I get this file?” buttons, zero counts, “Waiting for a CSV file.”, and the green-dot line: “100% private - your file is read in this browser and never uploaded to any server. This page loads no third-party scripts, fonts or trackers, so it also works offline and behind a school firewall.”",
    tells: "The promise that makes it safe to use with real student data.",
    say: "Most important of all: your students\u2019 data never leaves your computer. Nothing is uploaded, nothing is loaded from the internet, there is no sign-in, and it works offline. Export your files, drop them in, and start planning.",
    tip: "Try it first with Load Sample Data, then with your own class. Every section’s ? and the user guide are there when you need them."
  }
};

export const GLOSSARY = [
  ["RIT score", "NWEA’s equal-interval scale (student scores typically fall between about 140 and 300) that runs through every year of school without restarting. Growth is measured in RIT points; it is the number to quote when talking about progress."],
  ["Percentile", "Where a RIT score sits against students in the same grade, subject and season in NWEA’s US norms, from 1 to 99; 50 is the national middle. It is not the share of questions answered correctly."],
  ["Achievement bands (Red, Orange, Yellow, Green, Blue)", "The five achievement quintiles, each 20 percentile points wide (NWEA’s Low, Low Average, Average, High Average and High), which the page names by colour: Red 1st-20th, Orange 21st-40th, Yellow 41st-60th, Green 61st-80th, Blue 81st-99th. The page always shows them in these colours. A band is where a student is today, not a label."],
  ["Instructional tiers", "The same cut points used for planning: Intensive (Tier 3, at or below the 20th percentile), Strategic (Tier 2, 21st-40th), On Track (Tier 1, 41st-60th), Secure (Tier 1, 61st-80th), Advanced (Extend, 81st and above)."],
  ["Secure benchmark (61st percentile)", "A locally chosen line for “secure”, not an NWEA definition. Gap closure measures movement towards or past it among students who started below it."],
  ["Projected growth", "NWEA’s projection, from a student’s own starting RIT and grade, of how much a typical peer grows between the two test windows."],
  ["Observed growth / RIT change", "How many RIT points the student actually moved between the two windows."],
  ["Met projection (met growth)", "Observed growth was at least the projection; “exceeded” means more. Where the export carries a standard error, a result within measurement error of the projection is marked “too close to call”."],
  ["Conditional growth percentile (CGP)", "A student’s growth ranked, from 1 to 99, against students nationally who started at the same RIT in the same grade and subject. 50 is typical growth from that start, so it is fair to low and high starters alike."],
  ["Growth and achievement quadrants", "NWEA’s grid of growth (low, average, high) against achievement (low, average, high), e.g. Hi-G/Lo-A: high growth from a low start."],
  ["Instructional areas", "The strands inside a subject (for example Geometry or Vocabulary), from the Class Profile export. The page reads each area against the student’s own overall RIT, because NWEA publishes no norm for an area."],
  ["ASG export", "The Achievement Status and Growth report, downloaded from MAP Reports as CSV. It carries start and end scores, projections and growth."],
  ["Class Profile export", "Downloaded from MAP Reports as CSV, one file per subject. It carries the instructional-area scores. Load it with the ASG file and the page folds each student’s records into one."],
  ["Record", "One student in one subject. A student tested in four subjects is four records."],
  ["Counts instead of percentages", "Any share resting on fewer than 10 records prints as a count (for example “3 of 4”), because a percentage of a handful of students is misleading."],
  ["Growth, mixed and baseline files", "Growth: two test windows. Mixed: two windows, but a meaningful share of records has only the current one. Baseline: one window (a fall upload), where growth panels are hidden and a start-of-year view appears."],
  ["Essentials", "The nine sections the page opens on. The other sections appear with More analysis, and the choice is remembered."]
];
