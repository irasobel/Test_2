"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-900 focus-visible:ring-offset-2"
    >
      {pending ? "מתחבר…" : "התחברות"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-800">
          דוא״ל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" role="alert" className="text-sm text-red-700">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-800">
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        />
        {state.fieldErrors?.password && (
          <p id="password-error" role="alert" className="text-sm text-red-700">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
