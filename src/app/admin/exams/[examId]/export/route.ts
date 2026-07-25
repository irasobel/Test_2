import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

const statusLabels: Record<string, string> = {
  IN_PROGRESS: "בתהליך",
  SUBMITTED: "הוגש",
  EXPIRED: "פג תוקף",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examId: string }> },
) {
  // ה-proxy כבר חוסם את /admin, אך נקודת קצה שמייצאת ציונים
  // מאמתת גם בעצמה ולא נשענת רק על ההגדרה החיצונית.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  const { examId } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      submissions: {
        orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
        include: { student: true },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "המבחן לא נמצא" }, { status: 404 });
  }

  const csv = buildCsv(
    [
      "תעודת זהות",
      "שם פרטי",
      "שם משפחה",
      "דוא״ל",
      "סטטוס",
      "ניקוד",
      "ניקוד מרבי",
      "אחוז",
      "נקודות בונוס",
      "מועד התחלה",
      "מועד הגשה",
    ],
    exam.submissions.map((submission) => [
      submission.student.nationalId,
      submission.student.firstName,
      submission.student.lastName,
      submission.student.email ?? "",
      statusLabels[submission.status] ?? submission.status,
      submission.score ?? "",
      submission.maxScore ?? "",
      submission.percentage ?? "",
      submission.bonusPoints ?? "",
      timeFormatter.format(submission.startedAt),
      submission.submittedAt ? timeFormatter.format(submission.submittedAt) : "",
    ]),
  );

  // שם הקובץ נמסר גם ב-ASCII וגם ב-UTF-8 עבור דפדפנים ישנים.
  const filename = `${exam.slug}-results.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
