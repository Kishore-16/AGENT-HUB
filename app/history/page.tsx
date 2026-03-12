import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const runs = await prisma.workflowRun.findMany({
    where: { userId: user.id },
    include: {
      pack: { select: { name: true } },
      steps: {
        orderBy: { stepIndex: "asc" },
        include: {
          agent: { select: { name: true } },
          agentVersion: { select: { versionLabel: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Run History</h1>
      <p className="mt-2 text-slate-600">Every personal run, chain, benchmark, and webhook delivery in one place.</p>

      <section className="mt-6 space-y-4">
        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-slate-600">
            No workflow runs yet.
          </div>
        ) : runs.map((run) => (
          <article key={run.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{run.mode}</p>
                <h2 className="text-xl font-semibold text-slate-900">{run.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>Status: <span className="font-medium text-slate-900">{run.status}</span></p>
                <p>Duration: {run.durationMs} ms</p>
                <p>Webhook: {run.webhookStatus}</p>
                {run.pack ? <p>Pack: {run.pack.name}</p> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Input</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{run.input}</pre>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Final Output</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">{run.finalOutput || "(empty output)"}</pre>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-900">Steps</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {run.steps.map((step, index) => (
                  <div key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{index + 1}. {step.agent.name}</p>
                      <span className="text-xs text-slate-500">{step.agentVersion?.versionLabel ?? "Current"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{step.responseTime} ms · {step.status}</p>
                    {step.errorMessage ? <p className="mt-2 text-xs text-rose-700">{step.errorMessage}</p> : null}
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-700">{step.output || "(empty output)"}</pre>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}