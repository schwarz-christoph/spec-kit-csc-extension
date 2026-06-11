import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expandHome, fail, note, run, which } from "./util.js";
/**
 * Install a spec-kit extension into a project. Sources can be a local path,
 * a git URL, or a zip archive URL (e.g. GitHub release/tag archives).
 */
export async function installExtension(source, projectDir, agents) {
    const { dir, cleanup } = await resolveSource(source);
    try {
        const root = findExtensionRoot(dir);
        const manifest = readManifest(root);
        if (!fs.existsSync(path.join(root, "extension.yml"))) {
            note(`  note: no extension.yml in ${source} — using directory layout as-is`);
        }
        const commands = collectCommands(root, manifest);
        const skills = collectSkills(root, manifest, source);
        if (!commands.length && !skills.length) {
            note(`  warning: ${source} has no commands or skills — nothing to install`);
            return;
        }
        if (agents.includes("claude")) {
            const cmdDest = path.join(projectDir, ".claude", "commands");
            if (commands.length)
                fs.mkdirSync(cmdDest, { recursive: true });
            for (const c of commands) {
                fs.copyFileSync(c.src, path.join(cmdDest, `${c.name}.md`));
                note(`  installed: .claude/commands/${c.name}.md`);
            }
            for (const s of skills) {
                installSkill(s, path.join(projectDir, ".claude", "skills"));
                note(`  installed: .claude/skills/${s.name}/`);
            }
        }
        if (agents.includes("codex")) {
            // Current spec-kit uses the cross-agent .agents/skills layout, which
            // Codex reads natively: skills are copied through, plain commands are
            // wrapped into SKILL.md entries. Older layouts fall back to
            // .codex/prompts in the project, then to the global ~/.codex/prompts.
            const agentsSkills = path.join(projectDir, ".agents", "skills");
            if (fs.existsSync(agentsSkills)) {
                const skillNames = new Set(skills.map((s) => s.name));
                for (const s of skills) {
                    installSkill(s, agentsSkills);
                    note(`  installed: .agents/skills/${s.name}/`);
                }
                for (const c of commands) {
                    if (skillNames.has(c.name))
                        continue; // skill of the same name covers it
                    const dest = path.join(agentsSkills, c.name);
                    fs.mkdirSync(dest, { recursive: true });
                    fs.writeFileSync(path.join(dest, "SKILL.md"), commandAsSkill(c));
                    note(`  installed: .agents/skills/${c.name}/ (wrapped command)`);
                }
            }
            else if (commands.length) {
                const inProject = fs.existsSync(path.join(projectDir, ".codex"));
                const dest = inProject
                    ? path.join(projectDir, ".codex", "prompts")
                    : path.join(os.homedir(), ".codex", "prompts");
                fs.mkdirSync(dest, { recursive: true });
                for (const c of commands) {
                    fs.copyFileSync(c.src, path.join(dest, `${c.name}.md`));
                    note(`  installed: ${inProject ? `.codex/prompts/${c.name}.md` : path.join(dest, `${c.name}.md`)}`);
                }
            }
        }
        installTemplates(root, manifest, projectDir);
    }
    finally {
        cleanup();
    }
}
async function resolveSource(source) {
    const local = expandHome(source);
    if (fs.existsSync(local) && fs.statSync(local).isDirectory()) {
        return { dir: path.resolve(local), cleanup: () => { } };
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "csc-ext-"));
    const cleanup = () => fs.rmSync(tmp, { recursive: true, force: true });
    try {
        if (/\.zip(\?|#|$)/.test(source)) {
            if (!which("unzip"))
                fail("zip extensions need 'unzip' on PATH");
            const zipFile = path.join(tmp, "ext.zip");
            note(`  downloading: ${source}`);
            const res = await fetch(source);
            if (!res.ok)
                fail(`download failed (${res.status} ${res.statusText}): ${source}`);
            fs.writeFileSync(zipFile, Buffer.from(await res.arrayBuffer()));
            const extracted = path.join(tmp, "ext");
            fs.mkdirSync(extracted);
            const r = spawnSync("unzip", ["-q", zipFile, "-d", extracted], { stdio: "inherit" });
            if (r.status !== 0)
                fail(`unzip failed for ${source}`);
            return { dir: extracted, cleanup };
        }
        run(["git", "clone", "--depth", "1", source, tmp]);
        return { dir: tmp, cleanup };
    }
    catch (e) {
        cleanup();
        throw e;
    }
}
/** GitHub archives wrap everything in <repo>-<tag>/ — descend into it. */
function findExtensionRoot(dir) {
    const qualifies = (d) => ["extension.yml", "commands", "skills", "SKILL.md"].some((f) => fs.existsSync(path.join(d, f)));
    if (qualifies(dir))
        return dir;
    const subdirs = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith("."));
    if (subdirs.length === 1 && qualifies(path.join(dir, subdirs[0].name))) {
        return path.join(dir, subdirs[0].name);
    }
    return dir;
}
/**
 * Minimal extension.yml reader. Pulls the extension id plus the
 * provides.commands / provides.templates list items — enough for the
 * manifests in the wild without a YAML dependency.
 */
