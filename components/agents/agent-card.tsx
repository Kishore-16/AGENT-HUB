import Link from "next/link";

type AgentCardProps = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  version: string;
  runCount: number;
  remixCount: number;
  failureRate: number;
};

export function AgentCard({
  id,
  name,
  description,
  category,
  tags,
  rating,
  version,
  runCount,
  remixCount,
  failureRate,
}: AgentCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-[26px] border border-white/10 bg-black/25 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.3)] transition hover:-translate-y-1 hover:border-emerald-300/25">
      <div className="flex items-center justify-between">
        <p className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-100">{category}</p>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{version}</span>
          <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={`text-sm ${star <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}`}>
              ★
            </span>
          ))}
          <span className="ml-1 text-xs text-slate-500">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">{name}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
          <div>{runCount} run{runCount !== 1 ? "s" : ""} · {(failureRate * 100).toFixed(0)}% failure</div>
          <div>{remixCount} remix{remixCount !== 1 ? "es" : ""}</div>
        </div>
        <Link
          href={`/agents/${id}`}
          className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
        >
          View Agent
        </Link>
      </div>
    </article>
  );
}

