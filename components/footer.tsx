export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-slate-900">AgentHub</p>
          <p className="mt-1 text-sm text-slate-500">The marketplace for AI agents.</p>
        </div>

        <p className="text-xs text-slate-400">© {new Date().getFullYear()} AgentHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
