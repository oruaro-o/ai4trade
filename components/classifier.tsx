"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "@/components/upload-zone";
import { ResultCard } from "@/components/result-card";
import { ResultsSkeleton } from "@/components/results-skeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
  ClassificationResult,
  APIResponse,
} from "@/app/api/classify/route";

export function Classifier() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ClassificationResult[] | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleImageSelected = useCallback((_file: File, dataUrl: string) => {
    setFile(_file);
    setPreview(dataUrl);
    setResults(null);
  }, []);

  const handleImageCleared = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResults(null);
  }, []);

  const handleClassify = useCallback(async () => {
    if (!file || !preview) return;
    setIsClassifying(true);
    setResults(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      if (!response.ok) throw new Error("Classification failed");

      const data: APIResponse = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Classification error:", error);
    } finally {
      setIsClassifying(false);
    }
  }, [file, preview]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      {/* Left / Top panel — Upload */}
      <div className="flex flex-col gap-4 p-6 lg:p-8 lg:w-[45%] lg:border-r border-border">
        <div className="flex-1 flex flex-col min-h-0">
          <UploadZone
            onImageSelected={handleImageSelected}
            onImageCleared={handleImageCleared}
            preview={preview}
            disabled={isClassifying}
          />
        </div>
        <Button
          size="lg"
          disabled={!file || isClassifying}
          onClick={handleClassify}
          className="w-full"
        >
          {isClassifying ? (
            <>
              <Spinner className="size-4" />
              <span>Classifying</span>
            </>
          ) : (
            "Classify"
          )}
        </Button>
      </div>

      {/* Right / Bottom panel — Results */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {isClassifying ? (
          <ResultsSkeleton />
        ) : results ? (
          <div className="space-y-3">
            {results.map((result) => (
              <ResultCard key={result.rank} result={result} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-40">
            <p className="text-sm text-muted-foreground/60">
              Classification results will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
