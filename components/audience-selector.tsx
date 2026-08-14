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
            px-4 py-2 rounded-pill text-[15px] font-medium cursor-pointer transition-all duration-150 border
            ${
              selected === a.id
                ? "bg-navy-dim border-navy text-navy font-semibold"
                : "bg-card border-border text-text-secondary hover:text-text-primary hover:border-border-strong"
            }
          `}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
