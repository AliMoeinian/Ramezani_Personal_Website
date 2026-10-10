# Validation report

Validated in the cloud checkout on 2026-10-10. This report describes the implemented draft website and current-instance evidence; it does not certify publication, a restored cloud task, or physical-device performance.

## Passed

| Check | Evidence |
|---|---|
| Unit tests | `npm test`: **26 passed**, zero failures, skips, or cancellations |
| Persian calendar | All four date vectors in the specification, digit normalization, and Tehran midnight boundary |
| Availability | Known/unknown status, booked/full times, blocked times and days, extra openings, conflicting rows, lead-time boundary, expired and out-of-range rows |
| Feed parsing and failures | BOM, CRLF, escaped quotes, empty/header-only data, malformed CSV, HTTP errors, abort/timeout, and local JSON data |
| Spring physics | Settling, bounded behavior after long frame intervals, and snap reset |
| Release metadata helper | Tested in isolated fixtures: rejects missing/insecure domains, repeatable canonical/base updates, draft/release robots, sitemap generation, 404 remains noindex |
| Browser workflow | `node tests/browser.cjs`: filters, planted flowers, select/clear/week switching, Telegram URL and message, contact tree, persistent growth, motion switch, menu/Escape, résumé tabs/deep links/keyboard navigation/print, and 404 |
| Booking browser scenarios | `node tests/booking-browser.cjs`: mocked CSV, disabled full buttons, hidden blocked buttons, extra mixed-type sessions, mobile bottom panel, floating CTA hiding, clipboard-denied fallback, corrupted-feed fallback, system and explicit motion preferences |
| Responsive layout | No horizontal overflow at 320, 360, 390, 410, 768, 1024, and 1440 pixels in Chromium |
| Accessibility automation | axe-core WCAG 2 A/AA and 2.1 AA: **zero violations** on homepage and résumé default panels; 25 and 23 rule checks passed respectively |
| Runtime | Homepage and résumé return successful HTTP responses; Chromium browser suite records zero page/console errors |
| Local assets | All SVG documents parse as XML. All fonts are local WOFF2 with OFL licenses. No runtime CDN or analytics |

The browser checks use the environment's Playwright and Chromium, with no production dependencies. Run an HTTP server first with `npm start`, then run each browser script. Screenshots are written to the ignored `test-results/` directory. The axe audit used a temporary development-only installation and injected the auditor with CSP bypass; normal-browser tests ran with the site's actual CSP enabled.

## Size measurements

- Three self-hosted subset fonts: **115,428 bytes** total, below the 250 KB font budget.
- Combined JavaScript, gzip: **14,974 bytes** at measurement time, below the 80 KB compressed budget.
- Original SVG artwork and locally rendered 1200 × 630 sharing image are bundled. The social image is metadata, not a blocking page image.

These are file-size measurements, not Lighthouse or 4G performance scores.

## Draft and publication requirements

- At initial validation the repository was empty and all application files were created here. Subsequent Pages preparation adds a tested deployment workflow; this initial validation report does not establish successful remote deployment.
- `isDraft` remains true; the demo banner, confirmation notes, noindex metadata, and draft robots policy remain in place.
- No live Sheet CSV URL was supplied. The default experience marks availability unknown and sends a request for manual confirmation. Feed behavior was validated with mocks and unit fixtures; actual Google CORS and connectivity were not tested.
- Contact IDs and email, license wording/number, address, payment wording, weekly schedule, and marked résumé details require the owner's confirmation. The address is visibly labeled fictional.
- No actual portrait was supplied; an original smiling blossom fills the portrait space.
- For the requested public demo, the repository's standard GitHub Pages URL is configured. Canonical metadata, the share image URL, `sitemap.xml`, and the 404 base path are generated. No custom domain, CNAME, or DNS configuration was invented.
- The cloud `start_skill` draft was saved. No install script is necessary because the site has no installation or build step. Saving this draft does not publish the environment or website.

## Not certified by these checks

- Physical Android/iPhone devices, Safari/Firefox/Edge, and in-app browsers.
- Iranian mobile and fixed networks, actual Google Sheets redirects/CORS, and Telegram/Instagram app handoff behavior.
- A real appointment being accepted, payment details, professional credentials, or any unconfirmed content.
- Lighthouse scores, real 4G LCP, and sustained frame rate on a low-end phone.
- Human approval of the visual character design. The garden implements the core sprout/butterfly/tree growth interactions and motion modes; the detailed storyboard's full set of creature facial states, pointer-following pupils, and all individual creature touch reactions is not claimed as complete.
