import fs from "node:fs";
import path from "node:path";
import { installExtension } from "./extensions.js";
import { applyMcps } from "./mcp.js";
import { fail, note, run, which } from "./util.js";
export function resolveAgents(ai) {
    if (ai === "both")
        return ["claude", "codex"];
    if (ai === "claude" || ai === "codex")
        return [ai];
    fail(`ai must be "claude", "codex" or "both" (got "${ai}")`);
}
/** Detect installed agents from project layout, falling back to the configured default. */
export function detectAgents(projectDir, fallback) {
    const found = [];
    if (fs.existsSync(path.join(projectDir, ".claude")))
        found.push("claude");
    if (fs.existsSync(path.join(projectDir, ".codex")))
        found.push("codex");
    return found.length ? found : resolveAgents(fallback);
}
/** Prefer specify on PATH, fall back to uvx pulling spec-kit from git. */
export function specifyCmd(cfg) {
    if (which("specify"))
        return ["specify"];
    if (which("uvx"))
        return ["uvx", "--from", cfg.defaults.specKit, "specify"];
    fail("neither 'specify' nor 'uvx' found — install uv first: https://docs.astral.sh/uv/");
}
export async function cmdInit(opts, cfg) {
    const agents = resolveAgents(opts.ai ?? cfg.defaults.ai);
    const script = opts.script ?? cfg.defaults.script;
    const here = opts.here || opts.project === "." || !opts.project;
    if (!here && !/^[A-Za-z0-9._-]+$/.test(opts.project)) {
        fail(`project name "${opts.project}" contains unsupported characters`);
    }
    const projectDir = here ? process.cwd() : path.resolve(opts.project);
    const specify = specifyCmd(cfg);
    // 1. specify init — first agent creates the project, further agents layer
    //    their command files on top via --here --force.
    const [first, ...rest] = agents;
    note(`\n── specify init (${agents.join(" + ")}) ──`);
    const initCmd = [
        ...specify,
        "init",
        ...(here ? ["--here"] : [opts.project]),
        "--ai",
        first,
        "--script",
        script,
    ];
    if (opts.noGit)
        initCmd.push("--no-git");
    if (opts.force)
        initCmd.push("--force");
    if (opts.ignoreAgentTools)
        initCmd.push("--ignore-agent-tools");
    run(initCmd);
    for (const agent of rest) {
        // --ignore-agent-tools: the agent CLI may live on another machine; the
        // project files should still be generated here.
        run([...specify, "init", "--here", "--force", "--ai", agent, "--script", script, "--no-git", "--ignore-agent-tools"], { cwd: projectDir });
    }
    // 2. extensions
    const extensions = opts.noExt ? {} : { ...cfg.extensions };
    for (const src of opts.extraExtensions)
        extensions[src] = src;
    for (const [name, src] of Object.entries(extensions)) {
        note(`\n── extension: ${name} ──`);
        await installExtension(src, projectDir, agents);
    }
    // 3. MCP servers
    if (!opts.noMcp && Object.keys(cfg.mcp).length) {
        note("\n── MCP servers ──");
        applyMcps(cfg.mcp, projectDir, agents);
    }
    // 4. post-init hooks
    for (const hook of cfg.hooks.postInit) {
        note(`\n── hook: ${hook} ──`);
        run(["bash", "-c", hook], { cwd: projectDir });
    }
    note(`\ndone — project ready at ${projectDir}`);
    if (agents.includes("claude"))
        note("  Claude Code: open the project and run /speckit-grill etc.");
    if (agents.includes("codex"))
        note("  Codex: prompts are available as /speckit-* commands");
}
