import { describe, expect, it } from "vitest";
import { calculateScore, type ScoringQuestion } from "./scoring";

/** בונה שאלה רגילה שהתשובה הנכונה שלה היא `${id}-correct`. */
function question(id: string, points: number, isBonus = false): ScoringQuestion {
  return { id, points, isBonus, correctChoiceId: `${id}-correct` };
}

/** מבנה המבחן האמיתי: 20 שאלות של 3 נק', 10 של 4 נק', ובונוס אחד. */
function buildExam(): ScoringQuestion[] {
  const questions: ScoringQuestion[] = [];
  for (let i = 1; i <= 20; i += 1) questions.push(question(`q${i}`, 3));
  for (let i = 21; i <= 30; i += 1) questions.push(question(`q${i}`, 4));
  questions.push(question("q31", 5, true));
  return questions;
}

const allCorrect = (questions: ScoringQuestion[]) =>
  questions.map((q) => ({ questionId: q.id, choiceId: q.correctChoiceId }));

describe("calculateScore — מבנה המבחן", () => {
  it("30 השאלות הרגילות מסתכמות ל-100 נקודות", () => {
    const questions = buildExam();
    const result = calculateScore(questions, []);
    expect(result.maxScore).toBe(100);
    expect(result.totalQuestions).toBe(31);
  });

  it("שאלת הבונוס אינה מנפחת את המכנה", () => {
    const withBonus = calculateScore(buildExam(), []);
    const withoutBonus = calculateScore(
      buildExam().filter((q) => !q.isBonus),
      [],
    );
    expect(withBonus.maxScore).toBe(withoutBonus.maxScore);
  });
});

describe("calculateScore — טבלת ניקוד נעולה", () => {
  it("הגשה ריקה מניבה אפס", () => {
    const result = calculateScore(buildExam(), []);
    expect(result).toMatchObject({
      score: 0,
      maxScore: 100,
      percentage: 0,
      basePoints: 0,
      bonusPoints: 0,
      correctCount: 0,
      answeredCount: 0,
    });
  });

  it("כל השאלות הרגילות נכונות, בונוס לא נענה — 100 נקודות בדיוק", () => {
    const questions = buildExam();
    const answers = allCorrect(questions.filter((q) => !q.isBonus));
    const result = calculateScore(questions, answers);
    expect(result.score).toBe(100);
    expect(result.basePoints).toBe(100);
    expect(result.bonusPoints).toBe(0);
    expect(result.percentage).toBe(100);
    expect(result.correctCount).toBe(30);
    expect(result.answeredCount).toBe(30);
  });

  it("הכל נכון כולל בונוס — האחוז עולה על 100", () => {
    const questions = buildExam();
    const result = calculateScore(questions, allCorrect(questions));
    expect(result.score).toBe(105);
    expect(result.maxScore).toBe(100);
    expect(result.bonusPoints).toBe(5);
    expect(result.percentage).toBe(105);
    expect(result.correctCount).toBe(31);
  });

  it("בונוס בלבד — מזכה בנקודות בלי להשפיע על המכנה", () => {
    const questions = buildExam();
    const result = calculateScore(questions, [
      { questionId: "q31", choiceId: "q31-correct" },
    ]);
    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(100);
    expect(result.percentage).toBe(5);
    expect(result.basePoints).toBe(0);
  });

  it("מחשב אחוז לא שלם עם עיגול לשתי ספרות", () => {
    // שאלה אחת של 3 נקודות מתוך 100 → 3%; שתיים → 6%
    const questions = buildExam();
    const result = calculateScore(questions, [
      { questionId: "q1", choiceId: "q1-correct" },
      { questionId: "q2", choiceId: "q2-correct" },
    ]);
    expect(result.score).toBe(6);
    expect(result.percentage).toBe(6);
  });

  it("מעגל אחוז מחזורי לשתי ספרות", () => {
    const questions = [question("a", 1), question("b", 1), question("c", 1)];
    const result = calculateScore(questions, [
      { questionId: "a", choiceId: "a-correct" },
    ]);
    expect(result.maxScore).toBe(3);
    expect(result.percentage).toBe(33.33);
  });
});

describe("calculateScore — תשובות שגויות וקצה", () => {
  it("תשובה שגויה אינה מזכה בנקודות אך נספרת כנענתה", () => {
    const questions = buildExam();
    const result = calculateScore(questions, [
      { questionId: "q1", choiceId: "q1-wrong" },
    ]);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.answeredCount).toBe(1);
  });

  it("choiceId ריק נחשב כשאלה שלא נענתה", () => {
    const result = calculateScore(buildExam(), [
      { questionId: "q1", choiceId: null },
    ]);
    expect(result.answeredCount).toBe(0);
    expect(result.score).toBe(0);
  });

  it("תשובה כפולה לאותה שאלה — האחרונה קובעת", () => {
    const questions = buildExam();
    const result = calculateScore(questions, [
      { questionId: "q1", choiceId: "q1-correct" },
      { questionId: "q1", choiceId: "q1-wrong" },
    ]);
    expect(result.score).toBe(0);
    expect(result.answeredCount).toBe(1);
  });

  it("תשובה לשאלה שאינה במבחן נעלמת מהחישוב", () => {
    const result = calculateScore(buildExam(), [
      { questionId: "לא-קיים", choiceId: "כלשהו" },
    ]);
    expect(result.score).toBe(0);
    expect(result.answeredCount).toBe(0);
  });

  it("שאלה ללא תשובה נכונה מוגדרת אינה מזכה איש בנקודות", () => {
    const questions: ScoringQuestion[] = [
      { id: "q1", points: 10, isBonus: false, correctChoiceId: null },
    ];
    const result = calculateScore(questions, [
      { questionId: "q1", choiceId: "כל-אפשרות" },
    ]);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(10);
    expect(result.answeredCount).toBe(1);
  });

  it("מבחן ללא שאלות רגילות אינו מחלק באפס", () => {
    const result = calculateScore([question("b1", 5, true)], [
      { questionId: "b1", choiceId: "b1-correct" },
    ]);
    expect(result.maxScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.score).toBe(5);
  });

  it("אינו משנה את מערכי הקלט", () => {
    const questions = buildExam();
    const answers = allCorrect(questions);
    const questionsCopy = structuredClone(questions);
    const answersCopy = structuredClone(answers);
    calculateScore(questions, answers);
    expect(questions).toEqual(questionsCopy);
    expect(answers).toEqual(answersCopy);
  });
});
