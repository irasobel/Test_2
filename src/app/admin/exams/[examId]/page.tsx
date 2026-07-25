import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "תוצאות מבחן" };

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

export default async function AdminExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
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
    notFound();
  }

  const graded = exam.submissions.filter((s) => s.percentage !== null);
  const average =
    graded.length === 0
      ? null
      : Math.round(
          (graded.reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
            graded.length) *
            100,
        ) / 100;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-slate-600 underline">
        חזרה לדשבורד
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1>
          <p className="mt-1 text-slate-700">
            {exam.term} · מחזור <span className="numeric">{exam.cycle}</span>
          </p>
        </div>
        <a
          href={`/admin/exams/${exam.id}/export`}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-900 focus-visible:ring-offset-2"
        >
          ייצוא ל-CSV
        </a>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-600">סה״כ הגשות</dt>
          <dd className="numeric text-2xl font-bold">
            {exam.submissions.length}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">נוקדו</dt>
          <dd className="numeric text-2xl font-bold">{graded.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">ממוצע</dt>
          <dd className="numeric text-2xl font-bold">
            {average === null ? "—" : `${average}%`}
          </dd>
        </div>
      </dl>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse bg-white text-start">
          <caption className="sr-only">
            טבלת הגשות למבחן {exam.title}
          </caption>
          <thead>
            <tr className="border-b border-slate-300 text-sm text-slate-700">
              <th scope="col" className="p-3 font-semibold">
                שם הנבחן
              </th>
              <th scope="col" className="p-3 font-semibold">
                תעודת זהות
              </th>
              <th scope="col" className="p-3 font-semibold">
                סטטוס
              </th>
              <th scope="col" className="p-3 font-semibold">
                ניקוד
              </th>
              <th scope="col" className="p-3 font-semibold">
                אחוז
              </th>
              <th scope="col" className="p-3 font-semibold">
                בונוס
              </th>
              <th scope="col" className="p-3 font-semibold">
                מועד הגשה
              </th>
            </tr>
          </thead>
          <tbody>
            {exam.submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-600">
                  אין עדיין הגשות למבחן זה.
                </td>
              </tr>
            ) : (
              exam.submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="border-b border-slate-200 text-sm"
                >
                  <td className="p-3">
                    {submission.student.firstName} {submission.student.lastName}
                  </td>
                  <td className="numeric p-3">
                    {submission.student.nationalId}
                  </td>
                  <td className="p-3">
                    {statusLabels[submission.status] ?? submission.status}
                  </td>
                  <td className="numeric p-3">
                    {submission.score === null
                      ? "—"
                      : `${submission.score} / ${submission.maxScore ?? 0}`}
                  </td>
                  <td className="numeric p-3">
                    {submission.percentage === null
                      ? "—"
                      : `${submission.percentage}%`}
                  </td>
                  <td className="numeric p-3">{submission.bonusPoints ?? 0}</td>
                  <td className="p-3">
                    {submission.submittedAt
                      ? timeFormatter.format(submission.submittedAt)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
