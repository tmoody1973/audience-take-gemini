I want you to redesign the existing Junichiro Jackson Scout Card page to match the attached/reference mockup.

IMPORTANT:
This is primarily an INFORMATION ARCHITECTURE + LAYOUT redesign.

Do not redesign the entire visual identity.
Do not remove existing functionality.
Do not invent new data.
Do not change the underlying data model unless absolutely necessary for the layout.
Do not replace existing working components unnecessarily.

First inspect the existing implementation and identify:
- the route/page responsible for the Scout Card
- the components used on this screen
- the existing responsive layout
- the source/evidence data structures
- the hypothesis data structures
- any shared design-system components already being used

Then implement the redesign described below.

==================================================
DESIGN GOAL
==================================================

The current page is too vertically fragmented and contains large areas of dead space because information is divided into several tall independent columns.

The new layout should create a clearer reading flow:

PROJECT
↓
SOURCE
↓
SCOUTING STATUS
↓
EVIDENCE
↓
HYPOTHESES
↓
NEXT EXPERIMENT

The interface should feel like a structured intelligence/scouting brief rather than a collection of unrelated cards.

Preserve the existing editorial / neo-brutalist visual language:
- cream/off-white background
- black borders
- condensed display typography
- yellow
- blue
- green
- red/orange
- evidence/source pills
- sharp rectangular cards
- minimal border radius
- dense editorial character

Do NOT turn this into a generic SaaS dashboard.

==================================================
1. REPLACE THE LARGE LEFT SIDEBAR
==================================================

Remove the existing full-height left sidebar containing:

JUNICHRO JACKSON (JJ)

and its metadata / scores.

Move this information into a full-width PROJECT HEADER at the top of the page.

Structure:

--------------------------------------------------
JUNICHRO JACKSON (JJ)

A speculative supernatural horror concept set in
near-future Brooklyn with a hip-hop identity.

FORMAT              CLAIM             PUBLISHED
Creator Project     Unclaimed         Aug 28, 2026
--------------------------------------------------

Below the description, create a horizontal status strip containing:

STRUCTURE
Complete

EVIDENCE
Source Limited

AUDIENCE HEAT
90/100

MARKET VIABILITY
90/100
--------------------------------------------------

Desktop:
All four metrics appear in one horizontal row.

Tablet:
Allow a 2x2 grid if necessary.

Mobile:
Use a 2-column grid or another compact responsive treatment.

The page title should remain the dominant piece of typography on the screen.

==================================================
2. MAIN SOURCE + SCOUTING STATUS AREA
==================================================

Immediately beneath the project header create a two-column desktop layout.

Use approximately:

SOURCE / VIDEO
~60–65%

SCOUTING STATUS
~35–40%

The two areas should visually align at the top.

------------------------------------------
LEFT: WATCH BEFORE YOU JUDGE
------------------------------------------

Preserve the yellow header and existing source/video functionality.

Header:

WATCH BEFORE YOU JUDGE

Right-side metadata:
SOURCE VIDEO 1 / 2
PRIMARY WORK / PLATFORM METADATA

Below it:
existing video/embed

Below the video:
source description and OPEN SOURCE VIDEO action.

Then place the source selector/navigation at the bottom:

SOURCES
01 Junichiro Jackson (JJ)
02 YouTube
previous / next controls

Do not remove existing video switching functionality.

Make the video the dominant visual object on the page.

------------------------------------------
RIGHT: SCOUTING STATUS
------------------------------------------

Combine the three existing areas:

WHY THIS IS BEING SCOUTED
WHAT WE'RE CHECKING
OPEN QUESTION

into ONE cohesive panel called:

SCOUTING STATUS

Inside it create three subsections.

SECTION A

WHY THIS SURFACED

Show the existing inferred signals:

Near-future Brooklyn setting
[source pills]

Supernatural horror elements
[source pills]

Hip-hop cultural identity
[source pills]

Use the existing green INFERRED semantic styling.

SECTION B

NEEDS VERIFICATION

Show the current investigation questions:

• What is the exact relationship and identity link
  between the submitted Junichiro Live project
  and Junichiro Jackson?

• Which specific French and American animation
  studios are involved in the co-production?

