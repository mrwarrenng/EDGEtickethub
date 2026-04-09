# EDGE Ticket Hub

**Internal QA and ticket tracking tool for the Medford EDGE economic development platform.**

A single-file HTML application for the City of Medford Economic Development Department to collect, prioritize, and resolve bugs, feature requests, and content improvements on the [Medford EDGE](https://medfordedge.netlify.app) platform.

---

## Features

### Public Dashboard
- **Stats bar** — Live counts for open bugs, features, content tickets, resolved, and total (excludes rejected)
- **View toggles** — Priority (severity × votes), Recent (chronological), All (status-grouped)
- **Type/status filters** — Combinable chips for bugs, features, content, open, in-progress, resolved
- **Search** — Full-text across title, description, ID, and submitter
- **Voting** — One vote per user per ticket (localStorage tracked)
- **Duplicate detection** — Fuzzy keyword matching on title with upvote-instead option

### Ticket Submission
- **Three types** — Bug, Feature, Content with designed cursor-following tooltips
- **EDGE page/section targeting** — Hierarchical dropdowns for all 8 EDGE pages
- **Affiliation system** — Business, Resident, City Staff (→ Department), EDO (→ Organization), Other (→ Organization)
- **Severity levels** — Critical, High, Medium, Low, Suggestion
- **Anti-bot** — Honeypot field, 3-second timing check, email regex, 20-char minimum

### Admin Backend
- **Access** — Triple-click the department logo in the footer
- **Auth** — Passphrase with tab-scoped sessions; secret recovery code for password reset
- **Ticket actions** — Resolve, Reject, In Progress, Reopen with required notes
- **Email queue** — Auto-composed on status changes; copy, mailto, sent tracking
- **Digests** — Separate Bug, Feature, and Content digests with copy-ready prompts; resolved section; expandable ticket details
- **Settings** — Change passphrase, clear all data

### Design
- Single-page dashboard with modal-based interactions
- Responsive at 900px and 600px breakpoints
- City of Medford Navy/Teal/Gold palette
- Pulsing help button, custom scrollbar, branded tooltips

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Single-file HTML/CSS/JS (~440 lines, ~117KB) |
| Storage | Browser localStorage / sessionStorage |
| Fonts | Google Fonts (Montserrat, Source Serif 4, DM Mono) |
| Deployment | Static file — any web server |

---

## Quick Start

1. Clone this repo
2. Open `edge-ticket-hub.html` in a browser
3. Six demo tickets auto-populate on first load

No build step, no dependencies, no server required.

---

## Deployment

**Static hosting** — Drop `edge-ticket-hub.html` into Netlify, GitHub Pages, or any web server.

**Granicus OpenCities CMS** — Upload as custom HTML page. Requires JavaScript execution and outbound fetch for Google Fonts.

---

## File Structure

```
├── edge-ticket-hub.html    # Complete application (single file)
├── README.md                # This file
├── LICENSE                  # MIT License
└── .gitignore               # Standard ignores
```

---

## Contact

**City of Medford Economic Development Department**
- Email: econdev@cityofmedford.org
- Phone: (541) 774-2007
- Web: [medfordoregon.gov/econdev](https://www.medfordoregon.gov/econdev)
- EDGE Platform: [medfordedge.netlify.app](https://medfordedge.netlify.app)
