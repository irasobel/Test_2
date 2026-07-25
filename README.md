# מערכת מבחנים מקוונת בעברית (RTL)

אפליקציית ווב בעברית מלאה ב-RTL למבחן אמריקאי מקוון, עם ניקוד אוטומטי בצד השרת
ודשבורד למרצה.

## סטאק

| רכיב | טכנולוגיה |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, `src/proxy.ts` במקום `middleware.ts`) |
| שפה | TypeScript |
| עיצוב | Tailwind v4 |
| בסיס נתונים | PostgreSQL + Prisma 6 |
| אימות | NextAuth v5 (Credentials + JWT), bcryptjs |
| טפסים וולידציה | React Hook Form + Zod 3 |
| בדיקות | Vitest (יחידה), Playwright + axe-core (e2e ונגישות) |

## הפעלה מקומית

```bash
npm install
cp .env.example .env          # ואז למלא DATABASE_URL ו-AUTH_SECRET
npm run db:push               # יצירת הסכימה
npm run db:seed               # מרצה ראשוני + המבחן על 31 שאלותיו
npm run dev
```

`AUTH_SECRET` נוצר עם `openssl rand -base64 32`.

## סקריפטים

| פקודה | תיאור |
| --- | --- |
| `npm run dev` | שרת פיתוח |
| `npm run build` | `prisma generate` ואז build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | בדיקות יחידה (Vitest) |
| `npm run test:e2e` | Playwright — מסלול מלא ונגישות (דורש שרת פעיל) |
| `npm run db:seed` | טעינת נתוני המבחן |

## מודל הנתונים

`AdminUser`, `Exam`, `Question`, `Choice`, `Student`, `Submission`,
`SubmissionAnswer`.

## הניקוד

מנוע הניקוד יושב ב-`src/lib/scoring.ts` והוא **פונקציה טהורה** — ללא גישה לבסיס
הנתונים, ולכן ניתן לנעול אותו בבדיקות.

הכלל המרכזי: **שאלת בונוס אינה מנפחת את המכנה.**

- שאלות 1–30 מסתכמות בדיוק ל-100 נקודות (20 שאלות × 3 נק׳ + 10 שאלות × 4 נק׳).
- שאלה 31 היא בונוס בת 5 נקודות ואינה נספרת ב-`maxScore`.
- נבחן שענה נכון על הכול מקבל `score=105`, `maxScore=100`, כלומר **105%**.

זו התנהגות מכוונת: בונוס שאינו יכול להעלות מעל 100 חסר משמעות. אם נדרשת תקרה של
100% — זהו שינוי של שורה אחת ב-`calculateScore`, ויש לעדכן בהתאם את הבדיקות
שנועלות את טבלת הניקוד.

## אכיפה בצד השרת

הנחת היסוד היא שהלקוח עוין:

- **הטיימר** — `Submission.deadlineAt` נקבע בשרת בעת פתיחת ההגשה. הלקוח מקבל את
  מועד הסיום ואת שעון השרת בלבד, ומקזז את הפרש השעונים לצורך התצוגה. שעון מזויף
  בדפדפן אינו מאריך את המבחן.
- **הציון** — מחושב אך ורק ב-`finalizeSubmission`. הלקוח לעולם אינו שולח ציון,
  ואין נתיב שמקבל ציון מבחוץ.
- **שמירה אוטומטית** — `POST /api/answers` נדחה לאחר מועד הסיום או לאחר שההגשה
  נסגרה (409), ומאמת שהשאלה שייכת למבחן ושהאפשרות שייכת לשאלה.
- **הגשה כפולה** — אילוץ ייחודיות על `(examId, studentId)` יחד עם
  `Exam.singleAttempt`.
- **הגשה שפג תוקפה** — נבחן שלא לחץ "הגשה" עד תום הזמן מנוקד אוטומטית עם הכניסה
  לדף התוצאה, וסטטוס ההגשה נרשם כ-`EXPIRED`.
- **ייצוא CSV** — הנתיב מאמת session בעצמו ואינו נשען רק על ה-proxy.

## אזהרה: Supabase חושף טבלאות כברירת מחדל

Supabase מעניק אוטומטית לתפקידים `anon` ו-`authenticated` גישת קריאה לכל טבלה
בסכימת `public`, ומגיש אותן דרך PostgREST ו-GraphQL. מפתח ה-`anon` ציבורי מעצם
טבעו.

עבור מערכת מבחנים זו חשיפה קריטית: היא מאפשרת לקרוא את `choices.isCorrect` —
כלומר את **כל התשובות הנכונות** — וכן את `admin_users.passwordHash` ואת ציוני
הנבחנים.

האפליקציה ניגשת ל-Postgres ישירות דרך Prisma ואינה משתמשת ב-PostgREST, ולכן
המיגרציה `20260725230000_lock_down_postgrest_exposure` שוללת את ההרשאות האלה
ומפעילה RLS ללא מדיניות. הבעלים, שדרכו Prisma מתחבר, אינו מושפע.

לאחר כל שינוי סכימה יש להריץ שוב את בודק האבטחה של Supabase. תקין שיופיעו
התרעות `INFO` מסוג "RLS enabled, no policy" — זהו המצב הרצוי כאן.

## RTL ונגישות

- `<html lang="he" dir="rtl">`, גופן Heebo.
- מחלקת `.numeric` מבודדת מספרים ל-LTR (`unicode-bidi: isolate`) כדי שטיימר,
  ציונים ותעודות זהות לא יישברו בתוך טקסט עברי.
- כל שאלה עטופה ב-`fieldset`/`legend`, כל תשובה היא `label` מקושר.
- הטיימר מוכרז לקוראי מסך פעם בדקה בלבד, כדי לא להציף.
- קישור "דילוג לתוכן הראשי", מצבי `focus-visible`, וכיבוד
  `prefers-reduced-motion`.
- `npm run test:e2e` מריץ סריקת axe-core (wcag2a/aa, wcag21a/aa) על שישה מסכים.

## ייצוא CSV

`GET /admin/exams/[examId]/export` מחזיר CSV עם **BOM של UTF-8**, שבלעדיו Excel
פותח עברית כג׳יבריש. הציטוט לפי RFC 4180, ושדה הפותח ב-`=`, `+`, `-` או `@`
מקבל גרש מוביל כדי למנוע הזרקת נוסחאות.

## בדיקות

בדיקות היחידה אינן דורשות בסיס נתונים:

```bash
npm test
```

בדיקות ה-e2e דורשות שרת פעיל ובסיס נתונים עם `seed`:

```bash
npm run build && npm run start &
npm run test:e2e
```

בסביבה שבה Chromium כבר מותקן, יש להצביע עליו במקום להוריד גרסה נוספת:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e
```
