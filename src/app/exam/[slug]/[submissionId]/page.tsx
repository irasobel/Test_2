import { notFound, redirect } from "next/navigation";
import { getExamQuestionsForStudent, isPastDeadline } from "@/lib/exam-service";
import { prisma } from "@/lib/prisma";
import { ExamForm } from "@/components/ExamForm";
import { submitExamAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "מבחן בעריכה" };

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ slug: string; submissionId: string }>;
}) {
  const { slug, submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { exam: true, answers: true },
  });

  if (!submission || submission.exam.slug !== slug) {
    notFound();
  }

  // הגשה סגורה או שפג תוקפה מנותבת לדף התוצאה, לא לטופס.
  if (submission.status !== "IN_PROGRESS") {
    redirect(`/exam/${slug}/${submissionId}/result`);
  }
  if (isPastDeadline(submission.deadlineAt)) {
    redirect(`/exam/${slug}/${submissionId}/result`);
  }

  const questions = await getExamQuestionsForStudent(submission.examId);

  const initialAnswers: Record<string, string> = {};
  for (const answer of submission.answers) {
    if (answer.choiceId) {
      initialAnswers[answer.questionId] = answer.choiceId;
    }
  }

  async function action(formData: FormData) {
    "use server";
    await submitExamAction(slug, formData);
  }

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">
        {submission.exam.title}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {submission.exam.term} · מחזור{" "}
        <span className="numeric">{submission.exam.cycle}</span>
      </p>

      <div className="mt-6">
        <ExamForm
          slug={slug}
          submissionId={submission.id}
          deadlineAt={submission.deadlineAt.toISOString()}
          serverNow={new Date().toISOString()}
          questions={questions}
          initialAnswers={initialAnswers}
          submitAction={action}
        />
      </div>
    </main>
  );
}
