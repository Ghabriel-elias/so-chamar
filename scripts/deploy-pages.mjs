import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const saida = path.join(raiz, "out");
const ramo = "gh-pages";

const git = (...args) =>
  execFileSync("git", args, { cwd: raiz, stdio: "inherit" });

execFileSync("node", [path.join(raiz, "scripts", "build-pages.mjs")], {
  cwd: raiz,
  stdio: "inherit",
});

if (!fs.existsSync(path.join(saida, "index.html"))) {
  console.error("out/index.html não existe — o build falhou.");
  process.exit(1);
}

const temp = fs.mkdtempSync(path.join(raiz, ".pages-"));

try {
  git("worktree", "add", "--detach", temp);
  execFileSync("git", ["checkout", "--orphan", ramo], {
    cwd: temp,
    stdio: "inherit",
  });
  execFileSync("git", ["rm", "-rf", "--quiet", "."], {
    cwd: temp,
    stdio: "inherit",
  });

  fs.cpSync(saida, temp, { recursive: true });

  execFileSync("git", ["add", "-A"], { cwd: temp, stdio: "inherit" });
  execFileSync("git", ["commit", "-m", "Publica a demonstração"], {
    cwd: temp,
    stdio: "inherit",
  });
  execFileSync("git", ["push", "--force", "origin", `HEAD:${ramo}`], {
    cwd: temp,
    stdio: "inherit",
  });
} finally {
  git("worktree", "remove", "--force", temp);
}

console.log(`\nPublicado no ramo ${ramo}.`);
