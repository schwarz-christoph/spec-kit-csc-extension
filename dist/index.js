#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { configPath, getPath, loadConfig, saveConfig, setPath, unsetPath, } from "./config.js";
import { installExtension } from "./extensions.js";
import { cmdInit, detectAgents, resolveAgents } from "./init.js";
import { applyMcps } from "./mcp.js";
import { CliError, fail, note, parseKv, run } from "./util.js";
const VERSION = "0.1.0";
const USAGE = `csc ${VERSION} — one-command spec-kit bootstrapper for Claude Code and Codex

Usage:
  csc init [name] [options]        specify init + extensions + MCP servers + hooks
    --here                         init into the current directory
    --ai <claude|codex|both>       agent(s) to set up (default: config defaults.ai)
    --script <sh|ps>               script flavour passed to specify (default: sh)
    --ext <url-or-path>            extra extension for this run (repeatable)
    --no-ext                       skip configured extensions
    --no-mcp                       skip configured MCP servers
    --no-git / --force             passed through to specify init
    --ignore-agent-tools           don't require agent CLIs to be installed

  csc add <name|url|path> [opts]   install one extension into an existing project
    --project <dir>                target project (default: cwd)
    --ai <claude|codex|both>       default: auto-detected from .claude/.codex dirs

  csc ext list                     show configured extensions
  csc ext add <name> <url|path>    add an extension to the config
  csc ext remove <name>            remove an extension from the config

  csc mcp list                     show configured MCP servers
  csc mcp add <name> [opts]        add/update an MCP server in the config
    --command <cmd>                stdio server command
    --arg <value>                  command argument (repeatable)
    --env <K=V>                    environment variable (repeatable)
    --url <url>                    remote server URL (Claude Code only)
    --header <K=V>                 HTTP header for url servers (repeatable)
    --agents <claude,codex>        restrict server to specific agents
    --apply                        also apply to the current project now
  csc mcp remove <name>            remove an MCP server from the config
  csc mcp apply [--project <dir>]  write configured servers into a project

  csc config list|path|edit        show config / print path / open in $EDITOR
  csc config get|set|unset <key>   dotted keys, e.g. defaults.ai, hooks.postInit

  csc self update                  reinstall the CLI from its git repo
  csc --version | --help

Config file: ~/.config/csc/config.json — every value can also be overridden
per-invocation with the flags above.`;
function parse(argv, spec) {
    const flags = {};
    const pos = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--") {
            pos.push(...argv.slice(i + 1));
            break;
        }
        if (a.startsWith("--")) {
            let name = a.slice(2);
            let inline;
            const eq = name.indexOf("=");
            if (eq >= 0) {
                inline = name.slice(eq + 1);
                name = name.slice(0, eq);
            }
            const kind = spec[name];
            if (!kind)
                fail(`unknown flag --${name} (see csc --help)`);
            if (kind === "bool") {
                flags[name] = true;
            }
            else {
                const v = inline ?? argv[++i];
                if (v === undefined)
                    fail(`--${name} expects a value`);
                if (kind === "multi")
                    (flags[name] ??= []).push(v);
                else
                    flags[name] = v;
            }
        }
        else {
            pos.push(a);
        }
    }
    return { flags, pos };
}
function requireProjectDir(dir) {
    if (!fs.existsSync(dir))
        fail(`no such directory: ${dir}`);
    return dir;
}
async function main() {
    const argv = process.argv.slice(2);
    const cmd = argv[0];
    if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
        console.log(USAGE);
        return;
    }
    if (cmd === "--version" || cmd === "-V") {
        console.log(VERSION);
        return;
    }
    switch (cmd) {
        case "init": {
            const { flags, pos } = parse(argv.slice(1), {
                here: "bool",
                ai: "value",
                script: "value",
                ext: "multi",
                "no-ext": "bool",
                "no-mcp": "bool",
                "no-git": "bool",
                force: "bool",
                "ignore-agent-tools": "bool",
            });
            await cmdInit({
                project: pos[0],
                here: !!flags.here,
                ai: flags.ai,
                script: flags.script,
                noGit: !!flags["no-git"],
                force: !!flags.force,
                ignoreAgentTools: !!flags["ignore-agent-tools"],
                noExt: !!flags["no-ext"],
                noMcp: !!flags["no-mcp"],
                extraExtensions: flags.ext ?? [],
            }, loadConfig());
            return;
        }
        case "add": {
            const { flags, pos } = parse(argv.slice(1), { project: "value", ai: "value" });
            const what = pos[0] ?? fail("usage: csc add <name|url|path>");
            const cfg = loadConfig();
            const projectDir = requireProjectDir(flags.project ?? process.cwd());
            if (!fs.existsSync(`${projectDir}/.specify`)) {
                note(`note: ${projectDir} has no .specify/ — not a spec-kit project? Installing anyway.`);
            }
            const agents = flags.ai
                ? resolveAgents(flags.ai)
                : detectAgents(projectDir, cfg.defaults.ai);
            const source = cfg.extensions[what] ?? what;
            await installExtension(source, projectDir, agents);
            return;
        }
        case "ext": {
            const sub = argv[1];
            const cfg = loadConfig();
            if (sub === "list" || sub === undefined) {
                for (const [name, src] of Object.entries(cfg.extensions))
                    note(`${name}\t${src}`);
                if (!Object.keys(cfg.extensions).length)
                    note("(no extensions configured)");
                return;
            }
            if (sub === "add") {
                const [name, src] = [argv[2], argv[3]];
                if (!name || !src)
                    fail("usage: csc ext add <name> <url|path>");
                cfg.extensions[name] = src;
                saveConfig(cfg);
                note(`added extension "${name}" -> ${src}`);
                return;
            }
            if (sub === "remove") {
                const name = argv[2] ?? fail("usage: csc ext remove <name>");
                if (!(name in cfg.extensions))
                    fail(`no extension named "${name}" in config`);
                delete cfg.extensions[name];
                saveConfig(cfg);
                note(`removed extension "${name}"`);
                return;
            }
            fail(`unknown subcommand: csc ext ${sub}`);
        }
        case "mcp": {
            const sub = argv[1];
            const cfg = loadConfig();
            if (sub === "list" || sub === undefined) {
                for (const [name, s] of Object.entries(cfg.mcp)) {
                    const target = s.url ? s.url : [s.command, ...(s.args ?? [])].join(" ");
                    note(`${name}\t${target}\t[${(s.agents ?? ["claude", "codex"]).join(", ")}]`);
                }
                if (!Object.keys(cfg.mcp).length)
                    note("(no MCP servers configured)");
                return;
            }
            if (sub === "add") {
                const { flags, pos } = parse(argv.slice(2), {
                    command: "value",
                    arg: "multi",
                    env: "multi",
                    url: "value",
                    header: "multi",
                    agents: "value",
                    apply: "bool",
                    project: "value",
                });
                const name = pos[0] ?? fail("usage: csc mcp add <name> --command … | --url …");
                if (!flags.command && !flags.url)
                    fail("mcp add needs --command or --url");
                const server = {};
                if (flags.command)
                    server.command = flags.command;
                if (flags.arg?.length)
                    server.args = flags.arg;
                if (flags.env?.length) {
                    server.env = Object.fromEntries(flags.env.map((e) => parseKv(e, "--env")));
                }
                if (flags.url)
                    server.url = flags.url;
                if (flags.header?.length) {
                    server.headers = Object.fromEntries(flags.header.map((h) => parseKv(h, "--header")));
                }
                if (flags.agents) {
                    server.agents = flags.agents.split(",").map((a) => a.trim());
                    for (const a of server.agents) {
                        if (a !== "claude" && a !== "codex")
                            fail(`--agents accepts claude,codex (got "${a}")`);
                    }
                }
                cfg.mcp[name] = server;
                saveConfig(cfg);
                note(`saved MCP server "${name}"`);
                if (flags.apply) {
                    const projectDir = requireProjectDir(flags.project ?? process.cwd());
                    applyMcps({ [name]: server }, projectDir, detectAgents(projectDir, cfg.defaults.ai));
                }
                return;
            }
            if (sub === "remove") {
                const name = argv[2] ?? fail("usage: csc mcp remove <name>");
                if (!(name in cfg.mcp))
                    fail(`no MCP server named "${name}" in config`);
                delete cfg.mcp[name];
                saveConfig(cfg);
                note(`removed MCP server "${name}" from config (project .mcp.json / ~/.codex/config.toml left untouched)`);
                return;
            }
            if (sub === "apply") {
                const { flags } = parse(argv.slice(2), { project: "value", ai: "value" });
                const projectDir = requireProjectDir(flags.project ?? process.cwd());
                if (!Object.keys(cfg.mcp).length)
                    fail("no MCP servers configured — add one with: csc mcp add");
                const agents = flags.ai
                    ? resolveAgents(flags.ai)
                    : detectAgents(projectDir, cfg.defaults.ai);
                applyMcps(cfg.mcp, projectDir, agents);
                return;
            }
            fail(`unknown subcommand: csc mcp ${sub}`);
        }
        case "config": {
            const sub = argv[1] ?? "list";
            const cfg = loadConfig();
            if (sub === "list") {
                console.log(JSON.stringify(cfg, null, 2));
                return;
            }
            if (sub === "path") {
                console.log(configPath());
                return;
            }
            if (sub === "edit") {
                const editor = process.env.EDITOR || process.env.VISUAL || "vi";
                spawnSync(editor, [configPath()], { stdio: "inherit" });
                return;
            }
            if (sub === "get") {
                const key = argv[2] ?? fail("usage: csc config get <dotted.key>");
                const v = getPath(cfg, key);
                if (v === undefined)
                    fail(`no such key: ${key}`);
                console.log(typeof v === "string" ? v : JSON.stringify(v, null, 2));
                return;
            }
            if (sub === "set") {
                const key = argv[2];
                const raw = argv[3];
                if (!key || raw === undefined)
                    fail('usage: csc config set <dotted.key> <value> (JSON or string)');
                let value = raw;
                try {
                    value = JSON.parse(raw);
                }
                catch {
                    /* keep as plain string */
                }
                setPath(cfg, key, value);
                saveConfig(cfg);
                note(`set ${key} = ${JSON.stringify(value)}`);
                return;
            }
            if (sub === "unset") {
                const key = argv[2] ?? fail("usage: csc config unset <dotted.key>");
                unsetPath(cfg, key);
                saveConfig(cfg);
                note(`unset ${key}`);
                return;
            }
            fail(`unknown subcommand: csc config ${sub}`);
        }
        case "self": {
            if (argv[1] !== "update")
                fail("usage: csc self update");
            const cfg = loadConfig();
            run(["npm", "install", "-g", cfg.defaults.selfRepo]);
            return;
        }
        default:
            fail(`unknown command: ${cmd} (see csc --help)`);
    }
}
main().catch((e) => {
    if (e instanceof CliError) {
        console.error(`error: ${e.message}`);
        process.exit(1);
    }
    throw e;
});
