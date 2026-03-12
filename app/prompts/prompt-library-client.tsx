"use client";

import { FormEvent, useMemo, useState } from "react";

type PromptCard = {
  id: string;
  title: string;
  goal: string;
  prompt: string;
  description: string;
  createdAt: string;
  creator: { name: string };
  agent: { id: string; name: string } | null;
  pack: { id: string; name: string } | null;
  voteCount: number;
  hasVoted: boolean;
};

type PromptLibraryClientProps = {
  initialPrompts: PromptCard[];
  isLoggedIn: boolean;
  agents: Array<{ id: string; name: string }>;
  packs: Array<{ id: string; name: string }>;
};

export function PromptLibraryClient({ initialPrompts, isLoggedIn, agents, packs }: PromptLibraryClientProps) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return prompts;

    return prompts.filter((prompt) =>
      [prompt.title, prompt.goal, prompt.prompt, prompt.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [prompts, query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      goal: String(formData.get("goal") ?? ""),
      prompt: String(formData.get("prompt") ?? ""),
      description: String(formData.get("description") ?? ""),
      agentId: String(formData.get("agentId") ?? "") || undefined,
      packId: String(formData.get("packId") ?? "") || undefined,
    };

    const response = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Unable to publish prompt");
      return;
    }

    const data = (await response.json()) as { prompt: { id: string } };

    setPrompts([
      {
        id: data.prompt.id,
        title: payload.title,
        goal: payload.goal,
        prompt: payload.prompt,
        description: payload.description,
        createdAt: new Date().toISOString(),
        creator: { name: "You" },
        agent: agents.find((agent) => agent.id === payload.agentId) ?? null,
        pack: packs.find((pack) => pack.id === payload.packId) ?? null,
        voteCount: 0,
        hasVoted: false,
      },
      ...prompts,
    ]);

    (event.currentTarget as HTMLFormElement).reset();
  }

  async function toggleVote(promptId: string, hasVoted: boolean) {
    const response = await fetch(`/api/prompts/${promptId}/vote`, {
      method: hasVoted ? "DELETE" : "POST",
    });

    if (!response.ok && response.status !== 204) {
      return;
    }

    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === promptId
          ? {
              ...prompt,
              hasVoted: !hasVoted,
              voteCount: prompt.voteCount + (hasVoted ? -1 : 1),
            }
          : prompt,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Search prompts</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by goal, prompt, or title"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-sm font-medium text-slate-700">Title</label>
              <input id="title" name="title" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="goal" className="text-sm font-medium text-slate-700">Goal</label>
              <input id="goal" name="goal" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="prompt" className="text-sm font-medium text-slate-700">Prompt</label>
            <textarea id="prompt" name="prompt" required rows={4} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
            <textarea id="description" name="description" rows={2} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="agentId" className="text-sm font-medium text-slate-700">Linked Agent</label>
              <select id="agentId" name="agentId" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">None</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="packId" className="text-sm font-medium text-slate-700">Linked Pack</label>
              <select id="packId" name="packId" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">None</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button type="submit" disabled={loading} className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60">
            {loading ? "Publishing..." : "Share Prompt"}
          </button>
        </form>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredPrompts.map((prompt) => (
          <article key={prompt.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{prompt.title}</h2>
                <p className="mt-1 text-sm text-slate-500">By {prompt.creator.name}</p>
              </div>
              <button
                type="button"
                disabled={!isLoggedIn}
                onClick={() => toggleVote(prompt.id, prompt.hasVoted)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prompt.hasVoted ? "Unvote" : "Upvote"} · {prompt.voteCount}
              </button>
            </div>

            <p className="mt-3 text-sm font-medium text-cyan-700">Goal: {prompt.goal}</p>
            {prompt.description ? <p className="mt-2 text-sm text-slate-600">{prompt.description}</p> : null}
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
              {prompt.prompt}
            </pre>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              {prompt.agent ? <span className="rounded-full bg-slate-100 px-2 py-1">Agent: {prompt.agent.name}</span> : null}
              {prompt.pack ? <span className="rounded-full bg-slate-100 px-2 py-1">Pack: {prompt.pack.name}</span> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}