"use client";

import { FRAMEWORKS } from "@/lib/types";
import {
  IconNielsen,
  IconCognitive,
  IconStress,
  IconAccessibility,
} from "@/components/icons";

interface FrameworkTogglesProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const FRAMEWORK_ICONS: Record<string, typeof IconNielsen> = {
  nielsen: IconNielsen,
  cw: IconCognitive,
  state: IconStress,
  a11y: IconAccessibility,
};

export function FrameworkToggles({ selected, onChange }: FrameworkTogglesProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FRAMEWORKS.map((fw) => {
        const isOn = selected.includes(fw.id);
        const Icon = FRAMEWORK_ICONS[fw.id];
        return (
          <button
            key={fw.id}
            onClick={() => {
              if (isOn) onChange(selected.filter((s) => s !== fw.id));
              else onChange([...selected, fw.id]);
            }}
            className={`
              flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 border cursor-pointer
              ${isOn
                ? "bg-navy-dim border-navy"
                : "bg-card border-border hover:border-border-strong"
              }
            `}
          >
            {Icon && (
              <Icon
                className={`w-6 h-6 shrink-0 ${isOn ? "text-navy" : "text-text-tertiary"}`}
              />
            )}
            <div>
              <div
                className={`text-[16px] font-semibold transition-colors ${
                  isOn ? "text-navy" : "text-text-secondary"
                }`}
              >
                {fw.label}
              </div>
              <div className="text-[13px] text-text-tertiary mt-0.5">{fw.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
