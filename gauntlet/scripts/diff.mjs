// gauntlet:diff — pixelmatch between gauntlet/out/shots/ and gauntlet/baseline/
// (or, with --against <dir>, an arbitrary comparison directory).
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import {
  SHOTS_DIR,
  BASELINE_DIR,
  MASKS_DIR,
  OUT_DIR,
  ensureDir,
  allShotNames,
} from "./lib.mjs";

/**
 * `--against <dir>` compares gauntlet/out/shots/ against an arbitrary
 * directory instead of gauntlet/baseline/ — e.g. a lane baseline, or
 * gauntlet/run-1-final/, without needing an out-of-repo throwaway script
 * (gauntlet run 1's foreman had to write one; see LEDGER.md 2026-08-31).
 * Seed-when-empty (see below) applies ONLY to the default gauntlet/baseline/
 * path — an empty --against dir is always an error, never silently seeded.
 */
function parseAgainstArg(argv) {
  const idx = argv.indexOf("--against");
  if (idx === -1) return null;
  const dir = argv[idx + 1];
  if (!dir) {
    console.error("gauntlet:diff --against requires a directory argument.");
    process.exit(1);
  }
  return path.resolve(process.cwd(), dir);
}

// pixelmatch's own default — how different a pixel's colour must be (0..1)
// before it counts as a mismatch. Sub-pixel antialiasing jitter in font
// rendering sits well under this, so two renders of the same DOM should
// land at ~0.00%; a real content or layout change will not.
const PIXELMATCH_THRESHOLD = 0.1;

function loadMaskRegions(shotName) {
  const maskFile = path.join(MASKS_DIR, shotName.replace(/\.png$/, ".json"));
  if (!fs.existsSync(maskFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(maskFile, "utf-8"));
  } catch {
    return [];
  }
}

/** Paint masked regions solid black in-place on both images before compare, so nothing inside them can register a mismatch. Region shape: {x, y, width, height}. */
function paintMask(png, regions) {
  for (const r of regions) {
    for (let y = r.y; y < r.y + r.height && y < png.height; y++) {
      for (let x = r.x; x < r.x + r.width && x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 255;
      }
    }
  }
}

function main() {
  ensureDir(OUT_DIR);
  const names = allShotNames();
  const existingShots = names.filter((n) => fs.existsSync(path.join(SHOTS_DIR, n)));

  if (existingShots.length === 0) {
    console.error(
      "gauntlet:diff — gauntlet/out/shots/ is empty. Run gauntlet:shots first."
    );
    process.exit(1);
  }

  const against = parseAgainstArg(process.argv.slice(2));
  const compareDir = against ?? BASELINE_DIR;
  const isDefaultPath = against === null;

  if (against !== null) {
    const dirExists = fs.existsSync(against) && fs.statSync(against).isDirectory();
    const hasFiles = dirExists && fs.readdirSync(against).length > 0;
    if (!hasFiles) {
      console.error(
        `gauntlet:diff --against ${against} — directory is empty or does not exist.`
      );
      process.exit(1);
    }
  }

  const baselineExists =
    isDefaultPath && fs.existsSync(compareDir) && fs.readdirSync(compareDir).length > 0;

  if (isDefaultPath && !baselineExists) {
    ensureDir(BASELINE_DIR);
    for (const name of existingShots) {
      fs.copyFileSync(path.join(SHOTS_DIR, name), path.join(BASELINE_DIR, name));
    }
    fs.writeFileSync(
      path.join(OUT_DIR, "diff.json"),
      JSON.stringify(
        {
          seeded: true,
          against: path.relative(process.cwd(), BASELINE_DIR),
          note: "No baseline existed — current shots were copied to gauntlet/baseline/ as the new baseline. Nothing was compared.",
          images: [],
        },
        null,
        2
      )
    );
    console.log(
      `gauntlet:diff — no baseline existed; seeded gauntlet/baseline/ from ${existingShots.length} current shots.`
    );
    return;
  }

  const diffsDir = path.join(OUT_DIR, "diffs");
  ensureDir(diffsDir);

  const results = [];
  for (const name of existingShots) {
    const shotPath = path.join(SHOTS_DIR, name);
    const basePath = path.join(compareDir, name);

    if (!fs.existsSync(basePath)) {
      results.push({ name, status: "no-baseline", mismatchPercent: null });
      continue;
    }

    const baseImg = PNG.sync.read(fs.readFileSync(basePath));
    const curImg = PNG.sync.read(fs.readFileSync(shotPath));

    if (baseImg.width !== curImg.width || baseImg.height !== curImg.height) {
      results.push({
        name,
        status: "size-mismatch",
        baseline: `${baseImg.width}x${baseImg.height}`,
        current: `${curImg.width}x${curImg.height}`,
        mismatchPercent: null,
      });
      continue;
    }

    const regions = loadMaskRegions(name);
    if (regions.length > 0) {
      paintMask(baseImg, regions);
      paintMask(curImg, regions);
    }

    const { width, height } = baseImg;
    const diffImg = new PNG({ width, height });
    const mismatchedPixels = pixelmatch(
      baseImg.data,
      curImg.data,
      diffImg.data,
      width,
      height,
      {
        threshold: PIXELMATCH_THRESHOLD,
      }
    );
    const mismatchPercent = (mismatchedPixels / (width * height)) * 100;

    fs.writeFileSync(path.join(diffsDir, name), PNG.sync.write(diffImg));

    results.push({
      name,
      status: "compared",
      maskedRegions: regions.length,
      mismatchedPixels,
      totalPixels: width * height,
      mismatchPercent: Number(mismatchPercent.toFixed(4)),
      diffImage: `diffs/${name}`,
    });
  }

  const againstLabel = path.relative(process.cwd(), compareDir) || ".";

  fs.writeFileSync(
    path.join(OUT_DIR, "diff.json"),
    JSON.stringify(
      {
        seeded: false,
        against: againstLabel,
        threshold: PIXELMATCH_THRESHOLD,
        images: results,
      },
      null,
      2
    )
  );

  const compared = results.filter((r) => r.mismatchPercent !== null);
  const worst = compared.slice().sort((a, b) => b.mismatchPercent - a.mismatchPercent)[0];
  console.log(
    `gauntlet:diff — compared ${compared.length}/${results.length} images against ${againstLabel}/. ` +
      (worst
        ? `Worst: ${worst.name} @ ${worst.mismatchPercent}%`
        : "no comparable images")
  );
}

main();
