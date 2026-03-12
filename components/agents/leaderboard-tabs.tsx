"use client";

import Link from "next/link";
import { useState } from "react";

type LeaderboardAgent = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  _count: { runs: number; ratings: number };
};

type LeaderboardTabsProps = {
  trending: LeaderboardAgent[];
  topRated: LeaderboardAgent[];
};

export function LeaderboardTabs({ trending, topRated }: LeaderboardTabsProps) {
  const [tab, setTab] = useState<"trending" | "topRated">("trending");
  const agents = tab === "trending" ? trending : topRated;

  return (
    <div>
      <div className="flex w-fit gap-1 rounded-full border border-white/10 bg-black/20 p-1">
        <button
          onClick={() => setTab("trending")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
            tab === "trending"
              ? "border border-emerald-300/20 bg-emerald-400/15 text-emerald-100"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setTab("topRated")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
            tab === "topRated"
              ? "border border-emerald-300/20 bg-emerald-400/15 text-emerald-100"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          ⭐ Top Rated
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {agents.length === 0 ? (
          <p className="rounded-[24px] border border-dashed border-white/15 bg-black/20 py-12 text-center text-sm text-slate-400">
            No agents yet.
          </p>
        ) : (
          agents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/25"
            >
              <div className="flex shrink-0 items-center justify-center">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                    i === 0
                      ? "border-amber-300/30 bg-amber-100 text-amber-700"
                      : i === 1
                        ? "border-white/10 bg-slate-200 text-slate-700"
                        : i === 2
                          ? "border-orange-300/25 bg-orange-100 text-orange-700"
                          : "border-white/10 bg-slate-100 text-slate-600"
                  }`}
                >
                  {i + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{agent.name}</span>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-emerald-100">
                      {agent.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= Math.round(agent.rating) ? "text-amber-400" : "text-slate-300"}>
                          ★
                        </span>
                      ))}
                      <span className="ml-0.5">{agent.rating.toFixed(1)}</span>
                    </span>
                    <span>{agent._count.runs} runs</span>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{agent.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