Use a compact list treatment.

SECTION C

PRIMARY OPEN QUESTION

This should remain visually prominent and use the
existing strong blue treatment.

Question:

What is the exact relationship and identity link
between the submitted Junichiro Live project and
Junichiro Jackson?

CTA:

ADD YOUR INFORMED TAKE →

The blue question area should anchor the bottom of
the Scouting Status panel.

==================================================
3. SECONDARY CONTENT GRID
==================================================

Below the video/scouting row create another desktop
two-column layout.

Use approximately:

WHAT WE KNOW
~44%

PATHWAY HYPOTHESES
~56%

Allow the content to determine height naturally.

Do NOT force both columns to equal viewport height.

This is important because eliminating artificial
full-height columns is one of the main goals of the redesign.

==================================================
4. WHAT WE KNOW → EVIDENCE LEDGER
==================================================

Turn the existing WHAT WE KNOW area into a more
structured evidence ledger.

Header:

WHAT WE KNOW
EVIDENCE LEDGER

Each reported fact should use this pattern:

[REPORTED]

Fact / claim text

[source pills]

----------------------------------

Use horizontal dividers between entries instead of
putting every fact inside a separate heavy card.

Keep all current evidence content.

Preserve source references.

Do not fabricate additional sources.

The section should feel like an evidence ledger or
research notebook.

==================================================
5. PATHWAY HYPOTHESES
==================================================

Keep exactly three hypotheses.

Header:

PATHWAY HYPOTHESES
EXACTLY THREE / BOUNDED

Each hypothesis should become a structured horizontal
decision card.

Example:

--------------------------------------------------
01   PREMIUM ADULT ANIMATED SERIES

Short hypothesis explanation.

FORMAT
Serialized adult animation

AUDIENCE
Young adult anime enthusiasts...

              EVIDENCE
              [S2] [S3] [S7] [+4]
    
              READINESS
              Developing evidence basis

NEXT EXPERIMENT:
Production Studio Verification / Two weeks
--------------------------------------------------

Repeat for:

02
INDEPENDENT ANIMATED FEATURE

03
CREATOR-DIRECT SERIALIZED FRANCHISE

==================================================
6. EMPHASIZE "NEXT EXPERIMENT"
==================================================

The Next Experiment field is strategically important.

Currently it looks like minor metadata.

Make it a consistent footer/action row on every
hypothesis card.

Examples:

NEXT EXPERIMENT:
Production Studio Verification / Two weeks

NEXT EXPERIMENT:
Script Outline Evaluation / Three weeks

NEXT EXPERIMENT:
Direct Community Interest Test / Ten days

It does not need to look like a primary button, but
it should be easier to find when scanning.

==================================================
7. COLOR SEMANTICS
==================================================

Preserve and consistently apply the current semantic
color system:

YELLOW
reported facts / source material

GREEN
inference

BLUE
questions / user action / unresolved investigation

RED-ORANGE
hypotheses / strategic possibilities

BLACK
primary structural typography and borders

CREAM
page background

Do not introduce additional arbitrary colors.

==================================================
8. BORDER HIERARCHY
==================================================

Reduce unnecessary visual boxing.

Use:

HEAVY BORDER
for major modules

THIN DIVIDER
between items inside modules

NO BORDER
for small supporting metadata where possible

Not every text group needs its own rectangle.

The goal is to retain the neo-brutalist editorial
style while reducing visual noise.

==================================================
9. TYPOGRAPHIC HIERARCHY
==================================================

Establish approximately three heading levels.

LEVEL 1
Project title
JUNICHIRO JACKSON (JJ)

Very large condensed display type.

LEVEL 2
Major modules:

WATCH BEFORE YOU JUDGE
SCOUTING STATUS
WHAT WE KNOW
PATHWAY HYPOTHESES

LEVEL 3

WHY THIS SURFACED
NEEDS VERIFICATION
PRIMARY OPEN QUESTION
FORMAT
AUDIENCE
EVIDENCE
READINESS
NEXT EXPERIMENT

Avoid having every heading compete at the same size.

==================================================
10. SPACING
==================================================

Use a consistent spacing system.

Prefer existing project design tokens if present.

Otherwise establish a predictable rhythm similar to:

