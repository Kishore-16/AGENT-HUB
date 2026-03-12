"use client";

import { useState } from "react";

type RatingWidgetProps = {
  agentId: string;
  initialRating: number;
  totalRatings: number;
  userScore: number | null;
  isLoggedIn: boolean;
};

export function RatingWidget({
  agentId,
  initialRating,
  totalRatings,
  userScore,
  isLoggedIn,
}: RatingWidgetProps) {
  const [hovered, setHovered] = useState(0);
  const [currentScore, setCurrentScore] = useState(userScore ?? 0);
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [currentTotal, setCurrentTotal] = useState(totalRatings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayScore = hovered || currentScore;

  async function handleRate(score: number) {
    if (!isLoggedIn || loading) return;

    const prevScore = currentScore;
    const prevRating = currentRating;
    const prevTotal = currentTotal;

    // Optimistic update
    setCurrentScore(score);
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/agents/${agentId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to submit rating");
      }

      const data = (await res.json()) as { rating: number; totalRatings: number };
      setCurrentRating(data.rating);
      setCurrentTotal(data.totalRatings);
    } catch (err) {
      setCurrentScore(prevScore);
      setCurrentRating(prevRating);
      setCurrentTotal(prevTotal);
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-900">Rating</p>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isLoggedIn || loading}
            onClick={() => handleRate(star)}
            onMouseEnter={() => isLoggedIn && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            className="text-2xl leading-none transition-transform hover:scale-110 disabled:cursor-default"
          >
            <span className={star <= displayScore ? "text-amber-400" : "text-slate-300"}>
              ★
            </span>
          </button>
        ))}

        <span className="ml-2 text-sm text-slate-500">
          {currentRating.toFixed(1)} / 5 &middot; {currentTotal} rating{currentTotal !== 1 ? "s" : ""}
        </span>
      </div>

      {!isLoggedIn && (
        <p className="mt-1 text-xs text-slate-400">
          <a href="/login" className="underline hover:text-slate-600">Log in</a> to rate this agent
        </p>
      )}

      {currentScore > 0 && isLoggedIn && (
        <p className="mt-1 text-xs text-slate-400">
          Your rating: {currentScore} star{currentScore !== 1 ? "s" : ""}
        </p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
