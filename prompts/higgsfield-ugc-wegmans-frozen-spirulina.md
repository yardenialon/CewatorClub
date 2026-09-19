# Higgsfield UGC — "חזרתי מווגמנס" · ספירולינה טרייה בהקפאה

> **עדכון חשוב (סעיף 7):** המוצר הוא שקית עמידה צהובה של SimpliiGood עם בליסטר של 10 קוביות, לא קופסת קרטון. סעיף 7 מכיל את נעילת המוצר המדויקת ואת הבריף המעודכן, והוא גובר על תיאורי "carton / flip-top lid" בסעיפים 1–6.

חבילת פרומפטים מוכנה ל-Higgsfield, בנויה לפי ה-workflow הרשמי `ugc-review-video`
(סטוריבורד 8 סלוטים ב-GPT Image 2 → ניקוי "AI-slop" ב-Seedream → קליפ עם דיבור מובנה ב-Seedance 2.5).

הפרומפטים עצמם באנגלית כי המודלים עובדים באנגלית והסרטון מיועד לקהל אמריקאי של Wegmans.

---

## 0. מה צריך להכין לפני שמריצים

| פריט | מה לשים |
|---|---|
| `character_media_id` | תמונת האווטר שלכם (פנים ברורות, גוף עליון, תאורת יום) |
| `product_box_front` | האריזה מלפנים |
| `product_box_angle2` | האריזה מזווית שנייה (צד / שלושת-רבעי) |
| `product_tray` | המגשית עם קוביות הספירולינה הקפואות |
| `product_dish` | המנה המוכנה |
| משך | 20 שניות = 2 לוחות: 15 שניות + 5 שניות (Reels / TikTok) |
| שפה | English, American accent, NATURAL register |

**דברים שצריך לוודא מול התמונות שלכם ולתקן בפרומפט (מסומנים ב-`[VERIFY]`):**
מידות האריזה בס"מ, סוג הפתיחה (מכסה מתקפל / לשונית), מה המנה בתמונה (ברירת מחדל: smoothie bowl).

