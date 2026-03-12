import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14">
      <section className="rounded-2xl bg-gradient-to-r from-cyan-700 via-sky-700 to-slate-900 p-8 text-white shadow-lg md:p-12">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">AgentHub</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Discover, test, and integrate AI agents in one marketplace.
        </h1>
        <p className="mt-4 max-w-2xl text-cyan-50">
          Ship faster with reusable AI agents, live playground testing, and API-first integration.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/agents" className="rounded-md bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100">
            Browse Agents
          </Link>
          <Link href="/submit-agent" className="rounded-md border border-white/70 px-4 py-2 font-semibold text-white hover:bg-white/10">
            Publish Your Agent
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Marketplace</h2>
          <p className="mt-2 text-sm text-slate-600">Search by name, category, and tags to find the right agent quickly.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Playground</h2>
          <p className="mt-2 text-sm text-slate-600">Run sample prompts and evaluate output quality before integration.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Developer Tools</h2>
          <p className="mt-2 text-sm text-slate-600">Submit new versions, monitor your published agents, and iterate fast.</p>
        </article>
      </section>
    </main>
  );
}
