# Decisions

Choices made where the constitution was silent or ambiguous. Phase 1 answers (A1–A10) were confirmed by Abu Hussein on 2026-10-26; all seven defaults in section 9 were kept.

## Confirmed in Phase 1
1. **A1, screenshots.** No `screenshots/` folder existed, and none were found on the Desktop or in Downloads. Justice, Health, Electricity and Water, and Manpower were researched from accepted sources. Their records carry `path_verified: false`, and the agent adds "(المسار تقريبي)" to those paths.
2. **A2.** Requirements, documents and fees were researched for the PACI and MOI services that the 10 acceptance questions touch. All other PACI and MOI services have names only.
3. **A3.** The example answer in section 4 is used for its format only. Every fact must come from `services.json`.
4. **A4.** Each record has an optional `aliases` field for everyday words, such as خدامة → تجديد الإقامة, or لمن يهمه الأمر → إصدار شهادة فرد.
5. **A5.** "شهادة لمن يهمه الأمر" maps to PACI → الشهادات → إصدار شهادة فرد.
6. **A6.** For a newborn, the agent gives two steps: Health → رحلة المولود, then PACI → استكمال بيانات مولود.
7. **A7.** For a change of address, the agent gives both the Kuwaiti and non-Kuwaiti paths in one answer and never asks a follow-up question.
8. **A8.** The fixed phrases are used word for word for Kuwaiti or Gulf askers. For MSA and English askers, the agent says the same meaning in their language.
9. **A9.** Tapping a service fills in "شلون أسوي [service]؟" and sends it automatically.
10. **A10.** Tapping an agency with no services shows "هالجهة موجودة في سهل بس لسا ما انضافت للنموذج التجريبي".
11. **Model.** The Claude CLI and the Anthropic API both use `claude-sonnet-5-5`. The CLI runs in lean mode: `--system-prompt-file`, `--tools ""`, `--strict-mcp-config`, `--no-session-persistence`, with the prompt sent on stdin. The model can be changed with the `SAHEL_CLAUDE_MODEL` env var.
12. **Codex.** The Codex CLI provider (`codex exec --skip-git-repo-check -`, prompt on stdin) is built but was not installed or tested on this machine.

## Where the constitution was silent (simpler option chosen)
13. **Server.** Express 4 serves `public/` and `/api/services`, `/api/chat` and `/api/test`. It listens on `0.0.0.0:5318` so phones on the same Wi-Fi can open it.
14. **System prompt.** Section 4 is read from CONSTITUTION.md at runtime (verbatim, so there is one source of truth). It is followed by a short "Operating rules" block that encodes A3–A8, the 6-line hard limit, and the off-topic redirect, then the full `services.json`.
15. **Conversation for the CLIs.** The CLIs take a single prompt, so the last 6 messages are flattened into a labelled transcript. The API providers receive them as real messages.
16. **Privacy before the provider.** Civil IDs (12 digits, Western or Eastern) and passport-like tokens (1–2 letters followed by 6–9 digits) are replaced with `[ID]` and `[PASSPORT]` before logging and before the text is sent to any provider. The agent then says the number is not needed.
17. **API keys.** The key is stored only in the browser's localStorage. It is sent to the local server with each request, passed on to the provider, and never written anywhere. Over Wi-Fi this travels as plain HTTP on the local network, which is acceptable for a local demo.
18. **Anthropic API call.** It uses the official `@anthropic-ai/sdk` with `effort: low`, which suits short chat answers, and the server-side refusal fallback (`fallbacks: "default"`).
19. **OpenAI API call.** It uses plain `fetch` to Chat Completions. The default model `gpt-4.1-mini` can be edited in Settings because model names change.
20. **Settings.** The settings sheet opens from the header's menu icon (☰). The megaphone icon is decorative.
21. **Logo letters.** Taking the literal first letter of every name would give "ا" or "و" for most agencies. The circle shows the first letter of the agency's distinctive word instead (العدل → ع, المعلومات → م), and each agency gets its own colour from a golden-angle hue.
22. **Search.** It matches agency names, service names, categories and aliases, ignoring Arabic diacritics and hamza/taa-marbuta variants. When nothing matches, the page offers "اسأل سهّال عنها".
23. **Data tab.** Dummy fields are shown for 5 agencies. MOI shows the red dot (an unpaid fine) and the yellow dot (passport expiring soon).
24. **Categories for researched agencies** come from the department named in the source (for example التوثيقات الشرعية, خدمات التنفيذ) or a short generic name. All are marked unverified.
25. **Birth certificate.** The in-person e.gov.kw birth-certificate card is not a Sahel service. It is recorded in SOURCES.md only and was not added as a service.
26. **Fonts.** Cairo loads from Google Fonts, with `public/fonts/Cairo.ttf` (OFL licence included) as the offline fallback.
27. **Acceptance grading.** `tests/grade.js` checks each answer automatically: the required names, a "خدمات ←" path, no greeting, no "anything else?", no headings or tables, at most 6 lines, the fee rule and the refusal rule. A person also reviewed every answer in `tests/questions.md`.
28. **Playwright smoke tests** stub `/api/chat`, so they need no provider and run in a few seconds on any machine.
29. **Git.** The local git identity for this repo is the GitHub account (`abu-7sain-ai`, noreply email). LF line endings are enforced, except CRLF for `.bat` files.

