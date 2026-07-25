import "server-only";
import { prisma } from "@/lib/prisma";
import { calculateScore, type ScoringQuestion } from "@/lib/scoring";
import { normalizeIsraeliId } from "@/lib/validation";
import type { StartExamInput } from "@/lib/validation";

/**
 * חסד של כמה שניות על הרשת: הגשה שיצאה לדרך רגע לפני הצלצול
 * לא תיפסל בגלל זמן נסיעה. אינו מאריך את הטיימר המוצג לנבחן.
 */
const SUBMIT_GRACE_MS = 5_000;

export class ExamError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "ALREADY_SUBMITTED"
      | "EXPIRED"
      | "NOT_PUBLISHED",
  ) {
    super(message);
    this.name = "ExamError";
  }
}

export async function getPublishedExam(slug: string) {
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam) {
    throw new ExamError("המבחן לא נמצא", "NOT_FOUND");
  }
  if (!exam.isPublished) {
    throw new ExamError("המבחן אינו פתוח כרגע", "NOT_PUBLISHED");
  }
  return exam;
}

/** שאלות המבחן לפי סדר, כולל אפשרויות. ללא סימון התשובה הנכונה. */
export async function getExamQuestionsForStudent(examId: string) {
  const questions = await prisma.question.findMany({
    where: { examId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      text: true,
      points: true,
      isBonus: true,
      choices: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, text: true },
      },
    },
  });
  return questions;
}

/**
 * פותח הגשה חדשה או מחזיר הגשה פתוחה קיימת.
 * deadlineAt נקבע כאן, בשרת, ולעולם אינו מתקבל מהלקוח.
 */
export async function startSubmission(slug: string, input: StartExamInput) {
  const exam = await getPublishedExam(slug);
  const nationalId = normalizeIsraeliId(input.nationalId);

  const student = await prisma.student.upsert({
    where: { nationalId },
    update: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      ...(input.email ? { email: input.email.trim() } : {}),
    },
    create: {
      nationalId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email ? input.email.trim() : null,
    },
  });

  const existing = await prisma.submission.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: student.id } },
  });

  if (existing) {
    if (existing.status !== "IN_PROGRESS") {
      // מניעת הגשה כפולה — נבחן שכבר הגיש אינו מקבל ניסיון נוסף.
      if (exam.singleAttempt) {
        throw new ExamError("כבר הגשת את המבחן הזה", "ALREADY_SUBMITTED");
      }
    } else if (existing.deadlineAt.getTime() <= Date.now()) {
      // הזמן אזל בין הכניסות — סוגרים ומנקדים את מה שנשמר.
      await finalizeSubmission(existing.id, { expired: true });
      throw new ExamError("הזמן שהוקצב למבחן הסתיים", "EXPIRED");
    }
    return { submission: existing, exam, student };
  }

  const submission = await prisma.submission.create({
    data: {
      examId: exam.id,
      studentId: student.id,
      deadlineAt: new Date(Date.now() + exam.durationMin * 60_000),
    },
  });

  return { submission, exam, student };
}

export async function getSubmissionForStudent(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { exam: true, student: true, answers: true },
  });
  if (!submission) {
    throw new ExamError("ההגשה לא נמצאה", "NOT_FOUND");
  }
  return submission;
}

/**
 * שומר תשובה בודדת. נדחה לאחר שהזמן אזל או לאחר שההגשה נסגרה,
 * כדי שלקוח שרץ עם שעון מזויף לא יוכל לערוך תשובות בדיעבד.
 */
export async function saveAnswer(params: {
  submissionId: string;
  questionId: string;
  choiceId: string | null;
}) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    select: { id: true, examId: true, status: true, deadlineAt: true },
  });

  if (!submission) {
    throw new ExamError("ההגשה לא נמצאה", "NOT_FOUND");
  }
  if (submission.status !== "IN_PROGRESS") {
    throw new ExamError("ההגשה כבר נסגרה", "ALREADY_SUBMITTED");
  }
  if (submission.deadlineAt.getTime() + SUBMIT_GRACE_MS <= Date.now()) {
    throw new ExamError("הזמן שהוקצב למבחן הסתיים", "EXPIRED");
  }

  // השאלה חייבת להשתייך למבחן של ההגשה, והאפשרות לשאלה.
  const question = await prisma.question.findFirst({
    where: { id: params.questionId, examId: submission.examId },
    select: { id: true },
  });
  if (!question) {
    throw new ExamError("השאלה אינה שייכת למבחן זה", "NOT_FOUND");
  }

  if (params.choiceId) {
    const choice = await prisma.choice.findFirst({
      where: { id: params.choiceId, questionId: params.questionId },
      select: { id: true },
    });
    if (!choice) {
      throw new ExamError("אפשרות התשובה אינה שייכת לשאלה זו", "NOT_FOUND");
    }
  }

  await prisma.submissionAnswer.upsert({
    where: {
      submissionId_questionId: {
        submissionId: params.submissionId,
        questionId: params.questionId,
      },
    },
    update: { choiceId: params.choiceId },
    create: {
      submissionId: params.submissionId,
      questionId: params.questionId,
      choiceId: params.choiceId,
    },
  });
}

/**
 * מנקד וסוגר את ההגשה. הציון מחושב כאן בלבד —
 * הלקוח אינו שולח ולעולם אינו יכול להשפיע עליו.
 */
export async function finalizeSubmission(
  submissionId: string,
  options: { expired?: boolean } = {},
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { answers: true },
  });

  if (!submission) {
    throw new ExamError("ההגשה לא נמצאה", "NOT_FOUND");
  }
  if (submission.status !== "IN_PROGRESS") {
    throw new ExamError("ההגשה כבר נסגרה", "ALREADY_SUBMITTED");
  }
  if (
    !options.expired &&
    submission.deadlineAt.getTime() + SUBMIT_GRACE_MS <= Date.now()
  ) {
    return finalizeSubmission(submissionId, { expired: true });
  }

  const questions = await prisma.question.findMany({
    where: { examId: submission.examId },
    select: {
      id: true,
      points: true,
      isBonus: true,
      choices: { where: { isCorrect: true }, select: { id: true }, take: 1 },
    },
  });

  const scoringQuestions: ScoringQuestion[] = questions.map((q) => ({
    id: q.id,
    points: q.points,
    isBonus: q.isBonus,
    correctChoiceId: q.choices[0]?.id ?? null,
  }));

  const result = calculateScore(
    scoringQuestions,
    submission.answers.map((a) => ({
      questionId: a.questionId,
      choiceId: a.choiceId,
    })),
  );

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: options.expired ? "EXPIRED" : "SUBMITTED",
      submittedAt: new Date(),
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      bonusPoints: result.bonusPoints,
    },
  });
}

/** מילישניות שנותרו, לפי שעון השרת. אפס כשהזמן אזל. */
export function remainingMs(deadlineAt: Date): number {
  return Math.max(0, deadlineAt.getTime() - Date.now());
}

/**
 * האם חלף מועד הסיום, לפי שעון השרת.
 * קריאת השעון מרוכזת כאן ולא בקומפוננטות, שנדרשות להיות טהורות.
 */
export function isPastDeadline(deadlineAt: Date): boolean {
  return deadlineAt.getTime() <= Date.now();
}
