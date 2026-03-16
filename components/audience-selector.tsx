"use client";

import { AUDIENCES } from "@/lib/types";

interface AudienceSelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

export function AudienceSelector({ selected, onChange }: AudienceSelectorProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {AUDIENCES.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          title={a.description}
          className={`
            px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 border
            ${selected === a.id
              ? "bg-accent-dim border-accent-border text-accent"
              : "bg-white/[0.02] border-border text-text-tertiary hover:text-text-secondary hover:border-border-hover"
            }
          `}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
