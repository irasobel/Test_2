import { z } from "zod";

/**
 * ספרת ביקורת של תעודת זהות ישראלית (אלגוריתם דמוי Luhn).
 * המספר מרופד לתשע ספרות; כל ספרה במקום אי-זוגי מוכפלת בשתיים,
 * תוצאה דו-ספרתית מצטמצמת בסכום ספרותיה, והסכום הכולל חייב להתחלק ב-10.
 */
export function isValidIsraeliId(value: string): boolean {
  const digits = value.trim();
  if (!/^\d{5,9}$/.test(digits)) {
    return false;
  }

  const padded = digits.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let digit = Number(padded[i]) * ((i % 2) + 1);
    if (digit > 9) {
      digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** מנרמל תעודת זהות לתשע ספרות כדי שהמפתח הייחודי יהיה עקבי. */
export function normalizeIsraeliId(value: string): string {
  return value.trim().padStart(9, "0");
}

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "יש להזין כתובת דוא״ל")
    .email("כתובת הדוא״ל אינה תקינה"),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const startExamSchema = z.object({
  nationalId: z
    .string()
    .min(1, "יש להזין מספר תעודת זהות")
    .refine((value) => /^\d+$/.test(value.trim()), "תעודת זהות מכילה ספרות בלבד")
    .refine(isValidIsraeliId, "מספר תעודת הזהות אינו תקין"),
  firstName: z.string().trim().min(2, "יש להזין שם פרטי"),
  lastName: z.string().trim().min(2, "יש להזין שם משפחה"),
  email: z
    .string()
    .trim()
    .email("כתובת הדוא״ל אינה תקינה")
    .optional()
    .or(z.literal("")),
});

export type StartExamInput = z.infer<typeof startExamSchema>;

/** שמירה אוטומטית של תשובה בודדת. choiceId ריק מבטל את הבחירה. */
export const saveAnswerSchema = z.object({
  submissionId: z.string().min(1),
  questionId: z.string().min(1),
  choiceId: z.string().min(1).nullable(),
});

export const submitExamSchema = z.object({
  submissionId: z.string().min(1),
});
