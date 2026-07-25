"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamTimer } from "@/components/ExamTimer";

export interface ExamChoiceView {
  id: string;
  order: number;
  text: string;
}

export interface ExamQuestionView {
  id: string;
  order: number;
  text: string;
  points: number;
  isBonus: boolean;
  choices: ExamChoiceView[];
}

interface ExamFormProps {
  slug: string;
  submissionId: string;
  deadlineAt: string;
  serverNow: string;
  questions: ExamQuestionView[];
  initialAnswers: Record<string, string>;
  submitAction: (formData: FormData) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 600;

export function ExamForm({
  slug,
  submissionId,
  deadlineAt,
  serverNow,
  questions,
  initialAnswers,
  submitAction,
}: ExamFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const timersRef = useRef(new Map<string, number>());
  const formRef = useRef<HTMLFormElement>(null);

  // ניקוי טיימרים תלויים בעת עזיבת העמוד.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers.values()) {
        window.clearTimeout(id);
      }
      timers.clear();
    };
  }, []);

  const persist = useCallback(
    async (questionId: string, choiceId: string) => {
      setSaveState("saving");
      try {
        const response = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, questionId, choiceId }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
            code?: string;
          } | null;

          if (data?.code === "EXPIRED" || data?.code === "ALREADY_SUBMITTED") {
            setIsExpired(true);
            router.replace(`/exam/${slug}/${submissionId}/result`);
            return;
          }

          setSaveState("error");
          setSaveError(data?.error ?? "השמירה נכשלה");
          return;
        }

        setSaveState("saved");
        setSaveError(null);
      } catch {
        setSaveState("error");
        setSaveError("אין חיבור לשרת. התשובה תישמר בניסיון הבא.");
      }
    },
    [router, slug, submissionId],
  );

  const handleSelect = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));

    // debounce לכל שאלה בנפרד, כדי ששינוי מהיר בין אפשרויות
    // לא יפתח בקשה לכל הקלקה.
    const existing = timersRef.current.get(questionId);
    if (existing) {
      window.clearTimeout(existing);
    }
    const id = window.setTimeout(() => {
      timersRef.current.delete(questionId);
      void persist(questionId, choiceId);
    }, AUTOSAVE_DEBOUNCE_MS);
    timersRef.current.set(questionId, id);
  };

  const handleExpire = useCallback(() => {
    setIsExpired(true);
    // הזמן אזל — השרת יסגור וינקד את ההגשה.
    formRef.current?.requestSubmit();
  }, []);

  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
        <div role="status" aria-live="polite" className="text-sm text-slate-700">
          נענו <span className="numeric font-bold">{answeredCount}</span> מתוך{" "}
          <span className="numeric font-bold">{questions.length}</span> שאלות
          {saveState === "saving" && " · שומר…"}
          {saveState === "saved" && " · נשמר"}
        </div>
        <ExamTimer
          deadlineAt={deadlineAt}
          serverNow={serverNow}
          onExpire={handleExpire}
        />
      </div>

      {saveError && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">
          {saveError}
        </p>
      )}

      {isExpired && (
        <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          הזמן הסתיים. המבחן נסגר ומנוקד.
        </p>
      )}

      <ol className="flex flex-col gap-6">
        {questions.map((question) => (
          <li
            key={question.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <fieldset disabled={isExpired}>
              <legend className="mb-3 text-base font-semibold text-slate-900">
                <span className="numeric">{question.order}</span>.{" "}
                {question.text}{" "}
                <span className="text-sm font-normal text-slate-600">
                  ({question.isBonus ? "בונוס, " : ""}
                  <span className="numeric">{question.points}</span> נק׳)
                </span>
              </legend>

              <div className="flex flex-col gap-2">
                {question.choices.map((choice) => {
                  const inputId = `${question.id}-${choice.id}`;
                  return (
                    <label
                      key={choice.id}
                      htmlFor={inputId}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-sky-700 has-checked:border-sky-600 has-checked:bg-sky-50"
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={question.id}
                        value={choice.id}
                        checked={answers[question.id] === choice.id}
                        onChange={() => handleSelect(question.id, choice.id)}
                        className="mt-1 h-4 w-4 accent-sky-700"
                      />
                      <span className="text-slate-800">{choice.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <form ref={formRef} action={submitAction} className="flex justify-start">
        <input type="hidden" name="submissionId" value={submissionId} />
        <button
          type="submit"
          className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-900 focus-visible:ring-offset-2"
        >
          הגשת המבחן
        </button>
      </form>
    </div>
  );
}
