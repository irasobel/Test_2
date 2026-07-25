/**
 * מנוע הניקוד — פונקציות טהורות בלבד, ללא גישה לבסיס הנתונים.
 *
 * כלל היסוד: שאלת בונוס אינה מנפחת את המכנה.
 * המכנה (maxScore) מורכב אך ורק משאלות רגילות, ולכן נבחן שעונה נכון
 * על כל השאלות הרגילות ועל שאלת הבונוס יקבל אחוז גבוה מ-100.
 * זו התנהגות מכוונת — בונוס שאינו יכול להעלות מעל 100 חסר משמעות.
 */

export interface ScoringQuestion {
  id: string;
  points: number;
  isBonus: boolean;
  /** מזהה האפשרות הנכונה. null כשלשאלה לא הוגדרה תשובה נכונה. */
  correctChoiceId: string | null;
}

export interface ScoringAnswer {
  questionId: string;
  /** null מייצג שאלה שלא נענתה. */
  choiceId: string | null;
}

export interface ScoreResult {
  /** ניקוד כולל, כולל נקודות בונוס. */
  score: number;
  /** המכנה — סכום הנקודות של השאלות הרגילות בלבד. */
  maxScore: number;
  /** score / maxScore * 100, מעוגל לשתי ספרות. עשוי לעלות על 100 בזכות בונוס. */
  percentage: number;
  /** נקודות שנצברו משאלות רגילות. */
  basePoints: number;
  /** נקודות שנצברו משאלות בונוס. */
  bonusPoints: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
}

/** עיגול לשתי ספרות אחרי הנקודה, ללא שגיאות צף. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * מחשב את תוצאת ההגשה.
 *
 * התשובות ממופות לפי מזהה שאלה; תשובה כפולה לאותה שאלה — האחרונה קובעת.
 * תשובות המפנות לשאלה שאינה במבחן נעלמות מהחישוב.
 */
export function calculateScore(
  questions: readonly ScoringQuestion[],
  answers: readonly ScoringAnswer[],
): ScoreResult {
  const answerByQuestion = new Map<string, string | null>();
  for (const answer of answers) {
    answerByQuestion.set(answer.questionId, answer.choiceId);
  }

  let basePoints = 0;
  let bonusPoints = 0;
  let maxScore = 0;
  let correctCount = 0;
  let answeredCount = 0;

  for (const question of questions) {
    if (!question.isBonus) {
      maxScore += question.points;
    }

    const chosen = answerByQuestion.get(question.id) ?? null;
    if (chosen !== null) {
      answeredCount += 1;
    }

    // שאלה ללא תשובה נכונה מוגדרת אינה מזכה בנקודות לאיש.
    if (chosen === null || question.correctChoiceId === null) {
      continue;
    }

    if (chosen === question.correctChoiceId) {
      correctCount += 1;
      if (question.isBonus) {
        bonusPoints += question.points;
      } else {
        basePoints += question.points;
      }
    }
  }

  const score = basePoints + bonusPoints;

  return {
    score,
    maxScore,
    percentage: maxScore === 0 ? 0 : round2((score / maxScore) * 100),
    basePoints,
    bonusPoints,
    correctCount,
    answeredCount,
    totalQuestions: questions.length,
  };
}
