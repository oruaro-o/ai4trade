"use client";

import type { ClassificationResult } from "@/app/api/classify/route";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  result: ClassificationResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isRecommended = result.rank === 1;
  const isWorst = result.rank === 5;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <article
      className={cn(
        "relative border rounded-lg p-5 transition-colors",
        isRecommended
          ? "border-foreground/20 bg-foreground/[0.02]"
          : isWorst
          ? "border-red-200 bg-red-50/40"
          : "border-border"
      )}
    >
      {/* Accent left border for recommended */}
      {isRecommended && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-foreground/40 rounded-full" />
      )}
      {/* Accent left border for worst */}
      {isWorst && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-red-300 rounded-full" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <span
            className={cn(
              "flex items-center justify-center size-6 rounded text-xs font-medium shrink-0",
              isRecommended
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            )}
          >
            {result.rank}
          </span>

          <div className="space-y-0.5">
            {/* HTS Code */}
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm font-semibold tracking-wide">
                {result.htsCode}
              </code>
              {isRecommended && (
                <span className="text-[11px] font-medium text-[#1e6b3a] bg-[#e6f4ea] px-1.5 py-0.5 rounded">
                  Recommended
                </span>
              )}
            </div>
            {/* Description */}
            <p className="text-sm text-foreground/80">{result.description}</p>
          </div>
        </div>

        {/* Duty rate */}
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Duty</p>
          <p
            className={cn(
              "text-sm font-semibold font-mono",
              result.dutyRate === "Free"
                ? "text-foreground"
                : "text-foreground/70"
            )}
          >
            {result.dutyRate}
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isRecommended ? "bg-foreground/50" : "bg-foreground/25"
            )}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono tabular-nums w-8 text-right">
          {confidencePercent}%
        </span>
      </div>

      {/* Reasoning */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {result.reasoning}
      </p>

      {/* Cost note */}
      {result.costEffectivenessNote && (
        <p className="mt-1.5 text-xs text-muted-foreground/70 italic">
          {result.costEffectivenessNote}
        </p>
      )}
    </article>
  );
}
