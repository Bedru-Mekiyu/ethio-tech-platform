# Removed Internal Framework Sections

This document audits every internal-framework block removed from the EthioTech platform. In compliance with identity rules, internal pedagogical acronyms and ideology blocks are eliminated, and genuine student-facing outcomes are folded directly into benefit-driven lines elsewhere.

---

## 1. `HomePage.tsx` — Section 4: "The PISTELS Framework" (`#pistels-section`)
- **Location**: `frontend/src/pages/marketing/HomePage.tsx` (formerly lines 1005–1115)
- **Content Removed**:
  - Heading: `"7 Pillars Engineered for Engineering Mastery"`
  - Description: `"PISTELS is our proprietary pedagogical framework designed to bridge the gap between academic theory..."`
  - 7-Pillar letter ribbon buttons (`P`, `I`, `S`, `T`, `E`, `L`, `S`)
  - Deep-dive active pillar card container
- **Rationale**:
  - The acronym `PISTELS` (Practical, Interactive, Squads, Tech tracks, Ethiopian diaspora, Local hubs, Sovereign) was an internal curriculum design device.
  - Potential learners do not shop for proprietary academic acronyms; they look for tangible outcomes: *Can I build production backends? Can I get my code reviewed by diaspora engineers? Can I access a quiet desk with solar power and high-speed internet?*
  - Keeping this section forced learners to interact with 7 separate tab states just to read basic features that are already demonstrated better in the live feature showcase and tracks catalog.
- **Outcome Folded In**:
  - Practical codebases, peer squads, live classrooms, and diaspora reviews are highlighted directly within the core feature showcase and curriculum track descriptions.

---

## 2. `AboutPage.tsx` — "The PISTELS Framework (Core Pedagogical Backbone)" (`#pistels-framework`)
- **Location**: `frontend/src/pages/marketing/AboutPage.tsx` (formerly lines 605–770)
- **Content Removed**:
  - Heading: `"The PISTELS Ideology"`
  - Description: `"Seven core tenets form our pedagogical backbone..."`
  - Pillar tab carousel and methodology quotes
- **Rationale**:
  - "Ideology" and "pedagogical backbone" create an insular, academic impression.
  - The About page is strengthened when it presents concrete engineering standards, verifiable GitHub credentials, and real diaspora mentorship commitments rather than theoretical pillar rubrics.
- **Outcome Folded In**:
  - Core philosophy folded into the "Our Model" section: project-first curriculum, live diaspora office hours, regional solar hubs, and cryptographically verified portfolios.

---

## 3. `Logo.tsx` — Default Subtitle Tagline
- **Location**: `frontend/src/components/brand/Logo.tsx`
- **Content Changed**: Subtitle fallback from `"East Africa · PISTELS"` to `"East Africa"`.
- **Rationale**: Removes residual acronym clutter from the platform's primary visual brand mark.
