import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction, setExamPublished } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "דשבורד מרצה" };

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Jerusalem",
});

export default async function AdminDashboardPage() {
  const session = await auth();

  const exams = await prisma.exam.findMany({
    orderBy: { examDate: "desc" },
    include: {
      _count: { select: { questions: true, submissions: true } },
    },
  });

  return (
    <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">דשבורד מרצה</h1>
          {session?.user?.name && (
            <p className="mt-1 text-sm text-slate-600">
              מחובר כ־{session.user.name}
            </p>
          )}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            התנתקות
          </button>
        </form>
      </div>

      {exams.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
          אין מבחנים במערכת.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {exam.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    {exam.term} · מחזור{" "}
                    <span className="numeric">{exam.cycle}</span> ·{" "}
                    {dateFormatter.format(exam.examDate)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="numeric">{exam._count.questions}</span>{" "}
                    שאלות ·{" "}
                    <span className="numeric">{exam._count.submissions}</span>{" "}
                    הגשות
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    exam.isPublished
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {exam.isPublished ? "פתוח" : "סגור"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className="inline-block rounded-lg bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-900 focus-visible:ring-offset-2"
                >
                  צפייה בתוצאות
                </Link>
                <form
                  action={setExamPublished.bind(null, exam.id, !exam.isPublished)}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                  >
                    {exam.isPublished ? "סגור מבחן" : "פתח מבחן"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
