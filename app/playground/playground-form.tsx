"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type AgentInfo = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  _count: { runs: number; ratings: number };
};

type PlaygroundAgent = {
  id: string;
  name: string;
};

type PlaygroundFormProps = {
  agents: PlaygroundAgent[];
  defaultAgentId: string;
  initialAgent?: AgentInfo | null;
};

export function PlaygroundForm({ agents, defaultAgentId, initialAgent = null }: PlaygroundFormProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(initialAgent);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAgentChange(agentId: string) {
    setSelectedAgentId(agentId);
    setOutput("");
    setError("");
    setResponseTime(null);

    if (!agentId) {
      setAgentInfo(null);
      return;
    }

    setLoadingAgent(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        const data = (await res.json()) as { agent: AgentInfo };
        setAgentInfo(data.agent);
      }
    } catch {
      // ignore
    }
    setLoadingAgent(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOutput("");
    setResponseTime(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const input = String(formData.get("input") ?? "");
    const userSystemPrompt = String(formData.get("userSystemPrompt") ?? "");

    const start = Date.now();
    const response = await fetch("/api/run-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selectedAgentId, input, userSystemPrompt }),
    });

    const elapsed = Date.now() - start;
    const data = (await response.json()) as { output?: string; error?: string };
    setLoading(false);
    setResponseTime(elapsed);

    if (!response.ok) {
      setError(data.error ?? "Agent execution failed");
      return;
    }

    let rawOutput = data.output ?? "No output received";
    try {
      const parsed = JSON.parse(rawOutput);
      rawOutput = JSON.stringify(parsed, null, 2);
    } catch {
      // not JSON, keep as-is
    }
    setOutput(rawOutput);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* Agent selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Select Agent</label>
        <select
          value={selectedAgentId}
          onChange={(e) => handleAgentChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="" disabled>
            Choose an agent…
          </option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Split panel */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left: agent info */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Agent Info</p>

          {loadingAgent && <p className="text-sm text-slate-400">Loading agent details…</p>}

          {!agentInfo && !loadingAgent && (
            <p className="text-sm text-slate-400">Select an agent above to see its details here.</p>
          )}

          {agentInfo && !loadingAgent && (
            <>
              <div>
                <p className="text-lg font-semibold text-slate-900">{agentInfo.name}</p>
                <span className="mt-1 inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
                  {agentInfo.category}
                </span>
              </div>

              <p className="text-sm text-slate-600">{agentInfo.description}</p>

              <div className="flex flex-wrap gap-1">
                {agentInfo.tags.map((tag) => (
                  <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= Math.round(agentInfo.rating) ? "text-amber-400" : "text-slate-300"}>
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-slate-500">{agentInfo.rating.toFixed(1)}</span>
                </span>
                <span className="text-xs text-slate-500">{agentInfo._count.runs} runs</span>
              </div>

              <Link href={`/agents/${agentInfo.id}`} className="text-xs text-cyan-700 hover:underline">
                View full details →
              </Link>
            </>
          )}
        </div>

        {/* Right: input + output */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              System Prompt{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              name="userSystemPrompt"
              rows={3}
              placeholder="Add your own instructions to guide the agent for this run…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="mt-1 text-xs text-slate-400">Appended to the agent&apos;s built-in system prompt, if any.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Input</label>
            <textarea
              name="input"
              required
              rows={7}
              placeholder="Enter your prompt here…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !selectedAgentId}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-5 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running…
                </>
              ) : (
                "Run Agent"
              )}
            </button>
          </div>

          {(output || error || loading) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-slate-700">Output</h3>
                  {responseTime !== null && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {responseTime} ms
                    </span>
                  )}
                </div>
                {output && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                  Processing…
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              {output && (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-4 text-sm text-slate-100">
                  {output}
                </pre>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
