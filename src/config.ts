import fs from "node:fs";
import path from "node:path";
import { configDir, fail, note } from "./util.js";

export interface McpServer {
  /** stdio server */
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  /** remote server (Claude Code only — Codex config is stdio-based) */
  url?: string;
  headers?: Record<string, string>;
  /** restrict to a subset of agents; default: all */
  agents?: string[];
}

export interface Config {
  defaults: {
    /** claude | codex | both */
    ai: string;
    /** sh | ps */
    script: string;
    /** where `uvx --from … specify` pulls spec-kit when specify is not on PATH */
    specKit: string;
    /** npm spec used by `csc self update` */
    selfRepo: string;
  };
  /** name -> git URL or local path */
  extensions: Record<string, string>;
  mcp: Record<string, McpServer>;
  hooks: {
    /** shell commands run in the project dir after init */
    postInit: string[];
  };
}

export const DEFAULT_CONFIG: Config = {
  defaults: {
    ai: "claude",
    script: "sh",
    specKit: "git+https://github.com/github/spec-kit.git",
    selfRepo: "github:schwarz-christoph/spec-kit-csc-extension",
  },
  extensions: {
    csc: "https://github.com/schwarz-christoph/spec-kit-csc-extension.git",
    brownfield: "https://github.com/Quratulain-bilal/spec-kit-brownfield/archive/refs/tags/v1.0.0.zip",
    superspec: "https://github.com/WangX0111/superspec.git",
    "agent-assign": "https://github.com/xymelon/spec-kit-agent-assign/archive/refs/tags/v1.0.0.zip",
  },
  mcp: {},
  hooks: {
    postInit: [],
  },
};

export function configPath(): string {
  return path.join(configDir(), "config.json");
}

export function loadConfig(): Config {
  const p = configPath();
  if (!fs.existsSync(p)) {
    saveConfig(DEFAULT_CONFIG);
    note(`created default config: ${p}`);
    return structuredClone(DEFAULT_CONFIG);
  }
  let raw: Partial<Config>;
  try {
    raw = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`config at ${p} is not valid JSON: ${e instanceof Error ? e.message : e}`);
  }
  const base = structuredClone(DEFAULT_CONFIG);
  return {
    ...base,
    ...raw,
    defaults: { ...base.defaults, ...raw.defaults },
    hooks: { ...base.hooks, ...raw.hooks },
    extensions: raw.extensions ?? base.extensions,
    mcp: raw.mcp ?? base.mcp,
  };
}

export function saveConfig(cfg: Config): void {
  fs.mkdirSync(configDir(), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + "\n");
}

export function getPath(obj: unknown, key: string): unknown {
  return key.split(".").reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj: any, key: string, value: unknown): void {
  const keys = key.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof o[k] !== "object" || o[k] === null) o[k] = {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

export function unsetPath(obj: any, key: string): void {
  const keys = key.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    o = o?.[k];
    if (o == null) return;
  }
  delete o[keys[keys.length - 1]];
}
