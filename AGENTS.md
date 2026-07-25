<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# מוסכמות הפרויקט

## לפני שנוגעים בקוד

```bash
npm run typecheck && npm run lint && npm test
```

שינוי שנוגע ב-UI דורש גם `npm run test:e2e` מול שרת פעיל.

## Next 16 — מה שונה כאן

- **אין `middleware.ts`.** הקובץ הוא `src/proxy.ts` והוא חייב לייצא פונקציה
  בשם `proxy` או ייצוא ברירת מחדל. הוא רץ ב-Edge, ולכן אסור לו לגעת ב-Prisma
  או ב-bcrypt — לשם כך קיימת ההפרדה בין `src/auth.config.ts` (edge-safe)
  לבין `src/auth.ts` (Node).
- **`params` הוא Promise** בכל עמוד ו-route handler; יש לעשות לו `await`.
- כלל ה-lint `react-hooks/purity` אוסר קריאה ל-`Date.now()` בתוך קומפוננטה,
  כולל Server Component. קריאות שעון מרוכזות ב-`src/lib/exam-service.ts`
  (`isPastDeadline`, `remainingMs`). אין לעקוף את הכלל — יש להוסיף שם עוזר.
- כלל `react-hooks/refs` אוסר קריאה או כתיבה ל-`ref.current` בזמן רינדור.

## כללי ברזל

1. **הלקוח עוין.** ציון מחושב אך ורק בשרת. אין לקבל ציון, `deadlineAt` או
   `maxScore` מגוף בקשה. אם נוספת נקודת קצה שנוגעת בהגשה — היא חייבת לאמת
   סטטוס ומועד סיום כמו `saveAnswer`.
2. **שאלת בונוס אינה נכנסת למכנה.** `maxScore` מורכב משאלות רגילות בלבד.
   שינוי בכלל הזה מחייב עדכון מפורש של הבדיקות שנועלות את טבלת הניקוד
   ב-`src/lib/scoring.test.ts`.
3. **`src/lib/scoring.ts` נשאר טהור.** ללא Prisma, ללא `Date`, ללא I/O.
4. **ה-seed שומר על 100 נקודות.** יש בו בדיקה שנכשלת אם סכום השאלות הרגילות
   אינו 100, וכן בדיקה שסיבוב האפשרויות לא שיבש את התשובה הנכונה.

## RTL ועברית

- כל טקסט בממשק בעברית. אין להשאיר מחרוזות באנגלית בממשק המשתמש.
- מספר שמופיע בתוך טקסט עברי — טיימר, ציון, תעודת זהות, מספר שאלה — נעטף
  ב-`<span className="numeric">` כדי שלא יישבר בדו-כיווניות.
- שדות שתוכנם לטיני (דוא״ל, סיסמה) מקבלים `dir="ltr"`.
- אין להשתמש ב-`text-left`/`text-right` או ב-`ml-*`/`mr-*` כדי לקבוע כיוון;
  יש להעדיף את המקבילות הלוגיות של Tailwind (`text-start`, `ms-*`, `me-*`).

## נגישות

הרף הוא **אפס הפרות axe-core** ברמות wcag2a/aa ו-wcag21a/aa. עמוד חדש מחייב
בדיקה חדשה ב-`e2e/accessibility.spec.ts`.

- קבוצת תשובות = `fieldset` + `legend`.
- הודעת שגיאה = `role="alert"` המקושרת בשדה דרך `aria-describedby`, יחד עם
  `aria-invalid`.
- אזורי `aria-live` לא מוכרזים בכל שנייה — ראו את הטיימר.

שימו לב: ל-Next יש `#__next-route-announcer__` עם `role="alert"`. בבדיקות יש
לכוון ל-`p[role="alert"]` ולא ל-`getByRole("alert")`, אחרת נשברת מגבלת ה-strict
mode של Playwright.

## בדיקות

- בדיקות יחידה — לוגיקה טהורה בלבד (`scoring`, `csv`, `validation`).
- בדיקות e2e — חולקות בסיס נתונים אחד ותלויות בסדר, ולכן `workers: 1`.
  `e2e/global-setup.ts` מריץ `seed` מחדש לפני כל ריצה כדי שהחבילה תהיה
  ניתנת להרצה חוזרת.
- תעודות זהות בבדיקות חייבות ספרת ביקורת תקינה, אחרת הוולידציה תדחה אותן.
