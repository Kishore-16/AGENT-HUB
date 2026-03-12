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
  runCount: number;
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
      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, description, tag, or category…"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              selectedCategory === ""
                ? "bg-cyan-700 text-white"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-cyan-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {filtered.length} agent{filtered.length !== 1 ? "s" : ""} found
      </p>

      <section className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-lg border border-dashed border-slate-300 p-6 text-slate-600">
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
              runCount={agent.runCount}
            />
          ))
        )}
      </section>
    </>
  );
}
