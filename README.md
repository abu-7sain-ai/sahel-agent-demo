# نموذج إيجنت سهل — تجريبي

هذا نموذج تجريبي مستقل يحاكي شكل تطبيق «سهل»، وفيه مساعد ذكي اسمه «سهّال» يرد على المواطن بلهجته ويدله على مكان الخدمة.
الهدف إثبات إن وجود مساعد داخل سهل يسهّل الوصول للخدمات ويزيد استخدامها.
المساعد يعرف 6 جهات: المعلومات المدنية، الداخلية، العدل، الصحة، الكهرباء والماء، القوى العاملة. وباقي الجهات تظهر بالاسم بس.
كل البيانات وهمية، وما فيه أي تسجيل دخول أو ربط بأنظمة حكومية أو معاملات حقيقية. هذا ليس التطبيق الرسمي.
يشتغل على جهازك محليًا (ويندوز أو ماك)، ويرد عن طريق اشتراكك في Claude Code أو Codex، أو مفتاح API ينحفظ في المتصفح بس. بعد أول تشغيل تطلع أيقونة «إيجنت سهل» على سطح المكتب.

## أمر التشغيل (انسخه والصقه في Claude Code أو Codex)

```text
Set up and run the Sahel agent demo on this computer, fully on your own; only stop if you need one click from me. (1) Create a folder sahel-agent-demo on my Desktop and work inside it. (2) Check Node.js 20+ and git; install if missing (winget on Windows, brew on macOS). (3) Clone https://github.com/abu-7sain-ai/sahel-agent-demo into it (if it exists, git pull). (4) npm install. (5) If you are Claude Code, make sure `claude -p "say ok" --output-format json` works; if you are Codex, make sure `codex exec "say ok"` works; if not logged in, tell me what to click. (6) npm run demo, open http://127.0.0.1:5318, go to Settings → pick Claude Code CLI or Codex CLI to match yourself → Test connection; confirm Connected. (7) Open the agent and ask "شلون أطلع استمرارية زواج؟"; confirm the answer names وزارة العدل and gives a path inside سهل. (8) Create the Desktop icon: on Windows run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\make-shortcut.ps1`; on macOS run `bash scripts/make-shortcut.sh`; then tell me the Desktop icon «إيجنت سهل» is ready and that double-clicking it starts the demo next time. Keep the demo running. End with ✅ DONE or ⏳ NOT DONE and what you need from me.
```
