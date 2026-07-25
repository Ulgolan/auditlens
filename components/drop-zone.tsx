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
            ? "border-navy bg-navy-dim"
            : "border-border bg-card hover:border-border-strong"
          }
          ${screenshots.length > 0 ? "p-4" : "py-12 px-6"}
        `}
      >
        {screenshots.length === 0 ? (
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-40">📸</div>
            <div className="text-[19px] font-semibold text-text-secondary mb-1">
              Drop screenshots here
            </div>
            <div className="text-[15px] text-text-tertiary">
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
                <div className="font-mono absolute top-1 left-1 bg-overlay rounded px-1.5 py-0.5 text-[10px] font-medium text-ivory">
                  {i + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(s.id);
                  }}
                  className="absolute top-1 right-1 bg-overlay border-none rounded px-1.5 py-0.5 text-xs text-ivory cursor-pointer hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center justify-center w-20 h-[120px] rounded-lg border border-dashed border-border text-text-tertiary text-2xl hover:text-text-secondary hover:border-border-strong transition-colors">
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