function readManifest(root) {
    const manifest = { commands: [], templates: [] };
    const p = path.join(root, "extension.yml");
    if (!fs.existsSync(p))
        return manifest;
    const text = fs.readFileSync(p, "utf8");
    const id = text.match(/^\s+id:\s*["']?([\w.-]+)["']?\s*$/m);
    if (id)
        manifest.id = id[1];
    let item = null;
    const items = [];
    for (const line of text.split("\n")) {
        const start = line.match(/^\s*-\s+([\w-]+):\s*(.*)$/);
        if (start) {
            item = { [start[1]]: unquote(start[2]) };
            items.push(item);
            continue;
        }
        const kv = line.match(/^\s+([\w-]+):\s*(.+)$/);
        if (kv && item) {
            if (!(kv[1] in item))
                item[kv[1]] = unquote(kv[2]);
            continue;
        }
        if (/^\S/.test(line))
            item = null; // new top-level section
    }
    for (const it of items) {
        if (it.name && it.file && it.file.endsWith(".md")) {
            manifest.commands.push({ name: it.name, file: it.file, description: it.description });
        }
        else if (!it.name && it.file && /(^|\/)templates\//.test(it.file)) {
            manifest.templates.push(it.file);
        }
    }
    return manifest;
}
function unquote(s) {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1);
    }
    return t;
}
function collectCommands(root, manifest) {
    if (manifest.commands.length) {
        const out = [];
        for (const c of manifest.commands) {
            const src = path.join(root, c.file);
            if (!fs.existsSync(src)) {
                note(`  warning: manifest lists ${c.file} but it does not exist — skipped`);
                continue;
            }
            out.push({ name: c.name, src, description: c.description });
        }
        return out;
    }
    const dir = path.join(root, "commands");
    if (!fs.existsSync(dir))
        return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .map((f) => ({ name: f.replace(/\.md$/, ""), src: path.join(dir, f) }));
}
function collectSkills(root, manifest, source) {
    const out = [];
    const skillsDir = path.join(root, "skills");
    if (fs.existsSync(skillsDir)) {
        for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
            if (entry.isDirectory())
                out.push({ name: entry.name, srcDir: path.join(skillsDir, entry.name) });
        }
    }
    const rootSkill = path.join(root, "SKILL.md");
    if (fs.existsSync(rootSkill)) {
        const name = manifest.id ?? path.basename(source, path.extname(source)).replace(/[^\w-]/g, "-");
        const references = path.join(root, "references");
        out.push({
            name,
            rootSkill: {
                skillMd: rootSkill,
                references: fs.existsSync(references) ? references : undefined,
            },
        });
    }
    return out;
}
function installSkill(skill, destBase) {
    const dest = path.join(destBase, skill.name);
    if (skill.srcDir) {
        fs.cpSync(skill.srcDir, dest, { recursive: true });
        return;
    }
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(skill.rootSkill.skillMd, path.join(dest, "SKILL.md"));
    if (skill.rootSkill.references) {
        fs.cpSync(skill.rootSkill.references, path.join(dest, "references"), { recursive: true });
    }
}
/** Wrap a plain command prompt into the SKILL.md format Codex understands. */
function commandAsSkill(c) {
    const text = fs.readFileSync(c.src, "utf8");
    let body = text;
    let description = c.description;
    const fm = text.match(/^---\n([^]*?)\n---\n?/);
    if (fm) {
        body = text.slice(fm[0].length);
        if (!description) {
            const d = fm[1].match(/^description:\s*(.+)$/m);
            if (d)
                description = unquote(d[1]);
        }
    }
    description ??= `Command ${c.name} installed by csc`;
    return `---\nname: ${JSON.stringify(c.name)}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}`;
}
function installTemplates(root, manifest, projectDir) {
    if (!manifest.templates.length)
        return;
    const specify = path.join(projectDir, ".specify");
    if (!fs.existsSync(specify)) {
        note("  note: extension provides templates but project has no .specify/ — skipped");
        return;
    }
    const dest = path.join(specify, "templates");
    fs.mkdirSync(dest, { recursive: true });
    for (const t of manifest.templates) {
        const src = path.join(root, t);
        if (!fs.existsSync(src)) {
            note(`  warning: manifest lists ${t} but it does not exist — skipped`);
            continue;
        }
        const target = path.join(dest, path.basename(t));
        const overwrote = fs.existsSync(target);
        fs.copyFileSync(src, target);
        note(`  installed: .specify/templates/${path.basename(t)}${overwrote ? " (replaced existing)" : ""}`);
    }
}
