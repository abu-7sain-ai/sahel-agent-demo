# Sahel Agent Demo — Constitution (2026-10-26)

## 1. Goal and scope
A demo that proves to Kuwait's Public Authority for Civil Information (PACI) that an AI agent inside the government app "سهل" (Sahel) increases service usage. The demo is a web page that looks like Sahel, with a floating agent button; a citizen asks in their own dialect and gets the steps.
Audience: first Abu Hussein's friends, then a formal presentation to PACI.
Build: (1) a phone-shaped page imitating the "خدمات" and "بيانات" tabs; (2) a floating agent button opening a chat drawer; (3) an agent that answers accurately about 6 agencies; (4) runs on the viewer's computer and opens on a phone on the same Wi-Fi.
Do NOT build: login, digital ID, fingerprint, any real transaction or payment, any link to a government system, a store app, a public internet URL.
Success test: someone who does not know Sahel asks "شلون أطلع استمرارية زواج؟" and reaches the correct answer in under one minute.

## 2. Visual identity (measured with scripts/measure.py from 53 real screenshots, 576×1280, Android; CSS px = screenshot px ÷ 576/390; updated 2026-10-26, full table in DECISIONS.md)
Colors: page background #1C1C1E; search field #141414; collapsed data header #1D232F with its search field #151922; agency divider #252527 1px; service / sub-section divider #232325; primary text #FFFFFF; placeholder #ABABAE; civil ID under the name #D6DAE5; category titles #3A7FE4; field labels and "طريقة العرض" #3D82EA; selected tab #3085FA; inactive tab #D7D7D9; badge #FE352E; alert red #F2140A; alert yellow #FBBA42; value-box border #38383A; agent button #19375B.
Font: Noto Kufi Arabic (closest of Cairo / Tajawal / IBM Plex Sans Arabic / Noto Kufi Arabic, see assets/font-compare.png), local copy in public/fonts. Sizes/weights: page title 22.6px/500; user name 15.6px/500; agency name 15.3px/400; category title 15.2px/700 blue; service name 14.8px/400; sub-section 15.75px/400; field label 15.5px/700 blue; value 14.8px/400; search placeholder 15.5px/400 italic; bottom nav labels 11.8px/400; chat 15px/400.
Sizes: app area 390×866.67 below the demo bar; status bar 30px; title row 45px; services search 32.5px high, 26.4px side inset, 9px radius, top 111px; data search 34px high, 10.8px inset, 10px radius; agency row 57.9px; category row 44.7px; service row 56px (text top-aligned, 6.5px from top); sub-section row 45.4px; value box 34px high, 42.7px pitch, 8px radius, 61.6px right inset; agency logo circle 44.7px, 8px from the right; avatar 60.3px, 21px from the right; bottom nav 88px; agent button 41.3px diameter at left 15.6px, top 715px (the app's "?" button); chat drawer 85% of height, slides up from the bottom.
Icons: bottom nav, right to left: بيانات (person, red "4" badge), خدمات (document), إشعارات (bell), مواعيد (prayer beads), بلّغ (camera); the selected tab's icon is filled. Chevron down = collapsed agency, chevron up = expanded, small filled triangle = category / sub-section, chevron left = service. Hand-drawn SVG icons that imitate the app's, not the app's originals.
Logos: a colored circle with the first letter of the agency name; a distinct color per agency. Never the official Sahel logo or any agency logo.
Direction: full RTL. Clock in Eastern Arabic digits; civil IDs and references in Western digits.

## 3. Page structure
One 390px screen. Desktop: centered inside a rounded phone frame on a grey background. Mobile: full screen, no frame.
Layers top to bottom: (1) fixed yellow bar "نموذج تجريبي — ليس التطبيق الرسمي"; (2) fake status bar (clock, signal, battery); (3) header: title on the right, megaphone and menu icons on the left; (4) search field; (5) scrollable content; (6) floating agent button; (7) fixed bottom nav with five tabs.
Services tab (default): agencies in the exact order of section 5; tap an agency → its categories in blue; tap a category → its services in white; tap a service → opens the agent with the prefilled question "شلون أسوي [service]؟"; search filters live while typing.
Data tab: header with avatar, name and civil ID from data/profile.json, refresh icon and "بحث في البيانات" search; a "طريقة العرض" row with two view icons; 13 agencies in the app's order with sub-sections, blue field labels and invented values in rounded boxes with "•••"; red and yellow alert dots where the screenshots show them. When scrolled, the header turns navy, hides while scrolling down and returns when scrolling up.
Other three tabs: a screen with "هذا القسم خارج نطاق النموذج التجريبي".
Agent button: 41.3px circle #19375B with a white chat-bubble icon plus a small star, in the place of the app's "?" button. Visible on all tabs. Tap → drawer slides up; tap outside or the close chevron → it closes.
Chat drawer: header with the agent name "سهّال" and subtitle "مساعدك في خدمات سهل"; on first open: a one-line welcome and four quick buttons: "تجديد البطاقة المدنية", "استمرارية الزواج", "دفع مخالفات المرور", "تجديد الإقامة"; user bubbles right/blue, agent bubbles left/dark grey; input + send button; conversation persists while the page is open.
Interaction: 200ms animations; touch and mouse behave the same; the page works offline except the agent reply.

## 4. The agent "سهّال"
Persona: an expert Sahel receptionist who knows where every service lives and what it needs, and answers in three sentences, not a page.
Dialect: mirror the asker (Kuwaiti → Kuwaiti, MSA → MSA, English → English). Address as "انت". No greeting at the start, no "anything else?" at the end. Answer and stop.
Fixed answer format: (1) one line: service name and agency; (2) path: خدمات ← [agency] ← [category] ← [service]; (3) requirements/documents as short bullets if known; (4) fees if known; (5) one warning if something blocks the transaction.
Example answer: "شهادة استمرارية الزواج تطلع من وزارة العدل. المسار: خدمات ← وزارة العدل ← التوثيقات ← شهادة استمرارية زواج. تحتاج: رقمك المدني ورقم الزوجة المدني، وعقد الزواج مسجل بالكويت. تطلع فورًا PDF ممهور."
Knowledge limits: answer ONLY from knowledge/services.json; never invent steps or fees. Uncovered agency → "هالجهة موجودة في سهل بس لسا ما انضافت للنموذج التجريبي". Off-topic → "أنا أساعد في خدمات سهل بس" then suggest the closest service. Special case → give the general path and say "للحالات الخاصة راجع الجهة". Never ask for personal data; if the user types a civil ID or passport number, ignore it and say it is not needed. If asked "انت رسمي؟" → "لا، أنا نموذج تجريبي مستقل". Unknown fee → "ما عندي معلومة مؤكدة عن الرسوم".
Length: 3–6 lines, no headings or tables, bullets only when needed. Memory: current conversation only (last 6 messages). Logging: each question is appended to logs/questions.log as timestamp + text only, after stripping any 12-digit number or passport-like token.

## 5. Knowledge base
Agency list order (exactly as in the app): تُواصل، الأمانة العامة للأوقاف، الإدارة العامة للجمارك، الديوان الوطنى لحقوق الإنسان، المؤسسة العامة للتأمينات الإجتماعية، المؤسسة العامة للرعاية السكنية، المركز الوطني للأمن السيبراني، الهيئة العامة لشئون القصر، الهيئة العامة لشئون ذوي الإعاقة، الهيئة العامة للاتصالات وتقنية المعلومات، الهيئة العامة للبيئة، الهيئة العامة للتعليم التطبيقي والتدريب، الهيئة العامة للشباب والرياضة، الهيئة العامة للصناعة، الهيئة العامة للطيران المدني، الهيئة العامة للقوى العاملة، الهيئة العامة للمعلومات المدنية، الهيئة العامة لمكافحة الفساد (نزاهة)، بلدية الكويت، بنك الائتمان الكويتي، بيت الزكاة، جامعة الكويت، خدمات المسافرين، ديوان الخدمة المدنية، قوة الإطفاء العام، وزارة الأشغال العامة، وزارة الإعلام، وزارة التجارة والصناعة، وزارة التربية، وزارة التعليم العالي، وزارة الخارجية، وزارة الداخلية، وزارة الدفاع، وزارة الشئون الإسلامية، وزارة الشئون الاجتماعية، وزارة الصحة، وزارة العدل، وزارة الكهرباء والماء والطاقة المتجددة، وزارة المالية، وزارة المواصلات.
Covered by the agent (6): الهيئة العامة للمعلومات المدنية and وزارة الداخلية (fully documented from screenshots, below); وزارة العدل, وزارة الصحة, وزارة الكهرباء والماء والطاقة المتجددة, الهيئة العامة للقوى العاملة (to be researched from official sources). All other agencies appear by name only with no services.

الهيئة العامة للمعلومات المدنية — categories and services:
- الشهادات: إصدار شهادة جهة، إصدار شهادة فرد
- خدمات الأفراد: إضافة / تحديث صورة شخصية، استكمال بيانات مولود، تأكيد موافقة المالك، تحديث إسم عربي، تحديث اسم لاتيني لفرد كويتي، تحديث البريد الإلكتروني، تحديث رقم الهاتف، تحديث فصيلة الدم، تسجيل إلتحاق بعائل أول مره مادة 22-26-27-29، تسجيل عمالة منزلية أول مره مادة 20، تسجيل وإعادة قيد مادة 17-18-19-21-23-24-25-28-30-31، تعديل الوضع - المادة الثامنة، تعديل وضع (المادة 7-كفالة شخصية)، تغيير عنوان غير كويتي، تغيير عنوان كويتي، تفويض سكن، دفع الرسوم فرد / أسرة، دمج رقم مدني، طلب الإطلاع على المعلومات
- خدمات البطاقة: التجديد لفرد خليجي، بدل فاقد، تجديد البطاقة، توفر العنوان
- خدمات الجهات والمباني: إصدار رقم آلي لأرض فضاء، إضافة جهة، إضافة ديوانية على كويت فايندر، إضافة مبنى، إلغاء مبنى، تعديل بيانات جهة، تعديل بيانات مبنى، توفير خدمات المعلومات المكانيه و كويت فايندر، شطب الجهة، متابعة طلبات الجهات و العناوين
- خدمة بيانات القاطنين: شطب القاطنين، طلب جديد، عرض القاطنين، متابعة الشكاوى
- متابعة الطلبات: متابعة حالة المعاملات

وزارة الداخلية — categories and services:
- الخدمات الأمنية: اصدار شهادة الحالة الجنائية، الإبلاغ عن فقدان الوثائق، التحقق من وجوب اجراء البصمة البيومترية، متابعة قضايا الجنح
- خدمات أكاديمية سعد العبدالله: الاستعلام عن طلب الالتحاق، تسجيل طلب إلتحاق، تعديل طلب الالتحاق
- خدمات أمن المنافذ: إصدار تقرير حركة الدخول والخروج
- خدمات الأنظمة الأمنية: تسجيل بيانات إثبات ملكية الدرون، متابعة طلبات نقل ملكية الدرون، نقل ملكية الدرون
- خدمات الإقامة: إذن غياب خارج البلاد، إصدار إقامة مؤقته، اصدار الإقامة، الغاء إقامة العامل المنزلي المغادر، تجديد الإقامة، تحديث بيانات جواز السفر للمقيم، تحويل إقامة العامل المنزلي من كفيل لآخر، تقديم بلاغ ترك العمل للعمالة المنزلية، شهادة إثبات ترخيص الإقامة، نتيجة الفحص الطبي للمقيم، نقل وتجديد الإقامة المؤقتة
- خدمات التأشيرة: الاستعلام عن إمكانية استقدام العامل المنزلي، تأشيرة العمالة المنزلية، تحميل التأشيرة الإلكترونية
- خدمات التحقيقات: شهادة إخطار بالتصرف في شكوى
- خدمات الجنسية الكويتية: إصدار شهادات إدارة الجنسية، شهادة إثبات جنسية للمتوفي
- خدمات الدفع الإلكتروني: دفع المستحقات المالية، دفع تذاكر المبعدين، دفع رسوم العمالة المنزلية الإضافية، دفع غرامات شئون الإقامة، دفع مخالفات المرور
- خدمات المؤسسات الإصلاحية: طلب إصدار الشهادات، طلب زيارة النزيل
- خدمات المرور: تجديد رخصة المركبة، تحميل رخصة قيادة إلكترونية، تحميل رخصة مركبة إلكترونية، تفويض استخدام المركبة، خدمات رخص القيادة، مواعيد اختبار القيادة، نقل ملكية المركبة
- خدمات تنفيذ الأحكام: اصدار شهادة براءة ذمة من تنفيذ الأحكام، الأحكام المقيدة لإنجاز الخدمات
- خدمات جواز السفر الكويتي: إصدار وثيقة سفر إضطرارية إلكترونية، تجديد جواز السفر الكويتي، شهادة "صورة طبق الاصل" لجواز السفر الكويتي
- خدمات خفر السواحل: دفع مخالفات القطع البحرية، شهادة ملكية قطعة بحرية
- خدمات شئون المادة الخامسة: تقديم تعديل الوضع وإثبات الجدية

Rule for every record: fields name, agency, category, requirements, documents, fees, duration, last_verified, source_url. A field with no official source stays empty. Accepted sources: e.gov.kw, official ministry sites, Sahel's official accounts, Al-Qabas / Al-Anba / Al-Rai for announcements. The knowledge base lives in knowledge/services.json, separate from the page.

## 6. Privacy and safety
Invented data only, all in data/profile.json: name عبدالله محمد سالم الكويتي; civil ID 288010100124 (looks real but fails the civil-ID check digit, so it cannot belong to anyone); passport P00123456; plates 00-12345 and 00-67890; visas 300000001, 300000002; sponsorship civil IDs 300010100001–300010100004; violations 000001-00001-2026-000 and 000002-00002-2026-000; children عبدالرحمن، نورة، فهد، سارة، يوسف; an illustrated avatar drawn in code (assets/avatar.png), never a photo. Never any real name or number. The real screenshots in screenshots/ are git-ignored and used only for layout, colours, fonts and menu text.
No login, no identifying cookies, no IP stored. Only question text + timestamp is logged, after stripping IDs.
Clearly a demo: the fixed yellow bar; browser title "نموذج إيجنت سهل — تجريبي"; no official logos; never present PACI as the publisher.
No key ever lives in the repo or on disk. An API key, if used, stays in the browser's localStorage only.

## 7. Technology
Node.js project, single local server (Express or plain http) on port 5318 serving /public. public/index.html with inline CSS/JS. knowledge/services.json. start-demo.bat and start-demo.command. Server prints the local URL and the LAN URL.
Agent flow: page → POST /api/chat with last 6 messages → server builds the system prompt (section 4 verbatim + full services.json) → provider → reply → page.
Providers, chosen in a Settings page in the UI (same as the E-VIAS coop demo): (a) Claude Code CLI: server runs `claude -p <prompt> --output-format json`; (b) Codex CLI: `codex exec`; (c) API key (Anthropic or OpenAI) entered in the browser. Settings has "Test connection" that sends "say ok" and shows Connected / error. No provider → a clear Arabic message in the drawer, never a crash.
Public GitHub repo abu-7sain-ai/sahel-agent-demo. Runs locally; no public URL.

## 8. Phases and acceptance
Stage 1 Shell → Stage 2 Knowledge → Stage 3 Agent → Stage 4 Tests → Stage 5 GitHub → Stage 6 Hand-off.
Ten acceptance questions (all must pass the format and refusal rules):
1. شلون أجدد البطاقة المدنية؟
2. أبي أطلع استمرارية زواج.
3. وين أدفع مخالفات المرور؟
4. شلون أجدد إقامة الخدامة؟
5. أبي شهادة لمن يهمه الأمر.
6. ضاع جوازي، شسوي؟
7. كم رسوم تجديد الجواز؟ (answer from source, or say the fee is not confirmed)
8. شلون أسجل مولود جديد؟
9. أبي أغير عنواني.
10. وش أفضل مطعم بالكويت؟ (must refuse and redirect)

## 9. Decisions (defaults, confirmed unless changed in Phase 1)
1 agent name سهّال · 2 the six agencies above · 3 public repo, local run, subscription via Claude Code CLI, API key as second option · 4 mirror the asker's dialect · 5 the four quick questions above · 6 fixed yellow demo bar · 7 letter-circle logos.

## 10. Working language
Everything sent to Claude Code is English; everything the user sees is Arabic. Claude Code reports in English.
