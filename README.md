# SimpliiGood Creator Club

[![CI](https://github.com/yardenialon/CewatorClub/actions/workflows/ci.yml/badge.svg)](https://github.com/yardenialon/CewatorClub/actions/workflows/ci.yml)

מערכת לניהול קהילת יוצרים ושגרירים של SimpliiGood בישראל ובארה״ב, בעברית ובאנגלית.
גרסה 0.1 היא **אבטיפוס מקומי**: קובץ HTML אחד, ללא שרת, ללא חשבונות, והנתונים נשמרים בדפדפן בלבד.

A bilingual (HE/EN) prototype for running a creator & ambassador programme in Israel (ILS)
and the US (USD). v0.1 is a **local prototype**: one self-contained HTML file, no server,
no accounts, data stays in the browser.

## הפעלה מהירה / Quick start

פתחו את `index.html` בדפדפן. זהו. / Open `index.html` in a browser. That's it.

אם הדפדפן חוסם שמירה מקומית מקובץ, הריצו שרת מקומי:

```bash
npm run serve        # http://127.0.0.1:8765/
```

מסלול הבדיקה המלא (יוצר ← הגשה ← אישור ← פרסום ← תשלום) מתואר ב־[docs/GUIDE_HE.md](docs/GUIDE_HE.md).

## מה יש כאן / What it does

| מנהל התוכנית (Admin) | פורטל יוצרים (Creator portal) |
|---|---|
| סקירה, יוצרים, משימות, תוכן לאישור, תשלומים, הגדרות | הצעות, עבודות, הגשת תוכן, דיווח פרסום |
| אישור מועמדים וסימון אימות נתוני קהל | קבלה או דחייה של הצעה |
| יצירת משימות והצעות עם תחשיב מחיר אוטומטי | הגשה מחדש אחרי משוב |
| ארבע בדיקות Brand Safety לפני אישור | צפייה בתגמול הנעול |
| אימות פרסום ורישום תשלום (ידני) | |
| ייצוא CSV / גיבוי JSON / איפוס | |

הכללים העסקיים המלאים (מכונת מצבים, נוסחת תמחור, מגבלות תקציב) מתועדים ב־[docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

## מבנה הפרויקט / Project layout

```
index.html            ← הקובץ הבנוי. נוצר אוטומטית, לא לערוך ידנית
src/
  core.js             ← חוקים עסקיים ומכונת מצבים (ללא DOM, נבדק ב־Node)
  app.js              ← ממשק, פעולות, localStorage, ייצוא
  styles.css          ← עיצוב RTL/LTR, דסקטופ ומובייל
  i18n.json           ← כל טקסטי הממשק, עברית ואנגלית
  template.html       ← שלד ה־HTML שאליו מוזרקים הקבצים
scripts/
  build.mjs           ← מאחד את src/ לקובץ index.html אחד
  serve.mjs           ← שרת סטטי מקומי (127.0.0.1 בלבד)
test/
  core.test.mjs       ← בדיקות לוגיקה (node:test)
  ui.test.mjs         ← בדיקות דפדפן (Playwright), מסלול ההדגמה מקצה לקצה
docs/
  GUIDE_HE.md         ← מדריך משתמש בעברית
  PRODUCT_SPEC.md     ← מפרט מוצר, כללים, מה חסר לשירות אמיתי
```

## פיתוח / Development

דרישות: Node.js 20 ומעלה. אין תלויות בזמן ריצה.

```bash
npm run build        # src/  ->  index.html
npm test             # בדיקות לוגיקה
npm run test:ui      # בדיקות דפדפן (דורש: npm i -D playwright && npx playwright install chromium)
npm run build:check  # מוודא ש־index.html מעודכן (רץ ב־CI)
```

**זרימת עבודה:** עורכים קבצים ב־`src/`, מריצים `npm run build`, ומקמטים את `index.html` יחד עם השינוי.
ה־CI נכשל אם `index.html` לא תואם ל־`src/`.

### ארכיטקטורה בקצרה

- **`core.js` הוא הלב.** פונקציה אחת, `dispatch(state, command, payload, actor)`, מקבלת מצב ומחזירה מצב חדש (ללא mutation). כל שינוי עובר דרכה, וכל מצב עובר `validateState` לפני שמירה. זה מה שיאפשר להעביר את אותה לוגיקה לשרת בעתיד.
- **`app.js` הוא תצוגה בלבד.** מרנדר HTML מה־state, מאזין לאירועים, וקורא ל־`dispatch`. כל טקסט עובר escaping, כל קישור עובר אימות `https`.
- **`i18n.json`** חייב להכיל את אותם מפתחות בשתי השפות. הבנייה נכשלת אחרת.

## הגבלות חשובות / Important limits

- זו סביבת הדגמה. אין להזין פרטי יוצרים אמיתיים, פרטי בנק או סיסמאות.
- אין שליחת אימיילים, תשלומים, העלאת קבצים או חיבור לרשתות חברתיות.
- ״רישום תשלום״ ו״אימות פרסום״ הם סימונים ידניים.
- המחירים הם דוגמאות עבודה, לא מחירון.

הרשימה המלאה של מה שנדרש לשירות אמיתי נמצאת ב־[docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md#8-not-in-v01-required-for-a-real-service).
