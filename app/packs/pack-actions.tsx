"use client";

import Link from "next/link";
import { useState } from "react";

type PackActionsProps = {
  packId: string;
  initiallyInstalled: boolean;
  canInstall: boolean;
};

export function PackActions({ packId, initiallyInstalled, canInstall }: PackActionsProps) {
  const [installed, setInstalled] = useState(initiallyInstalled);
  const [loading, setLoading] = useState(false);

  async function handleInstall() {
    setLoading(true);
    const response = await fetch(`/api/packs/${packId}/install`, { method: "POST" });
    setLoading(false);

    if (response.ok) {
      setInstalled(true);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/playground?packId=${packId}`}
        className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800"
      >
        Run Pack
      </Link>
      {canInstall ? (
        <button
          type="button"
          onClick={handleInstall}
          disabled={installed || loading}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {installed ? "Installed" : loading ? "Installing..." : "Install Pack"}
        </button>
      ) : null}
    </div>
  );
}