"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AgentRowProps = {
  id: string;
  name: string;
  category: string;
  rating: number;
  runCount: number;
  ratingCount: number;
};

export function AgentRow({ id, name, category, rating, runCount, ratingCount }: AgentRowProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok || res.status === 204) {
      router.refresh();
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-500">{category}</p>
        </div>

        <div className="flex shrink-0 items-center gap-6 text-sm text-slate-600">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">{runCount}</p>
            <p className="text-xs text-slate-500">runs</p>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${star <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">{rating.toFixed(1)} · {ratingCount} rating{ratingCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/developer-dashboard/analytics/${id}`}
              className="rounded-md border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Analytics
            </Link>
            <Link
              href={`/agents/${id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
