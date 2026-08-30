// gauntlet:diff — pixelmatch between gauntlet/out/shots/ and gauntlet/baseline/.
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

  const baselineExists =
    fs.existsSync(BASELINE_DIR) && fs.readdirSync(BASELINE_DIR).length > 0;

  if (!baselineExists) {
    ensureDir(BASELINE_DIR);
    for (const name of existingShots) {
      fs.copyFileSync(path.join(SHOTS_DIR, name), path.join(BASELINE_DIR, name));
    }
    fs.writeFileSync(
      path.join(OUT_DIR, "diff.json"),
      JSON.stringify(
        {
          seeded: true,
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
    const basePath = path.join(BASELINE_DIR, name);

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

  fs.writeFileSync(
    path.join(OUT_DIR, "diff.json"),
    JSON.stringify(
      { seeded: false, threshold: PIXELMATCH_THRESHOLD, images: results },
      null,
      2
    )
  );

  const compared = results.filter((r) => r.mismatchPercent !== null);
  const worst = compared.slice().sort((a, b) => b.mismatchPercent - a.mismatchPercent)[0];
  console.log(
    `gauntlet:diff — compared ${compared.length}/${results.length} images against gauntlet/baseline/. ` +
      (worst
        ? `Worst: ${worst.name} @ ${worst.mismatchPercent}%`
        : "no comparable images")
  );
}

main();
