// Vice Sunset Cover Studio — make.fun entry program (Node 22, stdlib only).
//
// The app itself is plain static files under app/ (index.html, style.css and
// ES modules, no build step, no network at runtime). This program hands the
// entry in: it copies app/ and screenshots/ beside this file into /output
// and writes /output/dossier.json with the kit's vendored buildDossier.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Local serve: node serve.ts  →  http://localhost:8080
// The grader runs this file twice in a sandbox with no network; both runs
// must write identical bytes, so nothing here reads the clock or randomness.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Gate caps from the competition rules: at most 4 screenshots of 256 KiB,
// app/ within 993 entries and 48 MiB, paths within 1000 bytes, and the
// dossier text capped at 160 KiB. The dossier is byte-identical across runs.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
