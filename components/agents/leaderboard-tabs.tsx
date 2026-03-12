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
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab("trending")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            tab === "trending" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setTab("topRated")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            tab === "topRated" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          ⭐ Top Rated
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {agents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            No agents yet.
          </p>
        ) : (
          agents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm"
            >
              {/* Position badge */}
              <div className="flex shrink-0 items-center justify-center">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-amber-100 text-amber-700"
                      : i === 1
                        ? "bg-slate-200 text-slate-700"
                        : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {i + 1}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{agent.name}</span>
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">
                      {agent.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
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

                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{agent.description}</p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
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
