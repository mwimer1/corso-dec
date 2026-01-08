/* scripts/maintenance/docs/autopublish.ts
 *
 * One-click docs refresh -> commit -> push to main (no-verify), with guardrails.
 * Default: auto fast-forward pull when behind (ff-only).
 */

import { spawnSync } from "node:child_process";

type Args = {
  quiet: boolean;
  yes: boolean;
  dryRun: boolean;
  pull: boolean; // default true
  message: string;
};

const DEFAULT_MESSAGE = "chore(docs): refresh generated docs";

function parseArgs(argv: string[]): Args {
  const args: Args = {
    quiet: false,
    yes: false,
    dryRun: false,
    pull: true, // DEFAULT ON
    message: DEFAULT_MESSAGE,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--quiet") args.quiet = true;
    else if (a === "--yes") args.yes = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--pull") args.pull = true;
    else if (a === "--no-pull") args.pull = false;
    else if (a === "--message") {
      const v = argv[i + 1];
      if (!v) throw new Error("Missing value for --message");
      args.message = v;
      i++;
    }
  }

  return args;
}

function run(cmd: string, cmdArgs: string[], opts: { quiet: boolean; check?: boolean }) {
  const res = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  const stdout = (res.stdout ?? "").toString();
  const stderr = (res.stderr ?? "").toString();

  const check = opts.check ?? true;
  if (check && res.status !== 0) {
    const msg =
      `Command failed: ${cmd} ${cmdArgs.join(" ")}\n` +
      (stdout ? `\nSTDOUT:\n${stdout}\n` : "") +
      (stderr ? `\nSTDERR:\n${stderr}\n` : "");
    throw new Error(msg.trim());
  }

  if (!opts.quiet) {
    if (stdout.trim()) process.stdout.write(stdout);
    if (stderr.trim()) process.stderr.write(stderr);
  }

  return { stdout, stderr, code: res.status ?? 0 };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isAllowedPath(p: string): boolean {
  if (p === "docs/index.ts") return true;
  if (p === "docs/README.md") return true;

  if (!p.endsWith("/README.md")) return false;

  const allowedRoots = ["scripts/", "lib/", "types/", "components/", "styles/", "app/"];
  return allowedRoots.some((root) => p.startsWith(root));
}

type StatusEntry = { x: string; y: string; path: string };

function getStatusPorcelain(quiet: boolean): StatusEntry[] {
  const { stdout } = run("git", ["status", "--porcelain=v1", "-z"], { quiet });
  const parts = stdout.split("\0").filter(Boolean);

  const out: StatusEntry[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith("?? ")) {
      out.push({ x: "?", y: "?", path: part.slice(3) });
      continue;
    }

    const x = part[0] ?? " ";
    const y = part[1] ?? " ";
    const rest = part.slice(3);

    const isRenameOrCopy = x === "R" || y === "R" || x === "C" || y === "C";
    if (isRenameOrCopy) {
      const newPath = parts[i + 1];
      assert(newPath, "Unexpected rename/copy status format from git status -z");
      out.push({ x, y, path: newPath });
      i++;
    } else {
      out.push({ x, y, path: rest });
    }
  }

  return out;
}

function getBranchName(quiet: boolean): string {
  const { stdout } = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { quiet });
  return stdout.trim();
}

function ensureOnMainAndNotDetached() {
  const branch = getBranchName(true);
  assert(branch !== "HEAD", "Detached HEAD. Abort. (Checkout main and try again.)");
  assert(branch === "main", `Current branch is "${branch}". Abort. (Checkout main and try again.)`);
}

function ensureNoStagedChanges() {
  const { stdout } = run("git", ["diff", "--cached", "--name-only"], { quiet: true });
  assert(stdout.trim().length === 0, "You have staged changes. Abort to avoid mixing commits.");
}

function ensureNoNonDocChanges() {
  const status = getStatusPorcelain(true);
  const disallowed = status.filter((e) => !isAllowedPath(e.path));
  assert(
    disallowed.length === 0,
    `Found non-doc changes. Abort.\nDisallowed paths:\n` +
      disallowed.map((d) => `- ${d.path}`).join("\n")
  );
}