## Cross-platform audit and Desktop launchers (2026-10-26)
30. **Finding the CLIs** (`lib/platform.js`, `resolveCommand`). The full path is resolved at runtime with `where.exe` on Windows or `which -a` on macOS, then the usual install folders are checked:
    - **macOS:** `~/.local/bin`, `~/.claude/local`, `~/.npm-global/bin`, `~/.volta/bin`, `/opt/homebrew/bin`, `/usr/local/bin` and Node's own folder.
    - **Windows:** `%APPDATA%\npm`.

    On Windows a real `.exe` is preferred, then the npm `.cmd` shim. The `.ps1` and the extensionless sh shim are never used. A missing CLI now returns `not_installed` before anything is spawned.
31. **Spawning.** `.cmd`/`.bat` shims run through `cmd.exe` as one pre-quoted command line, because Node can't run them otherwise. Everything else, including `claude` on macOS, runs directly with no shell. This removed the Node DEP0190 shell-args warning. Children get an extended PATH (`childEnv`), so the CLI works even when the server was started from Finder or Explorer with a short PATH.
32. **LAN address** (`lanAddresses`). Virtual adapters are skipped:
    - **Windows:** vEthernet/WSL/Hyper-V, VirtualBox, VMware, Docker, Tailscale, ZeroTier, TAP.
    - **macOS:** `utun*`, `awdl*`, `llw*`, `bridge*`, `anpi*`, `ap*`, `gif*`, `stf*`, `vmnet*`.

    Link-local `169.254.x` addresses and loopback are skipped too. The order is macOS `en0`, then other `en*`; on Windows, Wi-Fi/WLAN first, then Ethernet. Node 18's numeric `family: 4` is also accepted. There are unit tests for both platforms.
33. **Paths.** All paths already used `path.join` / `os.tmpdir()`, and none had backslashes, so nothing changed there.
34. **`npm test`** is now `node --test`, which finds `*.test.js` itself. Before, a glob relied on the shell: `cmd.exe` doesn't expand globs, and Node 20 doesn't either.
35. **Port and browser.** The server handles `EADDRINUSE` by printing "already running" and exiting 0 instead of crashing. With `SAHEL_OPEN=1` it opens the browser once it is listening (`start` on Windows, `open` on macOS), so launchers never open a page before the server is ready.
36. **Line endings** (`.gitattributes`). `*.command`, `*.sh`, `*.ps1` and the `.app` executable use LF; `*.bat` uses CRLF; the icons are binary. `start-demo.command`, `scripts/make-shortcut.sh` and the `.app` executable are marked executable in git (`git update-index --chmod=+x`).
37. **Icons** (`scripts/make-icons.js`). One SVG matches the agent button. Playwright's Chromium renders it at 16–1024 px; no download is involved. The script writes `assets/sahel.png` (512), `sahel.ico` (7 PNG-compressed sizes, Vista+) and `sahel.icns` (11 PNG entries, OS X 10.7+). The icns is written directly in Node, so no Apple tool or first-launch build step is needed.
38. **Windows launcher.** `start-demo.bat` checks `netstat` for a listener on `:5318`. If there is one, it only opens the browser; otherwise it starts the server with `SAHEL_OPEN=1`.
39. **Windows shortcut.** `scripts/make-shortcut.ps1` uses WScript.Shell, and the shortcut gets:
    - target `start-demo.bat`
    - working directory = the project folder
    - minimized window
    - icon `assets\sahel.ico`

    It goes on the real Desktop folder, so a Desktop redirected to OneDrive works. WScript.Shell can't save to an Arabic file name: tested here, it fails with "Unable to save shortcut ?????". So the script saves `sahel-agent-demo-shortcut.lnk` and renames it to `إيجنت سهل.lnk`. The file is UTF-8 with BOM so Windows PowerShell 5.1 reads the Arabic correctly.
