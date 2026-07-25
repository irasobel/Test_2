-- נעילת החשיפה האוטומטית של Supabase דרך PostgREST / GraphQL.
--
-- Supabase מעניק לתפקידים anon ו-authenticated גישת קריאה לכל טבלה בסכימת
-- public, ומפתח ה-anon ציבורי מעצם טבעו. בלי הנעילה הזו כל אחד יכול לשלוף
-- את choices.isCorrect — כלומר את כל התשובות הנכונות — וגם את
-- admin_users.passwordHash ואת ציוני הנבחנים.
--
-- האפליקציה ניגשת ל-Postgres ישירות דרך Prisma ואינה משתמשת ב-PostgREST,
-- ולכן אין שום צורך בהרשאות האלה.
--
-- התפקידים קיימים רק בפרויקט Supabase, לכן כל שלב מותנה בקיומם ומתעלם
-- בשקט בהרצה מול Postgres מקומי.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
    REVOKE USAGE ON SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
    REVOKE USAGE ON SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;
  END IF;
END $$;

-- הגנה שנייה: RLS ללא מדיניות חוסם כל קריאה דרך PostgREST.
-- בעל הטבלה, שדרכו Prisma מתחבר, אינו מושפע.
ALTER TABLE "admin_users"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exams"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "choices"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submission_answers" ENABLE ROW LEVEL SECURITY;
