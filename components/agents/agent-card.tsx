import Link from "next/link";

type AgentCardProps = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  runCount: number;
};

export function AgentCard({ id, name, description, category, tags, rating, runCount }: AgentCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{category}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={`text-sm ${star <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}`}>
              ★
            </span>
          ))}
          <span className="ml-1 text-xs text-slate-500">{rating.toFixed(1)}</span>
        </div>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-slate-900">{name}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{description}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs text-slate-400">{runCount} run{runCount !== 1 ? "s" : ""}</span>
        <Link
          href={`/agents/${id}`}
          className="inline-flex rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          View Agent
        </Link>
      </div>
    </article>
  );
}

