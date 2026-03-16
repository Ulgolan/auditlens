"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Screenshot } from "@/lib/types";

interface DropZoneProps {
  screenshots: Screenshot[];
  onAdd: (screenshot: Screenshot) => void;
  onRemove: (id: string) => void;
}

export function DropZone({ screenshots, onAdd, onRemove }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          onAdd({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            dataUrl: e.target?.result as string,
            name: file.name,
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter((i) => i.type.startsWith("image/"));
      if (imageItems.length > 0) {
        e.preventDefault();
        imageItems.forEach((item) => {
          const file = item.getAsFile();
          if (file) handleFiles([file]);
        });
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-accent/60 bg-accent-dim"
            : "border-border bg-white/[0.01] hover:border-border-hover hover:bg-white/[0.02]"
          }
          ${screenshots.length > 0 ? "p-4" : "py-12 px-6"}
        `}
      >
        {screenshots.length === 0 ? (
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-40">📸</div>
            <div className="text-[15px] font-semibold text-text-secondary mb-1">
              Drop screenshots here
            </div>
            <div className="text-xs text-text-tertiary">
              or click to browse · paste from clipboard · supports multiple files
            </div>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap justify-center">
            {screenshots.map((s, i) => (
              <div
                key={s.id}
                className="relative rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={s.dataUrl}
                  alt={`Screen ${i + 1}`}
                  className="h-[120px] w-auto block object-cover"
                />
                <div className="absolute top-1 left-1 bg-black/70 rounded px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  {i + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(s.id);
                  }}
                  className="absolute top-1 right-1 bg-black/70 border-none rounded px-1.5 py-0.5 text-xs text-white/60 cursor-pointer hover:text-white/90 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center justify-center w-20 h-[120px] rounded-lg border border-dashed border-white/10 text-white/20 text-2xl hover:text-white/40 hover:border-white/20 transition-colors">
              +
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
