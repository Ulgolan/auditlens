import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  // March 404 tripwire: a hardcoded Claude model string anywhere in
  // application source outside lib/ai-config.ts is a lint error. The
  // model id belongs in exactly one place.
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: ["lib/ai-config.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^claude-/]",
          message:
            "Hardcoded Claude model strings are not allowed outside lib/ai-config.ts. Import CLAUDE_MODEL instead.",
        },
      ],
    },
  },
];

export default eslintConfig;