40. **macOS app** (`mac/إيجنت سهل.app`). It is a plain bundle with no Xcode and no compiled binary: `Info.plist`, a bash executable `Contents/MacOS/sahel-demo`, and `Resources/sahel.icns`. The executable:
    - finds the project from `Resources/project-path` (written by `make-shortcut.sh`), then the repo around the bundle, then `~/Desktop/sahel-agent-demo`
    - adds the login-shell PATH plus Homebrew, `~/.local/bin` and nvm, because Finder apps start with a short PATH
    - opens the browser only, if `lsof` shows port 5318 is busy
    - otherwise runs `npm install` if needed and starts the server in the background (`nohup`, log in `logs/server.log`)
    - shows a macOS dialog if Node or the project is missing
41. **macOS Desktop copy** (`scripts/make-shortcut.sh`). It copies the bundle to `~/Desktop/إيجنت سهل.app` with `ditto`, which overwrites an old copy in place, and writes `project-path`. It also runs `chmod +x` and clears any quarantine flag. The bundle isn't signed: a locally copied shell-script app that isn't quarantined opens without a Gatekeeper prompt.
42. **The macOS app runs the server in the background with no window.** To stop it, use `lsof -ti tcp:5318 | xargs kill`, or use `start-demo.command`, which keeps a Terminal window you can close with Ctrl+C. This is the macOS equivalent of the minimized console on Windows.

## Pixel-faithful Sahel UI and the invented profile (2026-10-26)
43. **Screenshots.** There are 53 of them in `screenshots/`. They are git-ignored, contain real personal data, and are used only for layout, colours, fonts and menu text. They are 576×1280 Android captures, not iPhone 3×. So the app area is 390×866.67 CSS px, and 1 CSS px = 576/390 = 1.4769 screenshot px. The yellow demo bar sits above that area, so everything below the bar lines up with the screenshots. sahel_18 is skipped because a personal notification covers it, and the black bars at the bottom of sahel_02, 30 and 36 are cropped out.
44. **Measurements.** `scripts/measure.py` (Pillow) samples colours and finds dividers, ink boxes and element edges, then prints CSS values. The final table (screenshot px → CSS px):

