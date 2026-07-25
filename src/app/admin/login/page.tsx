import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "כניסת מרצים" };

export default function AdminLoginPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-sm flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">כניסת מרצים</h1>
      <p className="mt-2 text-sm text-slate-600">
        האזור מיועד לסגל הקורס בלבד.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