4px
8px
12px
16px
24px
32px
48px

Increase spacing BETWEEN major modules.

Decrease spacing WITHIN related metadata.

Do not solve empty space by making cards artificially taller.

==================================================
11. RESPONSIVE BEHAVIOR
==================================================

This redesign must work well on desktop, tablet,
and mobile.

DESKTOP
--------------------------------
Project Header

Video            Scouting Status

What We Know     Pathway Hypotheses
--------------------------------

TABLET
--------------------------------
Project Header

Video            Scouting Status
or stack when space becomes constrained

What We Know

Pathway Hypotheses
--------------------------------

MOBILE
--------------------------------
Project Header

Metrics

Watch Before You Judge

Scouting Status

What We Know

Pathway Hypotheses
--------------------------------

On mobile:

- no horizontal page scrolling
- video uses full available width
- source tabs may horizontally scroll if needed
- cards stack vertically
- preserve readable type sizes
- evidence pills wrap naturally
- hypothesis metadata should stack rather than shrink
- CTA targets must remain touch friendly
- maintain approximately 16px minimum page gutters
- do not preserve desktop column proportions on small screens

==================================================
12. PRESERVE FUNCTIONALITY
==================================================

Do not break:

- video embeds
- previous/next source controls
- source selection
- Open Source Video
- Add Video / Devlog functionality if present
- source evidence links
- hypothesis content
- Add Your Informed Take
- existing routing
- existing data loading
- any working application state

If functionality is currently contained inside
existing components, prefer reorganizing those
components rather than rewriting the underlying logic.

==================================================
13. IMPLEMENTATION APPROACH
==================================================

Before coding:

1. Inspect the existing page and component hierarchy.
2. Identify reusable components.
3. Identify layout-specific code vs business logic.
4. Briefly explain your proposed component/layout changes.
5. Then implement.

Prefer clean composition such as:

ScoutCardPage

  ProjectHeader
    ProjectMetadata
    ScoreStrip

  ScoutPrimaryGrid
    SourceViewer
    ScoutingStatus
      SurfaceSignals
      VerificationQuestions
      PrimaryOpenQuestion

  ScoutResearchGrid
    EvidenceLedger
      EvidenceItem

    PathwayHypotheses
      HypothesisCard
        HypothesisEvidence
        NextExperiment

These names are examples.

Follow the project's existing naming conventions when
they differ.

Do not create unnecessary abstraction just to match
these names.

==================================================
14. DESIGN REFERENCE
==================================================

Use the supplied redesign mockup as the primary visual
reference.

The mockup is intended to communicate:

- overall hierarchy
- module grouping
- column proportions
- removal of the large sidebar
- placement of the project summary
- consolidation of scouting information
- evidence ledger treatment
- hypothesis card treatment

It is NOT expected to be copied pixel-for-pixel.

Preserve working components and existing project
patterns where sensible.

The intended result should feel like the CURRENT
PRODUCT, but substantially better organized.

==================================================
15. VERIFICATION
==================================================

After implementation, test at minimum:

Desktop:
1440px

Laptop:
1280px

Tablet:
768px

Mobile:
390px

Verify:

[ ] No unintended horizontal scrolling
[ ] Project header reads clearly
[ ] Metrics are easy to scan
[ ] Video remains dominant
[ ] Scouting Status reads as one coherent module
[ ] Evidence is easy to scan
[ ] All three hypotheses are visible and distinguishable
[ ] Next Experiment is easy to locate
[ ] Source pills wrap correctly
[ ] Existing interactions still work
[ ] No major dead-space columns remain
[ ] Mobile layout has sensible spacing
[ ] Existing design language is preserved

If the project has automated tests, run the relevant
tests after implementation.

Also run the project's lint/typecheck/build commands.

Fix regressions caused by this redesign before stopping.

==================================================
SUCCESS CRITERIA
==================================================

The redesign is successful when a first-time user can
scan the page and quickly understand:

1. What is this project?
2. What source should I review?
3. Why is it being scouted?
4. What facts are supported?
5. What still needs verification?
6. What are the three possible pathways?
7. What experiment should happen next?

The final screen should have substantially less
unused vertical space than the current implementation
without simply adding more content.