| Element | Screenshot | CSS (used) |
|---|---|---|
| Page background | #1C1C1E | #1C1C1E |
| Status bar | clock right, 10 px digit ink | 30 px high, 13.5px/600 Eastern digits, 24 h |
| Title "خدمات"/"بيانات" | ink right 18 px from edge, 26 px ink | 22.6px/500, right 18 px, row 45 px |
| Header icons | menu x 19–53, megaphone x 93–122 | menu 23×15 at left 13, megaphone 20×17, gap 27 |
| Services search | x 39–537, y 164–211, #141414 | inset 26.4, top 111, 32.5 high, radius 9 |
| Placeholder | #B8B8B8 italic | 15.5px italic #ABABAE |
| Agency row pitch | 85.5 px | 57.9 px, divider #252527 |
| Agency logo | 66 px circle, 12 px from right | 44.7 px, 8 px from right (letter circle) |
| Agency name | right edge 63 css from right, 24 px ink | 15.3px/400 |
| Chevron | x 22–37, 15×9 px | 11×7 at left 15 |
| Category row pitch | 66 px, text right 31.8 css, #3A7FE4 | 44.7 px, 15.2px/700 |
| Category triangle | x 24–36 | 10×5 filled, left 15 |
| Service row pitch | 82 px, text top-aligned | 56 px, padding-top 6.5, 14.8px/400 |
| Service divider | x 0–530, #212123 | right inset 31, #232325 |
| Gap after last service / category | ~30 px | 20 px |
| Data search | x 15–560, y 236–286 | inset 10.8, top 160, 34 high, radius 10 |
| Avatar | 89 px, right 31 px, top 131 px | 60.3 px, right 21, top 88.7 |
| Name / civil ID | right 102 css, ink 16 / 10 px | 15.6px/500 · 12.6px #D6DAE5 |
| View-mode row | text #3D82EA, icons x 22–84 | 51.5 px row, 14.2px label |
| Sub-section row pitch | 67 px, text right 485 px | 45.4 px, 15.75px/400 |
| Field label | bold, #4682F4/#3D82EA | 15.5px/700 #3D82EA |
| Value box | x 18–485, 50 px high, 63 px pitch, border #343436 | 34 px, 42.7 pitch, right inset 59.6–61.6, border 1.4 px #38383A, radius 8 |
| "•••" | three 7 px dots at x 43–67 | 4.6 px dots, padding-left 16 |
| Alert dots | red #F20600 / yellow #FBBA42, 11 px, x 62–73 | 7.4 px, left 42 |
| Collapsed data header | #1D232F, bottom at 253 px | #1D232F, search #151922 |
| "?" button | 61 px at x 23, y 1056, #19375B | agent button 41.3 px, left 15.6, top 715 |
| Bottom nav | 88 css, active #3085FA, inactive #D7D7D9 | 88 px, 5 equal columns, icons 27 px |
| Badge | 25 px red #FE352E at x 476–501 | 17 px, "4" |
| Home indicator | x 187–388, y 1266–1271 | 136 × 3.5 px |

45. **Font** (`scripts/font-compare.js`, `assets/font-compare.png`). Each candidate is rendered for five services-list text crops (title, agency, category, service, placeholder), sized to the same ink width and aligned on the crop's ink box, then scored by mean luminance difference (lower is closer). Totals:
    - Noto Kufi Arabic: **127.96**
    - Cairo: 136.35
    - Tajawal: 141.67
    - IBM Plex Sans Arabic: 170.27

    Noto Kufi also matches the angular Kufi letterforms by eye. It replaces Cairo (decision 26), and the Cairo files were removed. Weights came from the per-weight scores: title 500, agency 400, service 400 (500 scored slightly better, but 400 looks closer in the composites), category 700 (500 scored best, but 700 matches the visible stroke). The placeholder uses the browser's synthetic italic, as in the app.
46. **Menu text.** All 40 agencies and every PACI and MOI category and service were compared character by character with the screenshots. Only two agency names differed:
    - «الديوان الوطنى لحقوق الإنسان» (ى)
    - «المؤسسة العامة للتأمينات الإجتماعية» (إ)

    The knowledge base, constitution §5 and the Data tab now use the app's spelling. The old spellings are kept as agency `aliases`, and search matches both. The four researched agencies still have no screenshot of their menus, so they stay approximate (A1).
47. **Layout behaviour copied from the screenshots:**
    - service rows are top-aligned
    - categories and sub-sections use small filled triangles
    - a sub-section's divider sits under the whole expanded block
    - the selected tab's icon is filled
    - the Data title scrolls away, profile + search stick with a navy background, hide while scrolling down and return when scrolling up
48. **Status-bar battery** shows a neutral "٨٠" in a grey pill, not the screenshot's red "١٥". The clock is live, 24 h, in Eastern Arabic digits.
49. **Logos** stay letter circles (decision 21), at the measured circle size and position. They are the largest remaining visual difference, on purpose.
50. **Agent button** takes the "?" button's place and size on every tab (41.3 px #19375B, left 15.6, top 715). On phones it is placed 110 px above the bottom instead.
51. **Invented profile** (`data/profile.json`, served at `/api/profile`). Values are exactly as agreed:
    - civil ID 288010100124: fails the civil-ID check digit, so it can't be a real person's
    - plates 00-12345 and 00-67890
    - sponsorship IDs 3000101000x: can never pass the check digit
    - the rest as specified

    I compared the invented numbers by eye against every number visible in the screenshots; none is equal. The 13 Data-tab agencies follow the screenshot order. Agencies the screenshots never show expanded (التأمينات, الصحة, التجارة, المواصلات, بنك الائتمان, الشئون الإسلامية, الشئون الاجتماعية, الكهرباء, الرعاية السكنية) expand to nothing. «حالة  البطاقة» keeps the app's double space.
