import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = process.env.BASE_PATH ?? "/so-chamar";

execFileSync("npx", ["next", "build"], {
  cwd: raiz,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PAGES: "1", BASE_PATH: base },
});

const saida = path.join(raiz, "out");
fs.writeFileSync(path.join(saida, ".nojekyll"), "");

console.log(`\nSite estático em out/ — servido a partir de ${base || "/"}`);
