"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { getAgentFormatLabel } from "@/lib/agent-formats";

type AgentInfo = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  version: string;
  inputFormat: string;
  outputFormat: string;
  versions: Array<{ versionNumber: number; versionLabel: string; createdAt: string | Date }>;
  failureRate?: number;
  _count: { runs: number; ratings: number };
};

type PlaygroundAgent = {
  id: string;
  name: string;
};

type PackInfo = {
  id: string;
  name: string;
  description: string;
  items: Array<{
    id: string;
    position: number;
    agentVersionNumber: number;
    agent: {
      id: string;
      name: string;
      inputFormat: string;
      outputFormat: string;
    };
  }>;
};

type PlaygroundFormProps = {
  agents: PlaygroundAgent[];
  packs: PackInfo[];
  defaultAgentId: string;
  defaultVersionNumber: number | null;
  defaultPackId: string;
  initialAgent?: AgentInfo | null;
};

type SingleResult = {
  output: string;
  responseTime: number | null;
  versionLabel?: string;
};

type PackResult = {
  status: string;
  finalOutput: string;
  steps: Array<{
    agentId: string;
    agentName: string;
    versionLabel: string;
    status: string;
    output: string;
    responseTime: number;
    errorMessage?: string;
  }>;
};

type BenchmarkResult = {
  status: string;
  results: Array<{
    agentId: string;
    agentName: string;
    versionLabel: string;
    output: string;
    responseTime: number;
    status: string;
    errorMessage?: string;
  }>;
};

