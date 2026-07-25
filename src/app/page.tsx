import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Jerusalem",
});

export default async function HomePage() {
  const exams = await prisma.exam.findMany({
    where: { isPublished: true },
    orderBy: { examDate: "asc" },
  });

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">מערכת מבחנים מקוונת</h1>
      <p className="mt-2 text-slate-700">
        בחרו את המבחן שאליו נרשמתם כדי להתחיל.
      </p>

      {exams.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
          אין כרגע מבחנים פתוחים.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {exam.title}
              </h2>
              <p className="mt-1 text-slate-700">
                {exam.term} · מחזור <span className="numeric">{exam.cycle}</span>{" "}
                · {dateFormatter.format(exam.examDate)} ·{" "}
                <span className="numeric">{exam.durationMin}</span> דקות
              </p>
              <Link
                href={`/exam/${exam.slug}`}
                className="mt-4 inline-block rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white hover:bg-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-900 focus-visible:ring-offset-2"
              >
                מעבר למבחן
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-slate-600">
        <Link href="/admin" className="underline hover:text-slate-900">
          כניסת מרצים
        </Link>
      </p>
    </main>
  );
}
