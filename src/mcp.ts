import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { McpServer } from "./config.js";
import { fail, note } from "./util.js";

/**
 * Apply configured MCP servers:
 *  - Claude Code: merged into <project>/.mcp.json
 *  - Codex: upserted into ~/.codex/config.toml (Codex MCP config is global)
 */
export function applyMcps(
  servers: Record<string, McpServer>,
  projectDir: string,
  agents: string[],
): void {
  const claudeServers: Record<string, unknown> = {};
  for (const [name, s] of Object.entries(servers)) {
    const wants = s.agents ?? ["claude", "codex"];
    if (agents.includes("claude") && wants.includes("claude")) {
      claudeServers[name] = toClaudeShape(name, s);
    }
    if (agents.includes("codex") && wants.includes("codex")) {
      upsertCodexMcp(name, s);
    }
  }
  if (Object.keys(claudeServers).length) {
    writeClaudeMcp(projectDir, claudeServers);
  }
}

function toClaudeShape(name: string, s: McpServer): unknown {
  if (s.url) {
    return {
      type: "http",
      url: s.url,
      ...(s.headers && Object.keys(s.headers).length ? { headers: s.headers } : {}),
    };
  }
  if (!s.command) fail(`mcp server "${name}" needs either "command" or "url"`);
  return {
    command: s.command,
    ...(s.args?.length ? { args: s.args } : {}),
    ...(s.env && Object.keys(s.env).length ? { env: s.env } : {}),
  };
}

function writeClaudeMcp(projectDir: string, servers: Record<string, unknown>): void {
  const p = path.join(projectDir, ".mcp.json");
  let doc: { mcpServers?: Record<string, unknown> } = {};
  if (fs.existsSync(p)) {
    try {
      doc = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      fail(`${p} exists but is not valid JSON: ${e instanceof Error ? e.message : e}`);
    }
  }
  doc.mcpServers = { ...(doc.mcpServers ?? {}), ...servers };
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + "\n");
  note(`  wrote: ${p} (${Object.keys(servers).join(", ")})`);
}

export function upsertCodexMcp(name: string, s: McpServer): void {
  if (s.url) {
    note(`  skipped for Codex: ${name} (url-based — Codex config.toml takes stdio servers)`);
    return;
  }
  if (!s.command) {
    note(`  skipped: ${name} has neither "command" nor "url"`);
    return;
  }
  const cfgPath = path.join(os.homedir(), ".codex", "config.toml");
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  let text = fs.existsSync(cfgPath) ? fs.readFileSync(cfgPath, "utf8") : "";

  // Remove any existing [mcp_servers.<name>] section and its subsections.
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = new RegExp(
    String.raw`(^|\n)\[mcp_servers\.(?:${esc}|"${esc}")(?:\.[^\]\n]+)?\][^]*?(?=\n\[|$)`,
    "g",
  );
  text = text.replace(section, "$1").replace(/\n{3,}/g, "\n\n");

  const key = tomlKey(name);
  const lines = [`[mcp_servers.${key}]`, `command = ${tomlStr(s.command)}`];
  if (s.args?.length) lines.push(`args = [${s.args.map(tomlStr).join(", ")}]`);
  if (s.env && Object.keys(s.env).length) {
    lines.push("", `[mcp_servers.${key}.env]`);
    for (const [k, v] of Object.entries(s.env)) lines.push(`${tomlKey(k)} = ${tomlStr(v)}`);
  }

  text = text.trim() ? text.replace(/\s+$/, "\n") + "\n" : "";
  fs.writeFileSync(cfgPath, text + lines.join("\n") + "\n");
  note(`  wrote: ~/.codex/config.toml ([mcp_servers.${key}])`);
}

/** JSON string escaping is a valid TOML basic string. */
function tomlStr(v: string): string {
  return JSON.stringify(v);
}

function tomlKey(k: string): string {
  return /^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k);
}
