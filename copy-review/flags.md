# Flags, Unverified Claims & Technical Values

This document inventories all placeholders, technical string values, unverified claims, and items requiring explicit confirmation.

---

## 1. Technical URLs & Metadata Domain
- **Issue**: `frontend/index.html` has `og:url` and `twitter:url` set to `https://ethio-tech.platform`.
- **Finding**: `.platform` is not an active TLD; this placeholder URL fails Open Graph and Twitter Card scrapers.
- **Recommended Value**: `https://ethiotech.et` or `https://ethio-tech.org` (flagged for user confirmation).

---

## 2. Unverified Statistics in Current Copy
The following numbers appear in the codebase without backing database models or external audit sources. In accordance with Identity Rules, they are flagged as `[PLACEHOLDER]` or replaced with concrete technical features:

| Location | String in Code | Flag | Resolution in New Copy |
|---|---|---|---|
| `HomePage.tsx` | `"200+ Global Hiring Partners"` | Unverified statistic | Replaced with `"Direct Hiring Pipelines"` |
| `HomePage.tsx` | `"94.2% Employment Placement"` | Unverified statistic | Replaced with `"Mentor-Audited Capstones"` |
| `AboutPage.tsx` | `"50,000+ Engineers Trained"` | Forward-looking / unverified | Replaced with provable metrics: `"6 Regional Tech Hubs"` and `"5 Specialized Tracks"` |
| `PartnersPage.tsx` | Multiple simulated corporate partner logos | Unverified enterprise partnerships | Retained as curated ecosystem partners with explicit disclaimer or partner portal CTA |

---

## 3. Technical Identifier Strings (Preserved - Not Altered)
The following strings represent IDs, technical endpoints, or data attributes and are strictly untouched:
- `trackId` parameters (`"web"`, `"mobile"`, `"cloud"`, `"ai"`, `"security"`)
- LocalStorage keys (`"ethio_theme"`, `"auth_token"`)
- API endpoints (`"/api/v1/..."`)
- Socket.io event names (`"meeting:status"`, `"notification:new"`)
- Icon symbol IDs in `public/icons.svg`
