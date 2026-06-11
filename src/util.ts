import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

export class CliError extends Error {}

export function fail(msg: string): never {
  throw new CliError(msg);
}

export function note(msg: string): void {
  console.log(msg);
}

export function run(cmd: string[], opts: { cwd?: string; quiet?: boolean } = {}): void {
  if (!opts.quiet) console.log(`$ ${cmd.join(" ")}`);
  const r = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit", cwd: opts.cwd });
  if (r.error) fail(`failed to run ${cmd[0]}: ${r.error.message}`);
  if (r.status !== 0) fail(`${cmd[0]} exited with status ${r.status}`);
}

export function which(bin: string): boolean {
  const probe = process.platform === "win32" ? "where" : "which";
  return spawnSync(probe, [bin], { stdio: "ignore" }).status === 0;
}

export function configDir(): string {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "csc");
}

export function expandHome(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

export function parseKv(s: string, flag: string): [string, string] {
  const i = s.indexOf("=");
  if (i < 1) fail(`${flag} expects KEY=VALUE, got "${s}"`);
  return [s.slice(0, i), s.slice(i + 1)];
}
