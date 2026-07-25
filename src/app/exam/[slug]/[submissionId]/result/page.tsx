import Link from "next/link";
import { notFound } from "next/navigation";
import { finalizeSubmission } from "@/lib/exam-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "תוצאת המבחן" };

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ slug: string; submissionId: string }>;
}) {
  const { slug, submissionId } = await params;

  let submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { exam: true, student: true },
  });

  if (!submission || submission.exam.slug !== slug) {
    notFound();
  }

  // נבחן שהגיע לכאן אחרי שהזמן אזל בלי ללחוץ "הגשה" — סוגרים ומנקדים כאן.
  if (
    submission.status === "IN_PROGRESS" &&
    submission.deadlineAt.getTime() <= Date.now()
  ) {
    await finalizeSubmission(submissionId, { expired: true });
    submission = await prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { exam: true, student: true },
    });
  }

  if (submission.status === "IN_PROGRESS") {
    // עדיין באמצע — מחזירים לטופס.
    return (
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-bold">המבחן עדיין פתוח</h1>
        <Link
          href={`/exam/${slug}/${submissionId}`}
          className="mt-4 inline-block rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white hover:bg-sky-800"
        >
          חזרה למבחן
        </Link>
      </main>
    );
  }

  const score = submission.score ?? 0;
  const maxScore = submission.maxScore ?? 0;
  const percentage = submission.percentage ?? 0;
  const bonus = submission.bonusPoints ?? 0;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">תוצאת המבחן</h1>
      <p className="mt-2 text-slate-700">{submission.exam.title}</p>

      {submission.status === "EXPIRED" && (
        <p
          role="status"
          className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900"
        >
          המבחן נסגר עם תום הזמן שהוקצב. נוקדו התשובות שנשמרו עד אותו רגע.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          {submission.student.firstName} {submission.student.lastName}
        </p>
        <p className="mt-4 text-5xl font-bold text-slate-900">
          <span className="numeric">{percentage}</span>
          <span className="text-2xl">%</span>
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-600">ניקוד</dt>
            <dd className="numeric text-lg font-semibold">
              {score} / {maxScore}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">נקודות בונוס</dt>
            <dd className="numeric text-lg font-semibold">{bonus}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-600">מועד ההגשה</dt>
            <dd className="font-semibold">
              {submission.submittedAt
                ? timeFormatter.format(submission.submittedAt)
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-8 text-sm text-slate-600">
        <Link href="/" className="underline hover:text-slate-900">
          חזרה לדף הראשי
        </Link>
      </p>
    </main>
  );
}
