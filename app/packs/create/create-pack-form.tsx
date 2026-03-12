"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { describeFormatCompatibility, getAgentFormatLabel } from "@/lib/agent-formats";

type AgentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
};

type CreatePackFormProps = {
  agents: AgentOption[];
};

export function CreatePackForm({ agents }: CreatePackFormProps) {
  const router = useRouter();
  const [selectedAgentIds, setSelectedAgentIds] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAgents = selectedAgentIds
    .filter(Boolean)
    .map((agentId) => agents.find((agent) => agent.id === agentId))
    .filter((agent): agent is AgentOption => Boolean(agent));

  const compatibilityWarnings = useMemo(
    () => selectedAgents.slice(0, -1).flatMap((agent, index) => {
      const nextAgent = selectedAgents[index + 1];
      const warning = describeFormatCompatibility(agent.outputFormat, nextAgent.inputFormat);
      return warning ? [`${agent.name} -> ${nextAgent.name}: ${warning}`] : [];
    }),
    [selectedAgents],
  );

  function updateAgent(position: number, agentId: string) {
    const next = [...selectedAgentIds];
    next[position] = agentId;
    setSelectedAgentIds(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const agentIds = selectedAgentIds.filter(Boolean);
    if (agentIds.length < 2) {
      setError("Select at least two agents.");
      return;
    }

    if (compatibilityWarnings.length > 0) {
      setError("Fix the type mismatch warnings before publishing this pack.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        agentIds,
        isPublic: true,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Unable to create pack");
      return;
    }

    router.push("/packs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">Pack Name</label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Pick 2-3 agents. The builder checks adjacent input/output types before publish.
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {selectedAgentIds.map((selectedId, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-4">
            <label className="text-sm font-medium text-slate-700">Step {index + 1}</label>
            <select
              value={selectedId}
              onChange={(event) => updateAgent(index, event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">{index === 2 ? "Optional third agent" : "Select an agent"}</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.category}
                </option>
              ))}
            </select>

            {selectedId ? (
              <div className="text-xs text-slate-500">
                {(() => {
                  const agent = agents.find((item) => item.id === selectedId);
                  if (!agent) return null;
                  return (
                    <>
                      <p>{agent.description}</p>
                      <p className="mt-2">In: {getAgentFormatLabel(agent.inputFormat)}</p>
                      <p>Out: {getAgentFormatLabel(agent.outputFormat)}</p>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {compatibilityWarnings.length > 0 ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {compatibilityWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : selectedAgents.length >= 2 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          This pack is chain-compatible.
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
      >
        {loading ? "Publishing..." : "Publish Pack"}
      </button>
    </form>
  );
}