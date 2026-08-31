// gauntlet:vocab — grep the IA_CANON.md banned-synonym list against
// user-facing string locations: components/**, app/**, lib/**.
//
// Methodology (lexical, not semantic — read before trusting a "0"):
// - Only scans text inside quoted/template-literal spans and bare JSX text
//   nodes (content directly between tags) on each line — never comments,
//   never code identifiers/imports (e.g. `ExportDocument`, `DOCUMENT_CSS`
//   are component/const NAMES, not authored prose, and are excluded by
//   construction since they're bare identifiers, not inside quotes/JSX text).
// - Per IA_CANON.md's own note ("Ban covers authored UI strings — labels,
//   buttons, aria-labels, structural prompt vocabulary"), the authored
//   SYSTEM-PROMPT copy in lib/prompts.ts and app/api/evaluate/route.ts is
//   in scope — it is static repo text, not the model's generated output.
// - "screen" is only banned as a NUMBERING system (IA_CANON.md: "screen
//   stays legal only in ordinary descriptive prose"). The known violations
//   all use capitalised "Screen N" as a label; ordinary prose uses
//   lowercase. This scan matches capitalised \bScreens?\b only — it cannot
//   tell "Screenshot" from "Screen" contextually beyond that, so it will
//   NOT catch a lowercase mid-sentence numbering slip, and it WILL catch a
//   capitalised "Screen" used in ordinary prose (there are none currently).
// - "observation" is exempted in lib/prompts.ts only — the canon's explicit
//   "What's Working Well" ruling (2026-07-31) — banned everywhere else.
// - This finds hits; it does not judge intent. lib/prompts.ts instructing
//   the model NOT to say "Screen 1" still contains the literal text
//   "Screen 1" and will be listed — a human reads the list, per the
//   ignition key ("if there are hits, list them, do not fix them").
import fs from "node:fs";
import path from "node:path";
import { ROOT, OUT_DIR, ensureDir } from "./lib.mjs";

const SCAN_DIRS = ["components", "app", "lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

const TERMS = [
  {
    name: "screen",
    pattern: /\bScreens?\b/g,
    note: "numbering system only — capitalised form",
  },
  { name: "document", pattern: /\bdocuments?\b/gi },
  { name: "issue", pattern: /\bissues?\b/gi },
  { name: "problem", pattern: /\bproblems?\b/gi },
  { name: "criticism", pattern: /\bcriticisms?\b/gi },
  {
    name: "observation",
    pattern: /\bobservations?\b/gi,
    exemptFiles: ["lib/prompts.ts"],
  },
];

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

// Block comments first (they can span lines — replaced with matching
// whitespace, including newlines, so line numbers of anything after them
// stay correct), then line comments. Both are blanked out, not removed, so
// every remaining character's original line number is unchanged.
function blankComments(content) {
  let out = content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  out = out.replace(/\/\/.*$/gm, (m) => " ".repeat(m.length));
  return out;
}

// import/require/dynamic-import statements (e.g. `import { X } from
// "@/lib/export-document"`) are code, never authored prose — a hyphenated
// module path segment like "export-document" would otherwise register a
// whole-word "document" hit unrelated to the banned term. Blanked out the
// same way as comments, preserving line numbers.
function blankImportStatements(content) {
  let out = content.replace(/^[ \t]*(?:import|export)\b[^\n]*$/gm, (m) =>
    " ".repeat(m.length)
  );
  // Dynamic imports don't start the line (e.g. `const { x } = await
  // import("@/lib/export-document")`) — blank just the call expression.
  out = out.replace(/\bimport\s*\([^)]*\)/g, (m) => " ".repeat(m.length));
  return out;
}

function lineNumberAt(content, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

/**
 * Every quoted/template-literal span in the whole file (so a multi-line
 * backtick template — e.g. the framework prompt blocks in lib/prompts.ts —
 * is scanned in full, not just whatever happens to open+close on one
 * line), plus bare JSX text nodes (content directly between two tags).
 * Returns {text, index} pairs, index being the absolute offset into the
 * ORIGINAL (comment/import-blanked) content, for accurate line numbers.
 */
function extractScannableSpans(content) {
  const spans = [];
  const quotedPattern = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/gs;
  let m;
  while ((m = quotedPattern.exec(content)) !== null) {
    spans.push({ text: m[0], index: m.index });
  }

  const jsxTextPattern = />([^<>{}]+)[<{]/g;
  while ((m = jsxTextPattern.exec(content)) !== null) {
    if (m[1].trim()) spans.push({ text: m[1], index: m.index + 1 });
  }

  return spans;
}

function main() {
  ensureDir(OUT_DIR);

  const files = [];
  for (const dir of SCAN_DIRS) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) walk(full, files);
  }

  const hits = [];

  for (const file of files) {
    const relPath = path.relative(ROOT, file);
    const original = fs.readFileSync(file, "utf-8");
    const originalLines = original.split("\n");
    const blanked = blankImportStatements(blankComments(original));

    const spans = extractScannableSpans(blanked);
    const seenPerLine = new Set(); // `${lineNo}::${term}` — one hit per term per line is enough signal

    for (const span of spans) {
      for (const term of TERMS) {
        if (term.exemptFiles?.includes(relPath)) continue;
        term.pattern.lastIndex = 0;
        let match;
        // A single span can be an entire multi-line template literal (e.g.
        // a framework prompt block) containing several separate
        // occurrences of the same term — find all of them, not just the
        // first, or later ones on later lines within the same span go
        // unreported.
        while ((match = term.pattern.exec(span.text)) !== null) {
          const lineNo = lineNumberAt(blanked, span.index + match.index);
          const key = `${lineNo}::${term.name}`;
          if (!seenPerLine.has(key)) {
            seenPerLine.add(key);
            hits.push({
              file: relPath,
              line: lineNo,
              term: term.name,
              matchedText: match[0],
              context: (originalLines[lineNo - 1] || "").trim(),
            });
          }
          if (match.index === term.pattern.lastIndex) term.pattern.lastIndex++; // zero-width guard
        }
      }
    }
  }

  hits.sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "vocab.json"),
    JSON.stringify(
      {
        bannedTerms: TERMS.map((t) => t.name),
        filesScanned: files.length,
        hitCount: hits.length,
        hits,
      },
      null,
      2
    )
  );

  console.log(
    `gauntlet:vocab — scanned ${files.length} files, ${hits.length} hits (expected 0 on a clean main; see LEDGER.md GAP-LIST 2.0 for known, un-fixed backlog).`
  );
}

main();
