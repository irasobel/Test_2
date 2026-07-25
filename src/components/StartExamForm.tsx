"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/exam/[slug]/actions";

interface StartExamFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-900 focus-visible:ring-offset-2"
    >
      {pending ? "פותח את המבחן…" : "התחלת המבחן"}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function StartExamForm({ action }: StartExamFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <Field
        id="nationalId"
        label="תעודת זהות"
        inputMode="numeric"
        autoComplete="off"
        required
        error={state.fieldErrors?.nationalId}
      />
      <Field
        id="firstName"
        label="שם פרטי"
        autoComplete="given-name"
        required
        error={state.fieldErrors?.firstName}
      />
      <Field
        id="lastName"
        label="שם משפחה"
        autoComplete="family-name"
        required
        error={state.fieldErrors?.lastName}
      />
      <Field
        id="email"
        label="דוא״ל (לא חובה)"
        type="email"
        autoComplete="email"
        dir="ltr"
        error={state.fieldErrors?.email}
      />

      <SubmitButton />
    </form>
  );
}