function ensureOriginConfigured(args: Args) {
  run("git", ["remote", "get-url", "origin"], { quiet: args.quiet });
}

function fetchOriginMain(args: Args) {
  run("git", ["fetch", "origin", "main", "--quiet"], { quiet: args.quiet });
}

function getBehindAhead(): { behind: number; ahead: number } {
  const { stdout } = run("git", ["rev-list", "--left-right", "--count", "origin/main...main"], { quiet: true });
  const parts = stdout.trim().split(/\s+/);
  return {
    behind: Number(parts[0] ?? "0"),
    ahead: Number(parts[1] ?? "0"),
  };
}

function maybeFastForwardPull(args: Args) {
  fetchOriginMain(args);

  const { behind, ahead } = getBehindAhead();

  // If ahead, we'd push unrelated commits — refuse.
  assert(ahead === 0, `Local main is ahead of origin/main by ${ahead} commit(s). Abort to avoid pushing unrelated commits.`);

  if (behind > 0) {
    if (!args.pull) {
      throw new Error(`Local main is behind origin/main by ${behind} commit(s). Abort. (Re-run without --no-pull to auto fast-forward.)`);
    }

    // Safe sync: fast-forward only.
    run("git", ["pull", "--ff-only", "origin", "main", "--quiet"], { quiet: args.quiet });

    // Re-check after pull
    fetchOriginMain(args);
    const after = getBehindAhead();
    assert(after.behind === 0 && after.ahead === 0, "Unable to fast-forward cleanly to origin/main. Abort.");
  }
}

function runRefreshPipeline(args: Args) {
  run("pnpm", ["docs:index"], { quiet: args.quiet });
  run("pnpm", ["docs:generate:readme"], { quiet: args.quiet });
  run("pnpm", ["docs:generate:directory-readmes"], { quiet: args.quiet });
}

function stageAllowedChanges(args: Args): string[] {
  const status = getStatusPorcelain(true);

  const disallowed = status.filter((e) => !isAllowedPath(e.path));
  assert(
    disallowed.length === 0,
    `Refresh produced non-doc changes. Abort.\nDisallowed paths:\n` +
      disallowed.map((d) => `- ${d.path}`).join("\n")
  );

  const changed = status.map((e) => e.path).filter((p) => p && isAllowedPath(p));
  const unique = Array.from(new Set(changed));
  if (unique.length === 0) return [];

  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    run("git", ["add", "--quiet", "--", ...chunk], { quiet: args.quiet });
  }

  return unique;
}

function commitAndPush(args: Args, stagedPaths: string[]) {
  assert(stagedPaths.length > 0, "No staged docs changes. Nothing to commit.");

  run("git", ["commit", "-m", args.message, "--no-verify", "--quiet"], { quiet: args.quiet });
  run("git", ["push", "origin", "main", "--no-verify", "--quiet"], { quiet: args.quiet });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    if (!args.dryRun) {
      assert(args.yes, "Refusing to auto-publish without --yes. (Use --dry-run to preview.)");
    }

    run("git", ["rev-parse", "--is-inside-work-tree"], { quiet: true });

    ensureOnMainAndNotDetached();
    ensureNoStagedChanges();
    ensureNoNonDocChanges();

    ensureOriginConfigured(args);

    // Default behavior: if behind, fast-forward pull safely.
    maybeFastForwardPull(args);

    // Refresh docs
    runRefreshPipeline(args);

    // Stage allowlisted changes
    const staged = stageAllowedChanges(args);

    if (staged.length === 0) process.exit(0);

    if (args.dryRun) {
      if (!args.quiet) {
        console.log("Dry run: docs changes detected (not committed/pushed):");
        staged.forEach((p) => console.log(`- ${p}`));
      }
      process.exit(0);
    }

    commitAndPush(args, staged);
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`\n[docs autopublish] ERROR:\n${msg}\n`);
    process.exit(1);
  }
}

main();
