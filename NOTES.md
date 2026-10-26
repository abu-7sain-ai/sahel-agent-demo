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
  - `lib/platform.js` handles Windows/macOS differences: CLI lookup, child PATH, Wi-Fi address, opening the browser.
- **Launchers:** `assets/` holds the icons (png, ico, icns, svg), made by `scripts/make-icons.js`. `scripts/make-shortcut.ps1` creates the Windows Desktop shortcut. `mac/إيجنت سهل.app` is the macOS app, and `scripts/make-shortcut.sh` copies it to the Desktop.
- **Sahel look (2026-10-26):** the page is rebuilt from measurements of 53 real Sahel screenshots. They live in `screenshots/`, which is git-ignored because they contain personal data. It uses the Noto Kufi Arabic font, the measured colours and sizes, and the Data tab structure with an invented citizen from `data/profile.json` and an illustrated avatar. Every measured value is in DECISIONS.md items 43–53.
- **Knowledge:** `knowledge/services.json` has 40 agencies (6 covered) and 130 services. `knowledge/SOURCES.md` lists every source and what could not be confirmed. `knowledge/research-draft.json` keeps the raw research with full URLs and per-record notes.

## How to run
- **Desktop icon «إيجنت سهل»:** double-click it. It starts the server only if it isn't running, then opens the browser. Create the icon once with:
  - Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\make-shortcut.ps1`
  - macOS: `bash scripts/make-shortcut.sh`
- Or double-click `start-demo.bat` (Windows) or `start-demo.command` (Mac), or run `npm install` then `npm run demo`.
- To stop the demo:
  - Windows: close the minimized "Sahel agent demo" console window.
  - macOS app: run `lsof -ti tcp:5318 | xargs kill`. With `start-demo.command`, press Ctrl+C in the Terminal window instead.
- To rebuild the icons after a design change: `node scripts/make-icons.js`, then copy `assets/sahel.icns` into `mac/إيجنت سهل.app/Contents/Resources/`.
- Open http://127.0.0.1:5318. On a phone on the same Wi-Fi, use the `Phone (same Wi-Fi)` address the server prints. Windows may ask to allow Node through the firewall: allow it on Private networks.
- In the page, tap ☰ → pick a provider → "اختبار الاتصال" (Test connection). Claude Code CLI is the default.

## Tests
- `npm test` runs 22 unit tests: the knowledge base, the prompt builder (including the five-part format), the platform helpers and the invented profile (it checks that no civil ID passes the check digit).
- `npm run test:visual` renders 10 app states and, when `screenshots/` exists, compares them with the real screenshots.
- `npm run test:e2e` runs the Playwright smoke tests (3) with a stubbed `/api/chat`. The first time, run `npx playwright install chromium`.
- `npm run test:questions` runs the 10 acceptance questions through the real Claude CLI and rewrites `tests/questions.md`. Last run: 10/10 PASS. Each answer takes about 6–18 s.

## How to update services.json
1. Each record has these fields: `name, agency, category, aliases[], requirements[], documents[], fees, duration, last_verified, source_url, path_verified`. Use the agency name exactly as it appears in `agencies`.
2. Fill a fact only from an accepted source (e.gov.kw, official ministry sites, Sahel's official accounts, Al-Qabas, Al-Anba, Al-Rai). Set `last_verified` (YYYY-MM-DD) and `source_url`, and add the source to SOURCES.md. Leave a field empty when there is no source.
3. Set `path_verified: true` only when the category and service names were checked against the real app, for example from a screenshot.
4. To add a new agency's services, set `covered: true` on that agency and add its records. The page and the agent pick them up on reload; no code change is needed.
5. Run `npm test` and `npm run test:questions`.

## Visual match with the real app
- Run `npm run test:visual`. It renders 10 states into `tests/visual/*.png` and, when `screenshots/` exists, builds [screenshot | demo | difference] composites in `tests/visual/compare/`, which is git-ignored.
- Mean pixel difference per state, latest run:

  | State | Mean difference |
  |---|---|
  | services-top | 15.4 |
  | PACI الشهادات | 8.3 |
  | PACI خدمات الأفراد | 8.8 |
  | PACI خدمات البطاقة | 6.6 |
  | MOI categories | 7.8 |
  | MOI الإقامة | 9.0 |
  | data-top | 12.1 |
  | PACI الأبناء | 10.1 |
  | MOI الكفالات | 9.3 |
  | Justice | 14.6 |

- **Remaining differences:**
  1. Agency logos are letter circles, not the official logos. This is on purpose and is the biggest remaining difference.
  2. The yellow demo bar sits above the app, and the browser title is the demo title. Both on purpose.
  3. Every value is invented (name, civil ID, numbers, avatar), so text widths and line breaks differ. For example, the Justice property record fits on one line here but wraps in the real app.
  4. The status bar shows a neutral battery "٨٠" and live time. The real one showed a low red battery. The signal and 5G glyphs are hand-drawn approximations.
  5. The bottom-nav and header icons are hand-drawn SVG look-alikes. The prayer-beads (مواعيد) and megaphone shapes are the furthest from the originals.
  6. Text weight is very slightly heavier than the app in service rows. Row positions drift by about 1 px per 10 rows.
  7. The Data header's slide back in is all-or-nothing here. The real app reveals it gradually as you scroll (sahel_28 caught it halfway).
  8. The "طريقة العرض" toggle only switches which icon is highlighted; there is no second layout.
  9. Agencies the screenshots never show expanded open to nothing in the Data tab.

## Windows / macOS readiness (tested 2026-10-26 on Windows 11)
- **Tested on Windows:**
  - unit tests (17)
  - Playwright smoke tests (3)
  - `make-shortcut.ps1`: creates `إيجنت سهل.lnk` with the correct target, working directory, minimized window and icon
  - `Start-Process` on the shortcut: started the server in 1.4 s, returned HTTP 200, and Edge opened the page titled «نموذج إيجنت سهل — تجريبي»
  - a second launch: opened the browser and started no second server
  - Test connection (Claude CLI) on that server: ok
- **NOT tested on macOS** (no Mac available here):
  1. Double-clicking `mac/إيجنت سهل.app` or the Desktop copy: does Finder show the icon, does it run, does the browser open?
  2. Whether Gatekeeper blocks the unsigned bundle after a `git clone` (expected: no quarantine, so no prompt).
  3. `scripts/make-shortcut.sh`: `ditto` copy, `project-path`, `xattr`, and whether the icon refreshes on the Desktop.
  4. Whether `sahel.icns` is accepted by Finder or the Dock. Its structure was checked here (`file` reports a Mac OS X icon), but it was never displayed.
  5. The PATH recovery in the app (login-shell PATH, Homebrew, nvm), and finding `claude` from a Finder-launched app.
  6. Spawning `claude -p` on macOS without a shell, and `lsof`-based port detection.
  7. `start-demo.command`: the executable bit after clone, and the Terminal launch.
  8. LAN-IP selection on a real Mac (`en0`/`en1`). Only the unit tests with sample macOS interface lists ran.
  9. Whether git on macOS keeps the Arabic bundle name intact (`core.precomposeunicode` is on by default).

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
- Get screenshots of the four researched agencies' menus in Sahel and set `path_verified: true`. The 53 screenshots from 2026-10-26 cover PACI and MOI only.
- Write the Arabic presentation document for PACI (the fixed demo structure).
