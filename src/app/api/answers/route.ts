import { NextResponse } from "next/server";
import { ExamError, saveAnswer } from "@/lib/exam-service";
import { saveAnswerSchema } from "@/lib/validation";

/** נקודת הקצה של השמירה האוטומטית. אינה מקבלת ואינה מחזירה ציון. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const parsed = saveAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתוני התשובה אינם תקינים" }, { status: 400 });
  }

  try {
    await saveAnswer(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ExamError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }
    throw error;
  }
}
