import { redirect } from "next/navigation";

import { SubmitAgentForm } from "./submit-agent-form";

import { getCurrentUser } from "@/lib/auth";

export default async function SubmitAgentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Submit New Agent</h1>
      <p className="mt-2 text-slate-600">Publish your AI agent so others can discover and integrate it.</p>

      <div className="mt-6">
        <SubmitAgentForm />
      </div>
    </main>
  );
}
