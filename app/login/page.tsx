import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <LoginForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        No account? <Link href="/signup" className="font-medium text-cyan-700">Create one</Link>
      </p>
    </main>
  );
}
