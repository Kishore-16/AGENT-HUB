export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#030711]/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10">
            <span className="h-3 w-3 rounded-md border border-emerald-200/60 bg-emerald-300/75" />
          </span>
          <div>
            <p className="font-semibold text-white">AgentHub</p>
            <p className="mt-1 text-sm text-slate-400">A dark registry for testing, comparing, and shipping AI agents.</p>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">© {new Date().getFullYear()} AgentHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