52. **Avatar** (`scripts/make-avatar.js`). An illustrated man in a white ghutra and black agal on a light blue background, drawn as SVG and rendered to PNG. No photo, nothing downloaded.
53. **Visual regression** (`tests/visual/capture.js`, `npm run test:visual`):
    - 10 states are rendered at 576×1280 into `tests/visual/*.png` (committed, contains only invented data)
    - each is compared with its screenshot in `tests/visual/compare/` (git-ignored)
    - each state is scrolled so its anchor row sits at the same y as in the screenshot, with the clock frozen at 14:13

    Mean pixel difference per state went from 8.7–18.5 to 6.6–15.4. Most of what remains is the logos and the different (invented) values; see NOTES.md.

## Eye-matching pass (2026-10-26)
54. **Desktop fit.** The phone frame is scaled with a CSS `transform` so it is at most 92% of the window height (and 96% of the width), centred, and the page has no scroll. Phones keep full screen. It is checked by `tests/visual/desktop.js`: at 1366×768 the frame is 706 px (92.0%), at 1920×1080 it is 917 px (84.9%, natural size), and neither scrolls. The images are `tests/visual/desktop-*.png`.
55. **Real logos stay on this machine.** `scripts/extract-logos.py` finds the round logo in each agency row of the services-list screenshots, at a fixed column, and numbers rows by their position from a known first agency. That way one missed circle can't shift the names. It also crops rows the scan missed at their expected place, cuts each logo with a round mask inset 5.5% to remove the dark edge and grey ring, and saves 90-px PNGs plus `logos.json` into `public/logos-local/`.
    - It found 39 of 40. الهيئة العامة للبيئة is never fully on screen in any screenshot.
    - The folder is git-ignored and was checked with `git check-ignore`.
    - The page loads `logos-local/logos.json` if it exists and falls back to letter circles per logo.
    - The committed renders (`tests/visual/*.png`, `desktop-*.png`) block that folder, so they show letter circles. Only the git-ignored composites use the real logos.
56. **Font: stay with Noto Kufi Arabic, at lighter weights** (`assets/font-compare-2.png`, services-list crops only). Weights 200/300/400 of Noto Kufi and Cairo were scored against the same crops:
    - Noto Kufi Arabic: 118.42
    - Cairo: 130.12 (its best weights)

    Noto Kufi at 300 matches the thin strokes of agency and service names by eye. So it can be made thin enough, and testing Tajawal, IBM Plex and Noto Naskh again wasn't needed (they scored worse at regular weight in item 45). The new weights:

| Element | Before | Now (by eye against the screenshots) |
|---|---|---|
| Title «خدمات» / «بيانات» | 22.6px / 500 | 24.6px / 300 |
| Agency name | 15.3px / 400 | 15.75px / 300 |
| Service name | 14.8px / 400 | 15.6px / 300 |
| Blue category title | 15.2px / 700 | 13.5px / 800 |
| Search text and placeholder | 15.5px / 400 | 17px / 300 italic |
| User name | 15.6px / 500 | 15.6px / 400 |
| «طريقة العرض» | 14.2px / 400 | 14.2px / 300 |
| Field label | 15.5px / 700 | 16.3px / 700 |
| Value in box | 14.8px / 400 | 15.2px / 300 |
| Bottom-nav label | 11.8px / 400 | 11px / 400, 2.5 px higher |
| Clock | 13.5px / 600 | 13.5px / 400 |

57. **Icons and details changed by eye:**
    - The agency chevron is a 1.5-px stroke.
    - The header list icon has three thin lines, right-aligned and shortening.
    - The active «بيانات» person icon is 17% larger, as in the app.
    - The prayer-beads icon is redrawn as two arcs of beads with a tassel.
    - The home indicator is mid-grey.
    - The avatar has a white 2.2-px ring.
    - The search icon gap is 9.5 px.
58. **Data header colours, as the screenshots show them:**
    - The status bar turns navy as soon as you scroll.
    - The profile and search block turns navy (with a navy-grey search field) only past 200 px, when the header hides and comes back (sahel_16, sahel_28).
    - At a small scroll it stays page-coloured (sahel_03, sahel_04).
