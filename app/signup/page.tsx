import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <SignupForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-medium text-cyan-700">Login</Link>
      </p>
    </main>
  );
}
