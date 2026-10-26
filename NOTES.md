# Notes — Sahel agent demo

Read this first in any new session. Source of truth: CONSTITUTION.md. Choices made where it was silent: DECISIONS.md.

## What was built (2026-10-26)
- **The page:** `public/index.html` is one page with inline CSS and JS. It has a 390×844 phone frame on desktop and goes full screen on phones, with full RTL and the yellow demo bar. Tabs:
  - **Services:** the 40 agencies in app order, then categories in blue, then services. Tapping a service auto-asks the agent.
  - **Data:** dummy data only.
  - **The other 3 tabs:** an out-of-scope screen.
- **Agent:** a floating button opens the chat drawer for سهّال, with the welcome line and 4 quick buttons. Settings (☰) offers four providers with "Test connection":
  - Claude Code CLI
  - Codex CLI
  - Anthropic key
  - OpenAI key
- **Server:** `server.js` (Express, port 5318) serves the page and three endpoints:
  - `GET /api/services`
  - `POST /api/chat`, which takes the last 6 messages
  - `POST /api/test`

  It prints the local and LAN URLs, and appends questions (with identifiers removed) to `logs/questions.log`.
- **Agent code:**
  - `lib/prompt.js` builds the system prompt: section 4 verbatim, then the operating rules, then all of `services.json`.
  - `lib/providers.js` holds the four providers.
  - `lib/redact.js` removes civil IDs and passport numbers.
- **Knowledge:** `knowledge/services.json` has 40 agencies (6 covered) and 130 services. `knowledge/SOURCES.md` lists every source and what could not be confirmed. `knowledge/research-draft.json` keeps the raw research with full URLs and per-record notes.

## How to run
- Windows: double-click `start-demo.bat`. Mac: double-click `start-demo.command`. Or run `npm install`, then `npm run demo`.
- Open http://127.0.0.1:5318. On a phone on the same Wi-Fi, use the `Phone (same Wi-Fi)` address the server prints. Windows may ask to allow Node through the firewall: allow it on Private networks.
- In the page, tap ☰ → pick a provider → "اختبار الاتصال" (Test connection). Claude Code CLI is the default.

## Tests
- `npm test` runs 13 unit tests: the knowledge base checks and the prompt builder, including the five-part format.
- `npm run test:e2e` runs the Playwright smoke tests (3) with a stubbed `/api/chat`. The first time, run `npx playwright install chromium`.
- `npm run test:questions` runs the 10 acceptance questions through the real Claude CLI and rewrites `tests/questions.md`. Last run: 10/10 PASS. Each answer takes about 6–18 s.

## How to update services.json
1. Each record has these fields: `name, agency, category, aliases[], requirements[], documents[], fees, duration, last_verified, source_url, path_verified`. Use the agency name exactly as it appears in `agencies`.
2. Fill a fact only from an accepted source (e.gov.kw, official ministry sites, Sahel's official accounts, Al-Qabas, Al-Anba, Al-Rai). Set `last_verified` (YYYY-MM-DD) and `source_url`, and add the source to SOURCES.md. Leave a field empty when there is no source.
3. Set `path_verified: true` only when the category and service names were checked against the real app, for example from a screenshot.
4. To add a new agency's services, set `covered: true` on that agency and add its records. The page and the agent pick them up on reload; no code change is needed.
5. Run `npm test` and `npm run test:questions`.

## Known limitations
- No public URL. The demo runs only on the viewer's own computer, and phones on the same Wi-Fi.
- The subscription path (Claude Code CLI) was tested only on this machine (Windows 11, Claude Code 2.1.310). Codex CLI is built but was never installed or tested. The Anthropic and OpenAI key paths were not tested with real keys, because no key was used.
- **Fully sourced from screenshots:** PACI (40 services) and MOI (50), names and categories. Only 13 of those have requirements and fees researched.
- **Partial, menu paths unverified:** Justice (12), Health (7), Electricity and Water (11), Manpower (10). The names come from official announcements, the category names are inferred, and the agent marks these paths "(المسار تقريبي)". Screenshots of these four agencies in Sahel would fix that.
- Not confirmed from any source:
  - the passport renewal fee in Sahel
  - residency renewal fees
  - Sahel fees and documents for the marriage continuity certificate
  - the PACI "دفع الرسوم فرد / أسرة" details
- Answers come from an LLM. The format is checked by tests, but wording varies from run to run.

## Pending / ideas
- Get screenshots of the four researched agencies' menus in Sahel and set `path_verified: true`.
- Write the Arabic presentation document for PACI (the fixed demo structure).