**כללי אמת (חובה מבחינת Higgsfield ומבחינת FTC):**
- הטקסט מכיל רק מכניקה נראית לעין (קופסה, מגשית, קובייה, צבע). אין טענות בריאותיות, אין "טעם", אין מספרים.
- אם יש לכם רשימת טענות מאושרות משפטית, הכניסו אותן **מילה במילה** בסלוט `[APPROVED CLAIM]` בתסריט. בלי רשימה, השאירו את התסריט כמו שהוא.
- הפוסט מסומן כתוכן ממומן / של המותג (#ad). האווטר היא מציגה, לא "לקוחה אמיתית".
- לוגו Wegmans **לא** מופיע על המסך (חוקי המודל אוסרים לוגו של מותג צד ג'). השם נאמר בקול. השקית היא שקית נייר חומה חלקה.

---

## 1. התסריט (44 מילים, שני מקטעים)

**Segment 1 — Board 1 (HOOK + SETUP, 0–15s):**

> Guess what came home from Wegmans with me. Freezer aisle, right by the frozen fruit— fresh spirulina. Not the powder, actual FRESH spirulina, frozen. And inside, a tray of little frozen portions.

**Segment 2 — Board 2 (APPLY + CLOSER, 15–20s):**

> —one pops right out, into the bowl, deep GREEN. Freezer aisle, Wegmans.

(אם יש טענה מאושרת: הוסיפו `[APPROVED CLAIM]` מילה במילה במקום "deep GREEN" בלבד, כדי לא לחרוג מתקציב 5 השניות.)

**Persona sentence (מועתק מילה במילה לכל פרומפט):**

> a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that.

**Product description (מועתק מילה במילה לכל פרומפט):**

> a small rectangular frozen-food carton, palm-sized, fits entirely in one hand, approximately 12 cm wide and 9 cm tall [VERIFY], matte printed cardboard with the exact front label from @Image1, a flip-top lid hinged along the back edge [VERIFY]; inside sits one clear plastic tray holding rows of small thumb-sized frozen deep-green spirulina portions; no window on the box, no shrink wrap; one honest imperfection: a faint frost line along the tray edge.

---

## 2. אופציה A — בריף קצר להדביק לצ'אט של Higgsfield (ה-workflow בונה הכל לבד)

```
Make a 20-second UGC-style talking-head video (9:16) using the ugc-review-video workflow — two boards, 15s + 5s.

Creator: use my attached avatar image as the creator reference (I am authorized to use it). She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that. NATURAL register, English, American accent. No music.

Product: attached — a frozen-food carton of fresh frozen spirulina (front of box, second angle of box, the inner tray of frozen portions, and the finished dish). Angle-lock the product to these four references only.

Scenario (director mode, use exactly these beats, shot as an authentic selfie video with hard cuts between selfie and propped-phone static shots): Board 1 (15s) — she is caught mid-unpacking a plain brown paper grocery bag on a daylight kitchen counter, pulls out the box, shows the front, opens the lid, and reveals the tray of frozen portions. Board 2 (5s) — she pops ONE portion out, drops it into a smoothie bowl, it turns deep green, and the closing frame is the finished dish next to the box. The store name is spoken only — no Wegmans logo or any real brand logo on screen; the bag is a plain unbranded paper bag.

Script (use verbatim, first word lands within 0.4s of frame one):
Board 1 (15s): "Guess what came home from Wegmans with me. Freezer aisle, right by the frozen fruit— fresh spirulina. Not the powder, actual FRESH spirulina, frozen. And inside, a tray of little frozen portions."
Board 2 (5s): "—one pops right out, into the bowl, deep GREEN. Freezer aisle, Wegmans."

approved_claims: [] (no health, taste, or comparative claims — observable mechanics only)
Text on video: none. Post package: yes, with #ad disclosure.
```

---

## 3. אופציה B — הפרומפטים המלאים, שלב-שלב (שליטה מלאה)

### 3.1 Board 1 — `gpt_image_2`, 21:9, 2k, quality high

`medias` בסדר הזה: `[product_box_front, product_box_angle2, product_tray, product_dish, character]`

```
@Image1, @Image2, @Image3 and @Image4 are the product references: @Image1 is the front of the box, @Image2 a second angle of the same box, @Image3 the inner tray of frozen portions, @Image4 the finished dish. ANGLE LOCK: the product may appear only from these provided angles; switch angles only by hard cuts between slots, never by continuous rotation; do not invent intermediate or unseen sides, back panels, or internal components. @Image5 is the character reference. The same person appears in every slot with identical face, hair, body, and identity — no changes to features, hair, or proportions between slots. She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that.

The product is a small rectangular frozen-food carton, palm-sized, fits entirely in one hand, approximately 12 cm wide and 9 cm tall, matte printed cardboard with the exact front label from @Image1, a flip-top lid hinged along the back edge; inside sits one clear plastic tray holding rows of small thumb-sized frozen deep-green spirulina portions; no window on the box, no shrink wrap; one honest imperfection: a faint frost line along the tray edge. Product is rendered at realistic real-world scale relative to the character's hand and body. The product is approximately 9 cm tall and fits naturally in the character's hand without enlargement. If the label is small in frame, the camera moves closer rather than scaling the product up.

A single ultra-wide horizontal storyboard sheet composed of exactly EIGHT equal-size 9:16 vertical slots arranged in ONE HORIZONTAL ROW, separated by thin white gutters on a clean white background, total sheet aspect 21:9. Do NOT make two rows and do NOT make a grid — exactly eight panels in one row, never ten, never twelve. All eight slots are active photorealistic UGC iPhone-style stills that tell one continuous 15-second video clip as eight sequential beats — slot 1 is beat 1 (opening), slot 8 is beat 8 (closing). There are no placeholder slots. Each adjacent pair of slots is a DIFFERENT camera setup — a different POV (selfie vs static camera), a different distance band (tight/macro vs medium vs wide), and a different action — so every beat boundary reads as a crisp hard cut, never a morph.

Setting and lighting in all eight slots: a real lived-in home kitchen, light wood counter, white tile backsplash, one window to camera-left giving even neutral daytime light, a plain unbranded brown paper grocery bag on the counter, a few unlabeled groceries (a bunch of bananas, a bag of frozen berries with no legible text). Same environment, time of day, and light direction in every slot. Outfit stays identical across all slots: exactly as in the character reference.

Exactly one spirulina carton appears in frame in every slot where it is visible — never a duplicate, never a look-alike clone, never a second box in the bag. Product placement in every slot is clean: either fully visible held in one hand, fully hidden inside the closed paper bag, or absent from the frame — never half-sticking out, never balancing awkwardly, never partial.

The character has exactly two hands. In selfie POV slots, one hand is occupied by the phone (off-frame or visible at edge), so only one hand is available for action — never two objects in selfie POV. Every slot names what EACH hand is doing — one role per hand, the idle hand parked explicitly — never more than two simultaneous hand-roles. Slots requiring two free hands are static camera POV with the phone not in frame. POV may change between slots — every POV change aligns with a hard cut between slots, never a smooth transition.

Hook staging (slot 1): frame one is caught mid-action — the paper bag is already mid-lift onto the counter, her hair mid-swing, as if the viewer walked in on her unpacking.

Slot 1 — exact 9:16 vertical photorealistic UGC iPhone still, selfie POV, medium close-up: she is mid-motion hoisting the plain brown paper bag onto the counter, body angled toward the window, eyes already on the lens with a half-formed grin; left hand holds the phone off-frame, right hand grips the bag's paper handle; product fully hidden inside the closed bag; loose strand of hair across her cheek, neutral daylight from camera-left.

Slot 2 — exact 9:16 vertical still, static camera POV (phone propped on the counter, not in frame), wide: full upper body at the counter, she is lifting the spirulina carton up and out of the open paper bag — right hand holds the carton fully visible, front label toward camera as in @Image1, left hand steadies the bag's rim; head tilted down at the box, lips parted mid-word; bananas and the berry bag on the counter, no legible text on them.

Slot 3 — exact 9:16 vertical still, selfie POV, tight close-up: the carton held up beside her jaw, front label facing the lens exactly as in @Image1, filling roughly a third of the frame at real palm size; right hand holds the carton, left hand holds the phone off-frame; eyebrows raised, eyes on the box not the lens, mouth mid-sentence.

Slot 4 — exact 9:16 vertical still, static camera POV, macro: camera very close to the carton standing on the wood counter, front panel sharp and readable at real size, faint frost bloom on the cardboard; her right index fingertip rests on the top edge of the box, left hand flat on the counter behind it; her face out of frame; deep focus, background tile sharp.

Slot 5 — exact 9:16 vertical still, selfie POV, medium: she holds the carton chest-high showing the second angle exactly as in @Image2 (a hard-cut angle switch, not a rotation), right hand holds the carton, left hand holds the phone off-frame; small delighted "oh" shape on her mouth, chin slightly tucked, shoulders relaxed.

Slot 6 — exact 9:16 vertical still, static camera POV, medium close-up: both hands on the carton on the counter, left hand holding the base, right thumb lifting the flip-top lid open — lid in exactly one state: open; her face in the top of frame looking down at the box, lips together in a closed-mouth smile; phone not in frame.

Slot 7 — exact 9:16 vertical still, static camera POV, macro: inside the open carton, the clear tray of frozen deep-green portions exactly as in @Image3, frost crystals catching the window light, faint frost line along the tray edge; right hand tilts the open box toward the camera, left hand flat on the counter; no face in frame; deep focus.

Slot 8 — exact 9:16 vertical still, selfie POV, medium close-up: she leans in toward the lens, open carton held in her right hand at chest height with the tray visible inside, left hand holds the phone off-frame; eyes flick down toward the tray, lips pressed together mid-breath, head slightly tilted, stray hair on her cheek, neutral daylight.

Rendering rules: every slot is an exact 9:16 vertical rectangle, all eight slots identical in size, arranged in ONE HORIZONTAL ROW (do NOT make two rows or a grid — exactly eight panels in one row, never ten, never twelve) with thin white gutters on a clean white background, total sheet aspect 21:9. All eight slots are active — there are no placeholder slots. No two adjacent slots share both their POV and their distance band. Active slots are photorealistic iPhone-style UGC stills with natural light and casual real-life feel. The character's identity is identical across all eight panels. The character has exactly two hands; selfie POV occupies one hand with the phone, leaving one hand for action; two-handed actions are static camera POV; every slot names each hand's single role, the idle hand parked explicitly, and the total simultaneous hand-roles never exceed two. POV may change between slots; every POV change aligns with a hard cut, never a smooth transition. The product appears at realistic real-world scale relative to the character's hand and body, never enlarged for visibility, and keeps only the provided reference angles across all appearances. Product placement is always clean: fully held in hand, fully hidden inside the closed bag, or absent — never partial, never sticking out, never balancing awkwardly. Exactly one product in frame wherever it appears — never duplicated. Each prop holds exactly one state per slot — the lid is closed or open, never both. No on-image text of any kind: no header, no metadata, no captions, no pop-text, no badges, no numbers, no subtitles, no watermarks. No legible text or numbers on any prop beyond the product's own label. No store logo, no grocery-chain branding, no real brand logos on the bag or any grocery item. No shallow depth of field, no bokeh, no lens flare, no beauty filter, no cinematic color grade. No fisheye lens, no ultra-wide distortion. No mirror or reflection shots. No deformed hands. No third arm, no extra hands, no duplicated limbs. No additional brands or logos beyond the user's product. No invented product claims.
```

### 3.2 De-slop pass על Board 1 — `seedream_v5_pro`, 21:9, 2k

ייבאו את ה-URL של הלוח הגולמי עם `media_import_url`, שימו אותו כ-`image_references`, והדביקו:

```
KEEP EXACTLY the framing, composition, slot layout, camera distances, poses, subjects and product of this horizontal storyboard sheet and every one of its side-by-side vertical slots — no reframe, no zoom, no crop, no re-layout, no change to the scene, to any person's face / hair / body, or to the product design. CHANGE ONLY micro-realism, applied identically in every slot: true-to-life pore-level skin with natural texture and fine vellus hair, real material detail, even natural daytime light with gentle highlight roll-off and faint true sensor noise, a flat authentic iPhone photo, deep focus. PRESERVE each face's exact shape / width / proportions 1:1 — do NOT squeeze / narrow / slim / stretch any face. AVOID AI-slop: waxy plastic skin, airbrushed poreless skin, beauty-filter smoothing, over-saturation, HDR glow / bloom / halos, oversharpening, teal-orange grade, shallow depth of field, bokeh, cinematic / DSLR look. Keep the product exactly as it is, no added text, no watermark, no baked slot labels.
```

(אם נכשל במודרציה: אותו פרומפט על `seedream_v5_lite`.)

### 3.3 Board 2 (5-second clip) — `gpt_image_2`, 21:9, 2k, quality high

`medias` בסדר הזה: `[product_box_front, product_box_angle2, product_tray, product_dish, character, clean_board_1]`

```
@Image1, @Image2, @Image3 and @Image4 are the product references: @Image1 is the front of the box, @Image2 a second angle of the same box, @Image3 the inner tray of frozen portions, @Image4 the finished dish. ANGLE LOCK: the product may appear only from these provided angles; switch angles only by hard cuts between slots, never by continuous rotation; do not invent intermediate or unseen sides. @Image5 is the character reference. @Image6 is the previous storyboard: preserve its identity, kitchen, light direction, wardrobe, props, and product exactly — this board continues the same take. The same person appears in every slot with identical face, hair, body, and identity — no changes to features, hair, or proportions between slots. She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that.

The product is a small rectangular frozen-food carton, palm-sized, fits entirely in one hand, approximately 12 cm wide and 9 cm tall, matte printed cardboard with the exact front label from @Image1, a flip-top lid hinged along the back edge; inside sits one clear plastic tray holding rows of small thumb-sized frozen deep-green spirulina portions; no window on the box, no shrink wrap; one honest imperfection: a faint frost line along the tray edge. Product is rendered at realistic real-world scale relative to the character's hand and body. The product is approximately 9 cm tall and fits naturally in the character's hand without enlargement. If the label is small in frame, the camera moves closer rather than scaling the product up. Cross-board continuity: the lid is already open from the previous board; the tray is now being handled.

A single ultra-wide horizontal storyboard sheet composed of exactly EIGHT equal-size 9:16 vertical slots arranged in ONE HORIZONTAL ROW, separated by thin white gutters on a clean white background, total sheet aspect 21:9. Do NOT make two rows and do NOT make a grid — exactly eight panels in one row, never ten, never twelve. All eight slots are active photorealistic UGC iPhone-style stills that tell one continuous 5-second video clip as eight sequential beats — slot 1 is beat 1 (opening), slot 8 is beat 8 (closing). There are no placeholder slots. Each adjacent pair of slots is a DIFFERENT camera setup — a different POV (selfie vs static camera), a different distance band (tight/macro vs medium vs wide), and a different action — so every beat boundary reads as a crisp hard cut, never a morph.

Setting and lighting in all eight slots: the same home kitchen as @Image6 — light wood counter, white tile backsplash, window to camera-left, even neutral daytime light; the plain brown paper bag now pushed to the back of the counter; a plain white ceramic bowl of thick pale smoothie base [VERIFY: match the dish in @Image4] sits on the counter; a plain metal spoon. Outfit identical to @Image6.

Exactly one spirulina carton and exactly one tray appear in frame wherever visible — never duplicated; exactly one frozen portion is ever out of the tray at a time. Product placement in every slot is clean: fully visible held in hand, resting flat on the counter, or absent — never partial, never balancing.

The character has exactly two hands. In selfie POV slots, one hand is occupied by the phone (off-frame or visible at edge), so only one hand is available for action. Every slot names what EACH hand is doing — one role per hand, the idle hand parked explicitly — never more than two simultaneous hand-roles. Slots requiring two free hands are static camera POV with the phone not in frame. POV may change between slots — every POV change aligns with a hard cut between slots, never a smooth transition.

Slot 1 — exact 9:16 vertical photorealistic UGC iPhone still, static camera POV (phone propped, not in frame), macro: the clear tray is lifted just out of the open carton and held over the counter, her left hand holds the tray, right thumb is mid-push on the underside of one cell so a single deep-green frozen portion is popping up out of it — mid-motion, frost crystals on the portion; no face in frame; deep focus.

Slot 2 — exact 9:16 vertical still, selfie POV, medium close-up: she holds one single frozen green portion up between the thumb and index finger of her right hand near her cheek, left hand holds the phone off-frame; eyebrows lifted, small "oh" mouth, eyes on the portion; the tray rests flat on the counter out of her hands.

Slot 3 — exact 9:16 vertical still, static camera POV, wide: upper body at the counter, she is dropping the one green portion from her right hand into the white bowl of pale smoothie base, left hand steadies the bowl's rim; the open carton stands on the counter beside the bowl, exactly one box; lips parted mid-word, gaze on the bowl.

Slot 4 — exact 9:16 vertical still, static camera POV, macro: inside the bowl, the frozen portion half-sunk into the pale base with a deep-green streak spreading around it as it starts to melt; her right hand holds the spoon mid-stir, left hand grips the bowl's rim; no face in frame; window light raking across the surface.

Slot 5 — exact 9:16 vertical still, selfie POV, tight close-up: her face only, lips pressed together in a closed-mouth grin, eyes cast down toward the counter then lifting, chin tucked; right hand out of frame parked on the counter, left hand holds the phone off-frame; product absent from this frame.

Slot 6 — exact 9:16 vertical still, static camera POV, medium close-up: the finished dish exactly as in @Image4, now fully deep green, set down on the counter by both her hands — left hand cupping the bowl, right hand releasing the spoon beside it; the single carton stands to the right of the bowl, front label toward camera as in @Image1; her face at the top edge of frame looking down.

Slot 7 — exact 9:16 vertical still, selfie POV, medium close-up: she raises the finished green bowl in her right hand toward the lens at chest height, left hand holds the phone off-frame; wide easy grin, head tilted, hair moving; the carton stands on the counter behind her at real size.

Slot 8 — exact 9:16 vertical still, static camera POV, medium: loop-ready closing frame — the finished green bowl and the single carton side by side on the counter, front label toward camera; her right hand is sliding the carton a few centimeters toward the lens, fingertips on the lid, left hand flat on the counter; her face in the upper frame, lips together, calm satisfied look; nothing else added to the scene.

Rendering rules: every slot is an exact 9:16 vertical rectangle, all eight slots identical in size, arranged in ONE HORIZONTAL ROW (do NOT make two rows or a grid — exactly eight panels in one row, never ten, never twelve) with thin white gutters on a clean white background, total sheet aspect 21:9. All eight slots are active — there are no placeholder slots. No two adjacent slots share both their POV and their distance band. Active slots are photorealistic iPhone-style UGC stills with natural light and casual real-life feel. The character's identity is identical across all eight panels and identical to @Image6. The character has exactly two hands; selfie POV occupies one hand with the phone, leaving one hand for action; two-handed actions are static camera POV; every slot names each hand's single role, the idle hand parked explicitly, and the total simultaneous hand-roles never exceed two. POV may change between slots; every POV change aligns with a hard cut, never a smooth transition. The product appears at realistic real-world scale relative to the character's hand and body, never enlarged for visibility, and keeps only the provided reference angles across all appearances. Product placement is always clean. Exactly one carton, one tray, and at most one loose portion in frame wherever they appear — never duplicated. Each prop holds exactly one state per slot. No on-image text of any kind: no header, no metadata, no captions, no pop-text, no badges, no numbers, no subtitles, no watermarks. No legible text or numbers on any prop beyond the product's own label. No store logo, no grocery-chain branding, no real brand logos anywhere. No shallow depth of field, no bokeh, no lens flare, no beauty filter, no cinematic color grade. No fisheye lens, no ultra-wide distortion. No mirror or reflection shots. No deformed hands. No third arm, no extra hands, no duplicated limbs. No additional brands or logos beyond the user's product. No invented product claims.
```

ואז שוב את ה-de-slop pass (3.2) על Board 2.

### 3.4 Clip 1 — `seedance_2_5`, 9:16, 1080p, 15s, `mode: omni_reference`, `generate_audio: true`

`medias`: `[clean_board_1, character, product_box_front, product_tray]`

```
Style & Mood: UGC iPhone aesthetic, even neutral daytime window light from camera-left in a real home kitchen, MIXED: starts SELFIE handheld, hard-cuts to STATIC locked-off, hard-cuts back to SELFIE handheld — POV alternates per cut, deep focus with the background sharp, 23mm-wide phone look with mild edge distortion, one small auto-exposure adjustment mid-clip on a selfie cut, mild HDR flattening, faint shadow noise, pore-level skin with no smoothing, real weight and contact shadows, social media vertical format.

Narrative Summary: She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that. HOOK + SETUP: caught mid-unpacking a plain paper grocery bag, she pulls out one small carton of frozen fresh spirulina, shows its front, flips the lid open and reveals the tray of frozen portions, performed by a natural, engaged creator — genuine reactions, lively but human, never staged screaming energy.

Dynamic Description:
Cut 1 (0-2s) — MEDIUM CLOSE-UP SELFIE: the paper bag is already mid-hoist onto the counter as frame one opens, her hair swinging across her cheek, her eyes snapping to the lens with a half-formed grin, a small bright laugh escaping as her shoulders drop; right hand grips the paper handle, left hand holds the camera off-frame; the carton is fully hidden inside the closed bag. Hard cut to.
Cut 2 (2-4s) — WIDER STATIC: locked-off frozen frame of her upper body at the counter, she reaches into the open bag and lifts out exactly one carton, front label toward camera, her right hand holding it fully, left hand steadying the bag rim, chin dipping to look at it, a quick eyebrow flick, lips moving mid-word. Hard cut to.
Cut 3 (4-6s) — TIGHT CLOSE-UP SELFIE: the carton rises beside her jaw at real palm size, label facing the lens, right hand holding it, left hand off-frame with the camera; she glances at the box then back to the lens, eyebrows up, a tiny head shake of disbelief, breath visible in the pace of her words. Hard cut to.
Cut 4 (6-7.5s) — MACRO STATIC: locked-off, camera very close to the carton standing on the wood counter, the front panel sharp and readable at real size, faint frost on the cardboard, her right index fingertip tapping once on the top edge, left hand flat on the counter, her face out of frame. Hard cut to.
Cut 5 (7.5-9.5s) — MEDIUM SELFIE: she holds the carton chest-high at the second reference angle (a hard-cut switch, not a rotation), right hand holding, left hand off-frame with the camera; her mouth forms a small delighted "oh", chin tucks, a stray strand of hair is puffed off her lip. Hard cut to.
Cut 6 (9.5-11.5s) — MEDIUM CLOSE-UP STATIC: locked-off frame, both hands on the carton on the counter, left hand holding the base, right thumb lifting the flip-top lid open in one motion — one state change, lid goes from closed to open and stays open; her face at the top of frame looking down, lips together in a closed-mouth smile, no voice for this beat. Hard cut to.
Cut 7 (11.5-13.5s) — MACRO STATIC: locked-off, inside the open carton the clear tray of frozen deep-green portions, frost crystals catching the window light, a faint frost line along the tray edge; her right hand tilts the open box toward the lens, left hand flat on the counter, a soft exhale audible. Hard cut to.
Cut 8 (13.5-15s) — MEDIUM CLOSE-UP SELFIE: she leans into the lens with the open carton in her right hand at chest height, tray visible inside, left hand off-frame with the camera; eyes flick down to the tray and back up, she bites her lower lip into a grin, head tilts, the frame holds on her mid-breath.

Static Description: A real lived-in home kitchen with a light wood counter and white tile backsplash, one window to camera-left giving even neutral daylight, a plain unbranded brown paper grocery bag, a bunch of bananas and an unlabeled bag of frozen berries on the counter. Exactly one spirulina carton exists in the scene; the only box-shaped object in frame is the product.

Audio: She speaks to camera with a clear, bright, articulate American voice, iPhone microphone audio with natural room tone. [*small bright laugh*] "Guess what came home from Wegmans with me. Freezer aisle, right by the frozen fruit— fresh spirulina. Not the powder, actual FRESH spirulina, frozen. And inside, a tray of little frozen portions."

Facial features clear and undistorted, consistent clothing throughout. Shot on iPhone, natural lighting, social media aesthetic, handheld micro-shake during selfie cuts, locked-off frozen frame during static-camera cuts. No on-screen text, no subtitles, no captions, no watermarks, no legible text on any object except the product's own label, no store logo, no real brand logos anywhere, no phone visible in any frame, no cinematic grade, no film grain, no bokeh, no lens flare, no fisheye lens, no ultra-wide distortion, no slow motion, no beauty filter, no third arm, no extra hands, no duplicated limbs, no deformed hands, exactly one product in every frame.
```

### 3.5 Clip 2 — `seedance_2_5`, 9:16, 1080p, 5s, `mode: omni_reference`, `generate_audio: true`

`medias`: `[clean_board_2, character, product_tray, product_dish]`

```
Style & Mood: UGC iPhone aesthetic, even neutral daytime window light from camera-left in the same home kitchen, MIXED: starts STATIC locked-off, hard-cuts to SELFIE handheld, and alternates per cut, deep focus with the background sharp, 23mm-wide phone look with mild edge distortion, one small auto-exposure adjustment mid-clip on a selfie cut, mild HDR flattening, faint shadow noise, pore-level skin with no smoothing, real weight and contact shadows, social media vertical format.

Narrative Summary: She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that. APPLY + CLOSER in a fast 5-second burst, continuing the same take mid-thought: she pops one frozen portion out of the tray, drops it into a bowl, it melts into deep green, and the clip lands on the finished dish beside the box, performed by a natural, engaged creator — genuine reactions, lively but human, never staged screaming energy.

Dynamic Description:
Cut 1 (0-0.7s) — MACRO STATIC: locked-off frame opens with her right thumb already mid-push under one cell of the clear tray held in her left hand, a single deep-green frozen portion popping up out of it, frost crystals flicking off, her voice already running from frame one; no face in frame. Hard cut to.
Cut 2 (0.7-1.3s) — MEDIUM CLOSE-UP SELFIE: she holds the one green portion up between her right thumb and index finger beside her cheek, left hand off-frame with the camera, the tray resting flat on the counter; eyebrows lift, a small "oh" on her mouth, she turns the portion once in her fingers, eyes on it. Hard cut to.
Cut 3 (1.3-2s) — WIDER STATIC: locked-off frame of her upper body at the counter, she drops the single portion from her right hand into the white bowl of pale smoothie base, left hand steadying the rim, a soft plop, her gaze following it down, lips mid-word; the one open carton stands beside the bowl. Hard cut to.
Cut 4 (2-2.6s) — MACRO STATIC: locked-off, inside the bowl the portion sinks and a deep-green streak spreads through the pale base as her right hand pulls the spoon through it once, left hand gripping the rim, window light raking across the surface, no face in frame. Hard cut to.
Cut 5 (2.6-3.2s) — TIGHT CLOSE-UP SELFIE: her face only, lips pressed together in a closed-mouth grin with no voice for this beat, eyes cast down toward the counter then lifting to the lens, chin tucked, a small nod; left hand off-frame with the camera, right hand parked flat on the counter out of frame; no product in this frame. Hard cut to.
Cut 6 (3.2-3.8s) — MEDIUM CLOSE-UP STATIC: locked-off, both her hands set the finished deep-green dish down on the counter, left hand cupping the bowl, right hand laying the spoon beside it, the single carton standing to the right with its front label toward camera, her face at the top edge looking down, a satisfied exhale. Hard cut to.
Cut 7 (3.8-4.4s) — MEDIUM CLOSE-UP SELFIE: she raises the finished green bowl in her right hand toward the lens at chest height, left hand off-frame with the camera, a wide easy grin, head tilting, hair swinging, the carton visible behind her on the counter at real size. Hard cut to.
Cut 8 (4.4-5s) — MEDIUM STATIC: locked-off loop-ready closing frame, the green bowl and the single carton side by side on the counter, front label toward camera; her right hand slides the carton a few centimeters toward the lens with fingertips on the lid, left hand flat on the counter, her face in the upper frame with lips together and a calm satisfied look, then her hand lifts away and the frame holds on the bowl and box.

Static Description: The same home kitchen — light wood counter, white tile backsplash, window to camera-left with even neutral daylight, the paper bag pushed to the back of the counter, one plain white ceramic bowl and one plain metal spoon. Exactly one spirulina carton, one tray, and at most one loose portion exist in the scene; the only box-shaped object in frame is the product.

Audio: She speaks to camera with a clear, bright, articulate American voice, iPhone microphone audio with natural room tone: "—one pops right out, into the bowl, deep GREEN. Freezer aisle, Wegmans."

Facial features clear and undistorted, consistent clothing throughout. Shot on iPhone, natural lighting, social media aesthetic, handheld micro-shake during selfie cuts, locked-off frozen frame during static-camera cuts. No on-screen text, no subtitles, no captions, no watermarks, no legible text on any object except the product's own label, no store logo, no real brand logos anywhere, no phone visible in any frame, no cinematic grade, no film grain, no bokeh, no lens flare, no fisheye lens, no ultra-wide distortion, no slow motion, no beauty filter, no third arm, no extra hands, no duplicated limbs, no deformed hands, exactly one product in every frame.
```

### 3.6 חיבור וייצוא

שני הקליפים (15s + 5s) מתחברים ב-hard cut (ffmpeg concat, stream copy) ל-`final.mp4` של 20 שניות.
בדיקת QA לפני החיבור: קופסה אחת בלבד בכל פריים, שתי ידיים לכל היותר, המכסה במצב אחד לכל פריים, התווית לא ג'יבריש ולא מותג אחר, אין טקסט צרוב.

---

## 4. חבילת פוסט (לא נצרב לווידאו)

**Caption:** Found this in the Wegmans freezer aisle and nobody told me it existed. What would you drop it into? 🟢 #ad

**Hashtags:** #spirulina #wegmansfinds #freezeraisle #smoothiebowl #ad

**Pinned comment:** Freezer aisle, near the frozen fruit. It's a small box with a tray of frozen portions inside, one portion per use.

**Disclosure:** Paid partnership / brand content — sponsored by the brand. (חובה על פי FTC לתוכן ממומן.)

**Loop note:** קאט 8 של קליפ 2 מסתיים על הקערה והקופסה בלי דיבור, כך שהחזרה לקאט 1 של קליפ 1 (שקית באמצע תנועה) מרגישה כמו לופ.

---

## 5. וריאציות מהירות לבדיקת A/B (אותם לוחות, רק שורת ה-Audio משתנה)

- **Hook B (Mid-Sentence Confession):** "—the frozen aisle at Wegmans, bottom shelf, I almost walked past it. Fresh spirulina. Frozen, not powder. And inside, a tray of little frozen portions."
- **Hook C (Freeze-Reaction, H4):** קאט 1 נפתח על הפנים שלה כבר בתגובה, מבט נעול על הקופסה, 0.6 שניות שקט, ואז: "Fresh spirulina. In the freezer. At Wegmans. And inside, a tray of little frozen portions."

---

## 6. גרסה 2 — שייק ירוק בבלנדר (20 שניות, 15 + 5)

היא מכינה בבלנדר שייק ירוק עם חתיכות בננה קפואה, שתי קוביות ספירולינה מלבניות (כמו במגשית), עלי תרד ותמר מגולען, ושותה בסוף.

**תסריט (41 מילים):**

- Board 1 (15s): "Guess what came home from Wegmans with me— fresh spirulina, frozen. Straight from the freezer aisle. Frozen banana, two of these little green blocks, a handful of spinach, one pitted date."
- Board 2 (5s): "—blend it, and look at that GREEN. Freezer aisle, Wegmans." (הלגימה בסוף בלי דיבור.)

**בריף להדבקה ב-Higgsfield:**

```
Make a 20-second UGC-style talking-head video (9:16) using the ugc-review-video workflow — two boards, 15s + 5s.

Creator: use my attached avatar image as the creator reference (I am authorized to use it). She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that. NATURAL register, English, American accent. No music.

Product: attached — a frozen-food carton of fresh frozen spirulina (front of box, second angle of box, the inner tray, and the finished green smoothie). The spirulina portions are small rectangular deep-green frozen blocks exactly as in the tray photo — keep that rectangular block shape, never round cubes or powder. Angle-lock the product to these references only. Render the carton at real palm size, never enlarged; exactly one carton in every frame; exactly two spirulina blocks leave the tray in the whole video.

Props: a plain unbranded countertop blender with a clear jar (no logo, no display text), a small bowl of frozen banana chunks, a handful of fresh spinach leaves, one pitted date, one plain clear glass. No legible text on anything except the product's own label. No Wegmans logo or any real brand logo on screen — the store name is spoken only.

Scenario (director mode, use exactly these beats, shot as an authentic selfie video with hard cuts between selfie and propped-phone static shots, in a daylight home kitchen):
Board 1 (15s) — she is caught mid-motion setting the spirulina carton down next to the blender, shows the front of the box, opens the lid and shows the tray of rectangular green blocks, then builds the smoothie in the blender jar one ingredient per cut: frozen banana chunks in, TWO rectangular spirulina blocks in (both hands: one holds the tray, the other pushes the blocks out), a handful of spinach in, one pitted date in, and she snaps the blender lid on.
Board 2 (5s) — she presses the blender button, the jar swirls to deep green, she pours into the glass, and the closing beat is her taking a real sip and lowering the glass with a small satisfied grin — no voice during the sip.

Script (use verbatim, first word lands within 0.4s of frame one):
Board 1 (15s): "Guess what came home from Wegmans with me— fresh spirulina, frozen. Straight from the freezer aisle. Frozen banana, two of these little green blocks, a handful of spinach, one pitted date."
Board 2 (5s): "—blend it, and look at that GREEN. Freezer aisle, Wegmans."

approved_claims: [] (no health, taste, nutrition, or comparative claims — observable mechanics and colors only; the sip is shown, never described)
Real iPhone look: deep focus, natural window light, pore-level skin, no beauty filter, no cinematic grade, no slow motion, no on-screen text.
Text on video: none. Post package: yes, with #ad disclosure.
```

**חלוקת הסלוטים המומלצת (אם בונים את הלוחות ידנית):**

Board 1: 1 selfie MCU, carton mid-set-down beside the blender · 2 selfie tight, box front to lens · 3 static macro, lid opening, tray of rectangular blocks · 4 static wide, banana chunks into the jar · 5 static macro, two blocks pushed out of the tray into the jar (left hand tray, right thumb) · 6 static medium-close, spinach in · 7 selfie medium, date held up then dropped in · 8 static medium-close, both hands snapping the lid on.

Board 2 (5s, ~0.6s per cut): 1 static macro, finger already pressing the button · 2 static macro, jar swirling to green · 3 selfie MCU, eyebrows up at the jar · 4 static medium-close, pouring into the glass · 5 static macro, green surface settling · 6 selfie MCU, glass raised to lips · 7 selfie tight, real sip, lips on the glass, no voice · 8 static medium, glass lowered beside the carton, small satisfied grin, loop-ready.

**הערה:** "healthy" לא נאמר בקול. בלי `approved_claims` ה-workflow חוסם טענות בריאות. אם יש ניסוח מאושר, הכניסו אותו מילה במילה.

---

## 7. נעילת מוצר מדויקת — SimpliiGood Spirulina (גובר על כל מה שלמעלה)

**מה המוצר באמת:** שקית עמידה צהובה (lemon-yellow → לבן בתחתית), מאט, זיפ עליון, ~18×12 ס"מ. בפנים בליסטר שקוף, 2 שורות × 5 תאים, קובייה בכל תא. **הקובייה:** בלוק מלבני 3.2×2.5×1.9 ס"מ, פינות מעוגלות, גג מעט קמור וצר מהבסיס, ירוק-כחול כהה כמעט שחור, אטום, מרקם גרגירי עדין עם כפור לבן.

**רפרנסים להעלאה (חתוכים ונפרדים, לא דף המפרט):** 1. תקריב קובייה בלבד (ראשון ברשימה), 2. חזית השקית, 3. זווית 3/4, 4. inside view עם הבליסטר.

**PRODUCT LOCK (להעתקה מילה במילה לכל לוח וקליפ):**

> a stand-up resealable pouch, bright lemon-yellow fading to white at the bottom, matte finish, zip seal along the top, roughly 18 cm tall and 12 cm wide, fits in one hand; front panel carries the SimpliiGood SPIRULINA wordmark in dark green and a flat illustrated smoothie-glass graphic exactly as in the reference, keep the label text exactly as printed, never gibberish, never a different brand. Inside the pouch sits ONE clear plastic blister tray with ten individual cells in two rows of five, one cube per cell. THE CUBE: a small rectangular block with softly rounded edges and a slightly tapered, gently domed top — the top face is a little smaller than the base — 3.2 cm long, 2.5 cm wide, 1.9 cm tall, sits on a fingertip pad; very dark blue-green, almost black-green, fully opaque, with a matte, finely granular surface and fine white frost crystals in the surface texture. Never a translucent ice cube, never neon or bright green, never round, never a sphere, never a powder, never a smooth glossy gel block. The cube shape and color must match the close-up reference exactly in every frame it appears. Exactly one pouch in every frame; exactly two cubes leave the tray in the whole video; exactly one tray.

**approved_claims (מודפסות על האריזה, מילה במילה):**
`["Smoothie booster, ready to blend!", "Good source of iron", "Complete plant protein", "Blend 2 cubes into your favorite smoothie", "Non-GMO Project Verified", "Gluten Free", "Vegan", "Kosher"]`

**תסריט מעודכן:**
- Board 1 (15s): "Guess what came home from WEGMANS with me— SimpliiGood frozen spirulina cubes. Straight from the freezer aisle. Frozen banana, two of these cubes, a handful of spinach, one pitted date."
- Board 2 (5s): "—blend it, and look at that GREEN. Freezer aisle, WEGMANS."

**נעילת השם Wegmans:** השם נאמר בבירור בשני הלוחות, מודגש באותיות גדולות בשורת התסריט (עד שתי מילים מודגשות בשורה), עם הנחיית הגייה WEG-munz מחוץ למרכאות. כתיב פונטי בתוך הציטוט אסור כי הוא שובר סנכרון שפתיים.

**בריף להדבקה ב-Higgsfield (גרסת בלנדר, 20 שניות, מוצר מדויק):**

```
Make a 20-second UGC-style talking-head video (9:16) using the ugc-review-video workflow — two boards, 15s + 5s.

Creator: use my attached avatar image as the creator reference (I am authorized to use it). She is a sweet, warm, relatable creator with a clear, bright, articulate American voice and an easy-going attitude — speaks and moves exactly like that. NATURAL register, English, American accent. No music.

Product (I own this brand — SimpliiGood Spirulina, distributed by AlgaeCore). Attached references: (1) single cube close-up, (2) pouch front view, (3) pouch 3/4 view, (4) inside view with the blister tray. Angle-lock the product to these references only. PRODUCT LOCK — reuse verbatim in every board and clip: [PRODUCT LOCK text above]

Props: a plain unbranded countertop blender with a clear jar (no logo, no display text), a small bowl of frozen banana chunks, a handful of fresh spinach leaves, one pitted date, one plain clear glass. No legible text on anything except the product's own printed label. No Wegmans logo or any real brand logo other than my own product on screen — the store name is spoken only.

Scenario (director mode, use exactly these beats, shot as an authentic selfie video with hard cuts between selfie and propped-phone static shots, in a daylight home kitchen):
Board 1 (15s) — she is caught mid-motion setting the yellow pouch down next to the blender, shows the front of the pouch to camera at real size, pulls the zip open and slides the clear tray partly out so the dark green cubes are visible in their cells, then builds the smoothie in the blender jar one ingredient per cut: frozen banana chunks in, TWO cubes pushed out of the tray into the jar (static camera, both hands: one holds the tray, the other thumb pops the cubes), a handful of spinach in, one pitted date in, and she snaps the blender lid on.
Board 2 (5s) — she presses the blender button, the jar swirls to deep green, she pours into the glass, and the closing beat is her taking a real sip and lowering the glass with a small satisfied grin beside the pouch — no voice during the sip.

Script (use verbatim, first word lands within 0.4s of frame one):
Board 1 (15s): "Guess what came home from WEGMANS with me— SimpliiGood frozen spirulina cubes. Straight from the freezer aisle. Frozen banana, two of these cubes, a handful of spinach, one pitted date."
Board 2 (5s): "—blend it, and look at that GREEN. Freezer aisle, WEGMANS."

Store name lock: the word "Wegmans" is spoken clearly and audibly in BOTH boards exactly as written, pronounced WEG-munz (first syllable stressed, rhymes with "leg"), with a slight emphasis and a clear mouth shape on it. Never drop it, never mumble it, never replace it with "the store", "the supermarket", "the grocery store", or any other store name. Keep the spoken name only — no Wegmans logo, sign, or bag branding on screen.

approved_claims (exact strings printed on my packaging, use only these, verbatim, if any claim is spoken): ["Smoothie booster, ready to blend!", "Good source of iron", "Complete plant protein", "Blend 2 cubes into your favorite smoothie", "Non-GMO Project Verified", "Gluten Free", "Vegan", "Kosher"]
Real iPhone look: deep focus, natural window light, pore-level skin, no beauty filter, no cinematic grade, no slow motion, no on-screen text.
Text on video: none. Post package: yes, with #ad disclosure.
```

**QA לקובייה:** אם בפריים כלשהו הקובייה שקופה, בהירה או עגולה, להריץ מחדש רק את הקליפ הזה עם התוספת "the cube is a dark opaque frosted block exactly like reference image 1".
