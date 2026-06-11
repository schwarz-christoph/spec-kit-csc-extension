import fs from "node:fs";
import path from "node:path";
import { configDir, fail, note } from "./util.js";
export const DEFAULT_CONFIG = {
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
export function configPath() {
    return path.join(configDir(), "config.json");
}
export function loadConfig() {
    const p = configPath();
    if (!fs.existsSync(p)) {
        saveConfig(DEFAULT_CONFIG);
        note(`created default config: ${p}`);
        return structuredClone(DEFAULT_CONFIG);
    }
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(p, "utf8"));
    }
    catch (e) {
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
export function saveConfig(cfg) {
    fs.mkdirSync(configDir(), { recursive: true });
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + "\n");
}
export function getPath(obj, key) {
    return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setPath(obj, key, value) {
    const keys = key.split(".");
    let o = obj;
    for (const k of keys.slice(0, -1)) {
        if (typeof o[k] !== "object" || o[k] === null)
            o[k] = {};
        o = o[k];
    }
    o[keys[keys.length - 1]] = value;
}
export function unsetPath(obj, key) {
    const keys = key.split(".");
    let o = obj;
    for (const k of keys.slice(0, -1)) {
        o = o?.[k];
        if (o == null)
            return;
    }
    delete o[keys[keys.length - 1]];
}