export function PlaygroundForm({
  agents,
  packs,
  defaultAgentId,
  defaultVersionNumber,
  defaultPackId,
  initialAgent = null,
}: PlaygroundFormProps) {
  const [mode, setMode] = useState<"single" | "benchmark" | "pack">(defaultPackId ? "pack" : "single");
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(defaultVersionNumber);
  const [selectedPackId, setSelectedPackId] = useState(defaultPackId);
  const [benchmarkAgentIds, setBenchmarkAgentIds] = useState<string[]>([]);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(initialAgent);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [singleResult, setSingleResult] = useState<SingleResult | null>(null);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) ?? null,
    [packs, selectedPackId],
  );

  async function handleAgentChange(agentId: string) {
    setSelectedAgentId(agentId);
    setSingleResult(null);
    setError("");
    setSelectedVersionNumber(null);

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
        setSelectedVersionNumber(data.agent.versions[0]?.versionNumber ?? null);
      }
    } catch {
      // ignore
    }
    setLoadingAgent(false);
  }

  function toggleBenchmarkAgent(agentId: string) {
    setBenchmarkResult(null);
    setError("");

    setBenchmarkAgentIds((current) => {
      if (current.includes(agentId)) {
        return current.filter((id) => id !== agentId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, agentId];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSingleResult(null);
    setPackResult(null);
    setBenchmarkResult(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const input = String(formData.get("input") ?? "");
    const userSystemPrompt = String(formData.get("userSystemPrompt") ?? "");
    const webhookUrl = String(formData.get("webhookUrl") ?? "") || undefined;

    const start = Date.now();
    const response = await fetch(
      mode === "single" ? "/api/run-agent" : "/api/run-workflow",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "single"
            ? {
                agentId: selectedAgentId,
                input,
                userSystemPrompt,
                versionNumber: selectedVersionNumber ?? undefined,
                webhookUrl,
              }
            : mode === "pack"
              ? {
                  mode: "PACK",
                  packId: selectedPackId,
                  input,
                  webhookUrl,
                }
              : {
                  mode: "BENCHMARK",
                  agentIds: benchmarkAgentIds,
                  input,
                  userSystemPrompt,
                  webhookUrl,
                },
        ),
      },
    );

    const elapsed = Date.now() - start;
    const data = (await response.json()) as {
      output?: string;
      error?: string;
      status?: string;
      versionLabel?: string;
      finalOutput?: string;
      steps?: PackResult["steps"];
      results?: BenchmarkResult["results"];
      compatibilityWarnings?: Array<{ message: string }>;
    };
    setLoading(false);

    if (!response.ok) {
      const warnings = data.compatibilityWarnings?.map((warning) => warning.message).join(" ");
      setError([data.error, warnings].filter(Boolean).join(" ") || "Agent execution failed");
      return;
    }

    if (mode === "single") {
      let rawOutput = data.output ?? "No output received";
      try {
        const parsed = JSON.parse(rawOutput);
        rawOutput = JSON.stringify(parsed, null, 2);
      } catch {
        // keep original text output
      }
      setSingleResult({
        output: rawOutput,
        responseTime: elapsed,
        versionLabel: data.versionLabel,
      });
      return;
    }

    if (mode === "pack") {
      setPackResult({
        status: data.status ?? "SUCCESS",
        finalOutput: data.finalOutput ?? "",
        steps: data.steps ?? [],
      });
      return;
    }

    setBenchmarkResult({
      status: data.status ?? "SUCCESS",
      results: data.results ?? [],
    });
  }

  async function handleCopy() {
    try {
      const value = mode === "single"
        ? singleResult?.output ?? ""
        : mode === "pack"
          ? packResult?.finalOutput ?? ""
          : JSON.stringify(benchmarkResult?.results ?? [], null, 2);
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {[
          { id: "single", label: "Single Agent" },
          { id: "benchmark", label: "Benchmark" },
          { id: "pack", label: "Pack Run" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id as "single" | "benchmark" | "pack");
              setError("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === item.id ? "bg-cyan-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Configuration</p>

          {mode === "single" ? (
            <>
              <div>
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

              {agentInfo ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Version</label>
                  <select
                    value={selectedVersionNumber ?? agentInfo.versions[0]?.versionNumber ?? ""}
                    onChange={(event) => setSelectedVersionNumber(Number(event.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    {agentInfo.versions.map((version) => (
                      <option key={version.versionNumber} value={version.versionNumber}>
                        {version.versionLabel}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
          ) : null}

          {mode === "pack" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select Pack</label>
              <select
                value={selectedPackId}
                onChange={(event) => setSelectedPackId(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>Choose a pack…</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {mode === "benchmark" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Choose 2-3 agents</p>
              {agents.slice(0, 12).map((agent) => (
                <label key={agent.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={benchmarkAgentIds.includes(agent.id)}
                    onChange={() => toggleBenchmarkAgent(agent.id)}
                    disabled={!benchmarkAgentIds.includes(agent.id) && benchmarkAgentIds.length >= 3}
                  />
                  {agent.name}
                </label>
              ))}
            </div>
          ) : null}

          {loadingAgent && <p className="text-sm text-slate-400">Loading agent details…</p>}

          {!agentInfo && !loadingAgent && mode === "single" && (
            <p className="text-sm text-slate-400">Select an agent above to see its details here.</p>
          )}

          {agentInfo && !loadingAgent && (
            <>
              <div>
                <p className="text-lg font-semibold text-slate-900">{agentInfo.name}</p>
                <span className="mt-1 inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
                  {agentInfo.category}
                </span>
                <span className="ml-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {agentInfo.version}
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

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p>Input: {getAgentFormatLabel(agentInfo.inputFormat)}</p>
                <p>Output: {getAgentFormatLabel(agentInfo.outputFormat)}</p>
                <p>Failure rate: {((agentInfo.failureRate ?? 0) * 100).toFixed(1)}%</p>
              </div>

              <Link href={`/agents/${agentInfo.id}`} className="text-xs text-cyan-700 hover:underline">
                View full details →
              </Link>
            </>
          )}

          {mode === "pack" && selectedPack ? (
            <>
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedPack.name}</p>
                <p className="mt-2 text-sm text-slate-600">{selectedPack.description}</p>
              </div>
              <div className="space-y-2">
                {selectedPack.items.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-900">{index + 1}. {item.agent.name} · v{item.agentVersionNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getAgentFormatLabel(item.agent.inputFormat)} in {"->"} {getAgentFormatLabel(item.agent.outputFormat)} out
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {mode === "benchmark" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Benchmark mode runs the same prompt through up to three agents simultaneously and shows the outputs side by side.
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode !== "pack" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                System Prompt <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                name="userSystemPrompt"
                rows={3}
                placeholder="Add your own instructions to guide the agent for this run…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="mt-1 text-xs text-slate-400">Appended to the selected agent run or benchmark request.</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Input</label>
            <textarea
              name="input"
              required
              rows={7}
              placeholder="Enter your prompt here…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <label className="mt-4 mb-2 block text-sm font-medium text-slate-700">
              Webhook URL <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              name="webhookUrl"
              type="url"
              placeholder="https://hooks.slack.com/..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              type="submit"
              disabled={
                loading ||
                (mode === "single" && !selectedAgentId) ||
                (mode === "pack" && !selectedPackId) ||
                (mode === "benchmark" && benchmarkAgentIds.length < 2)
              }
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-5 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running…
                </>
              ) : (
                mode === "single" ? "Run Agent" : mode === "pack" ? "Run Pack" : "Run Benchmark"
              )}
            </button>
          </div>

          {(singleResult || packResult || benchmarkResult || error || loading) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-slate-700">Output</h3>
                  {singleResult?.responseTime !== null && singleResult?.responseTime !== undefined && mode === "single" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {singleResult.responseTime} ms
                    </span>
                  )}
                  {mode === "single" && singleResult?.versionLabel ? (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      {singleResult.versionLabel}
                    </span>
                  ) : null}
                </div>
                {(singleResult || packResult || benchmarkResult) && (
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

              {mode === "single" && singleResult?.output && (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-4 text-sm text-slate-100">
                  {singleResult.output}
                </pre>
              )}

              {mode === "pack" && packResult ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-slate-950 p-4 text-sm text-slate-100">
                    <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Final Output · {packResult.status}</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap">{packResult.finalOutput || "(empty output)"}</pre>
                  </div>
                  <div className="grid gap-3">
                    {packResult.steps.map((step, index) => (
                      <div key={`${step.agentId}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{index + 1}. {step.agentName}</p>
                          <span className="text-xs text-slate-500">{step.versionLabel} · {step.responseTime} ms · {step.status}</span>
                        </div>
                        {step.errorMessage ? <p className="mt-2 text-xs text-rose-700">{step.errorMessage}</p> : null}
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-700">{step.output || "(empty output)"}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {mode === "benchmark" && benchmarkResult ? (
                <div className="grid gap-3 lg:grid-cols-3">
                  {benchmarkResult.results.map((result) => (
                    <div key={result.agentId} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{result.agentName}</p>
                        <span className="text-xs text-slate-500">{result.versionLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{result.responseTime} ms · {result.status}</p>
                      {result.errorMessage ? <p className="mt-2 text-xs text-rose-700">{result.errorMessage}</p> : null}
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-700">{result.output || "(empty output)"}</pre>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
