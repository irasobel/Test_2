import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StartExamForm } from "@/components/StartExamForm";
import { startExamAction, type ActionState } from "./actions";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Jerusalem",
});

async function loadExam(slug: string) {
  return prisma.exam.findUnique({
    where: { slug },
    include: { _count: { select: { questions: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await loadExam(slug);
  return { title: exam?.title ?? "מבחן" };
}

export default async function ExamLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = await loadExam(slug);

  if (!exam || !exam.isPublished) {
    notFound();
  }

  // ה-slug נקשר ל-action בשרת, כך שהלקוח אינו יכול להחליף מבחן.
  async function action(prev: ActionState, formData: FormData) {
    "use server";
    return startExamAction(slug, prev, formData);
  }

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1>
      <p className="mt-2 text-slate-700">{exam.courseName}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-slate-600">מועד</dt>
          <dd className="font-semibold">{exam.term}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">מחזור</dt>
          <dd className="numeric font-semibold">{exam.cycle}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">תאריך</dt>
          <dd className="font-semibold">{dateFormatter.format(exam.examDate)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">משך</dt>
          <dd className="font-semibold">
            <span className="numeric">{exam.durationMin}</span> דקות
          </dd>
        </div>
      </dl>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">לפני שמתחילים</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-900">
          <li>
            במבחן <span className="numeric">{exam._count.questions}</span> שאלות
            אמריקאיות, תשובה אחת נכונה לכל שאלה.
          </li>
          <li>
            הטיימר מתחיל ברגע הכניסה ונמדד בשרת — סגירת הדפדפן אינה עוצרת אותו.
          </li>
          <li>התשובות נשמרות אוטומטית לאורך המבחן.</li>
          {exam.singleAttempt && <li>ניתן להגיש את המבחן פעם אחת בלבד.</li>}
        </ul>
      </section>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">פרטי הנבחן</h2>
      <div className="mt-4">
        <StartExamForm action={action} />
      </div>
    </main>
  );
}
