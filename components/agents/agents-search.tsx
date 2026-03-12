"use client";

import { useState } from "react";

import { AgentCard } from "./agent-card";

type Agent = {
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

type AgentsSearchProps = {
  agents: Agent[];
  categories: string[];
};

export function AgentsSearch({ agents, categories }: AgentsSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = agents.filter((agent) => {
    const matchesCategory =
      selectedCategory === "" ||
      agent.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesQuery =
      q === "" ||
      agent.name.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      agent.category.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <div className="mt-8 space-y-4">
        <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, description, tag, or category…"
            className="w-full rounded-2xl border border-white/10 bg-[#071220] px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
              selectedCategory === ""
                ? "border border-emerald-300/20 bg-emerald-400/15 text-emerald-100"
                : "border border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                selectedCategory === cat
                  ? "border border-emerald-300/20 bg-emerald-400/15 text-emerald-100"
                  : "border border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm uppercase tracking-[0.24em] text-slate-500">
        {filtered.length} agent{filtered.length !== 1 ? "s" : ""} found
      </p>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-[24px] border border-dashed border-white/15 bg-black/20 p-8 text-sm text-slate-400">
            No agents match your search.
          </p>
        ) : (
          filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              description={agent.description}
              category={agent.category}
              tags={agent.tags}
              rating={agent.rating}
              version={agent.version}
              runCount={agent.runCount}
              remixCount={agent.remixCount}
              failureRate={agent.failureRate}
            />
          ))
        )}
      </section>
    </>
  );
}
