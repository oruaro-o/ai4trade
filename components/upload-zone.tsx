"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onImageSelected: (file: File, preview: string) => void;
  onImageCleared: () => void;
  preview: string | null;
  disabled?: boolean;
}

export function UploadZone({
  onImageSelected,
  onImageCleared,
  preview,
  disabled,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelected(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className="relative w-full h-full min-h-64 lg:min-h-0">
        <img
          src={preview}
          alt="Uploaded good for classification"
          className="w-full h-full object-contain rounded-lg"
        />
        {!disabled && (
          <button
            onClick={onImageCleared}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-foreground/10 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-foreground/20 transition-colors"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload zone. Drop a photo of your good, or click to upload."
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full min-h-64 lg:min-h-0 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
        isDragOver
          ? "border-foreground/30 bg-foreground/[0.03]"
          : "border-border hover:border-foreground/20 hover:bg-foreground/[0.02]"
      )}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        {isDragOver ? (
          <Upload className="size-6 text-muted-foreground" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground/60" />
        )}
        <p className="text-sm text-muted-foreground">
          Drop a photo of your good, or click to upload.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
