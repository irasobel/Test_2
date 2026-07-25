"use client";

import { useEffect, useRef, useState } from "react";

interface ExamTimerProps {
  /** מועד הסיום כפי שנקבע בשרת (ISO). */
  deadlineAt: string;
  /** שעון השרת ברגע הרינדור, לקיזוז הפרש שעונים אצל הנבחן. */
  serverNow: string;
  onExpire: () => void;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** תיאור מילולי לקוראי מסך — "12 דקות ו-30 שניות" קריא יותר מ-"12:30". */
function describeDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) {
    return `${seconds} שניות`;
  }
  return `${minutes} דקות ו-${seconds} שניות`;
}

export function ExamTimer({ deadlineAt, serverNow, onExpire }: ExamTimerProps) {
  // ההפרש בין שעון הדפדפן לשעון השרת נמדד פעם אחת ומקוזז לאורך הספירה.
  const clockOffsetRef = useRef(
    Date.now() - new Date(serverNow).getTime(),
  );
  const deadlineMs = new Date(deadlineAt).getTime();

  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deadlineMs - (Date.now() - clockOffsetRef.current)),
  );

  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = () => {
      const left = Math.max(
        0,
        deadlineMs - (Date.now() - clockOffsetRef.current),
      );
      setRemaining(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  const isUrgent = remaining <= 5 * 60_000;
  const isCritical = remaining <= 60_000;

  return (
    <div
      className={`rounded-lg border px-4 py-2 text-center ${
        isCritical
          ? "border-red-300 bg-red-50 text-red-900"
          : isUrgent
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-slate-300 bg-white text-slate-900"
      }`}
    >
      <div className="text-xs font-medium">הזמן שנותר</div>
      <div className="numeric text-2xl font-bold tabular-nums" aria-hidden="true">
        {formatDuration(remaining)}
      </div>
      {/* מוכרז כל דקה בלבד, כדי לא להציף את קורא המסך בכל שנייה. */}
      <div role="status" aria-live="polite" className="sr-only">
        {remaining % 60_000 < 1000
          ? `נותרו ${describeDuration(remaining)}`
          : ""}
      </div>
    </div>
  );
}
