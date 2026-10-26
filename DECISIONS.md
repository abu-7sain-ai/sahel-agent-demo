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
