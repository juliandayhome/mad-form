# MAD Form - Mobile Athlete Data Collection

## Project Code
MAD - Part of the Coaching Capability Development programme

## Purpose
Mobile-friendly registration and discovery forms for athlete onboarding at Charnwood Athletic Club. Parents/guardians complete these forms on their phones to create athlete profiles.

## Forms

| Form | URL | Purpose |
|------|-----|---------|
| Registration | `/index.html` | Core identity, parent/guardian, emergency contact, GDPR consent |
| Discovery | `/discovery.html` | Training background, goals, health, lifestyle |

## Hosting
Hosted via GitHub Pages at: https://juliandayhome.github.io/mad-form/

## Backend
Form submissions are processed by n8n workflows running locally, exposed via Cloudflare Tunnel.

## Related
- **Obsidian Project:** `Companies and Projects/Coaching/Tools/Mobile Athlete Data Collection/`
- **Code Repository:** `D:\dev\mad-app` (n8n workflows and scripts)

## GDPR Compliance
- Privacy notice linked from forms
- Explicit consent checkboxes required
- Consent logged with timestamp for audit

---

*Part of the Big 3 Portfolio - Coaching Capability*
