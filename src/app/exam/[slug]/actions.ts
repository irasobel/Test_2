"use server";

import { redirect } from "next/navigation";
import {
  ExamError,
  finalizeSubmission,
  startSubmission,
} from "@/lib/exam-service";
import { startExamSchema, submitExamSchema } from "@/lib/validation";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function startExamAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = startExamSchema.safeParse({
    nationalId: String(formData.get("nationalId") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  let submissionId: string;
  try {
    const { submission } = await startSubmission(slug, parsed.data);
    submissionId = submission.id;
  } catch (error) {
    if (error instanceof ExamError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/exam/${slug}/${submissionId}`);
}

export async function submitExamAction(slug: string, formData: FormData) {
  const parsed = submitExamSchema.safeParse({
    submissionId: String(formData.get("submissionId") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("בקשת הגשה לא תקינה");
  }

  try {
    await finalizeSubmission(parsed.data.submissionId);
  } catch (error) {
    // הגשה שכבר נסגרה או שפג תוקפה — הנבחן מנותב לדף התוצאה ממילא.
    if (!(error instanceof ExamError)) {
      throw error;
    }
  }

  redirect(`/exam/${slug}/${parsed.data.submissionId}/result`);
}
