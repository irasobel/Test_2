"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation";

export interface LoginState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // הודעה אחידה — לא מסגירים האם האימייל קיים במערכת.
      return { error: "פרטי ההתחברות שגויים" };
    }
    // signIn מסמן ניתוב מוצלח בזריקת שגיאת redirect; היא חייבת להמשיך למעלה.
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
