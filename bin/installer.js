#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const PLUGIN_NAME = "csharp-code-calisthenics-reviewer";
const DEFAULT_ENTRY = {
  name: PLUGIN_NAME,
  source: {
    source: "local",
    path: `./plugins/${PLUGIN_NAME}`
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL"
  },
  category: "Productivity"
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    command: null,
    target: null,
    scope: null,
    path: null,
    force: false,
    dryRun: false
  };

  const tokens = [...argv];
  if (tokens.length > 0 && !tokens[0].startsWith("--")) {
    parsed.command = tokens.shift();
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    switch (token) {
      case "--target":
        parsed.target = tokens[++index];
        break;
      case "--scope":
        parsed.scope = tokens[++index];
        break;
      case "--path":
        parsed.path = tokens[++index];
        break;
      case "--force":
        parsed.force = true;
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      default:
        fail(`Unknown argument: ${token}`);
    }
  }

  return parsed;
}

function resolvePackageRoot() {
  return path.resolve(__dirname, "..");
}

function ensureExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    fail(`${label} not found: ${targetPath}. Run "npm run build" before installing.`);
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value, dryRun) {
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  if (dryRun) {
    console.log(`[dry-run] write ${filePath}`);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, payload, "utf8");
}

function removeDir(targetPath, dryRun) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] remove ${targetPath}`);
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function listFiles(rootPath) {
  const results = [];

  function visit(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else {
        results.push(path.relative(rootPath, absolutePath));
      }
    }
  }

  visit(rootPath);
  return results.sort();
}

function directoriesMatch(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath) || !fs.existsSync(destinationPath)) {
    return false;
  }

  const sourceFiles = listFiles(sourcePath);
  const destinationFiles = listFiles(destinationPath);
  if (sourceFiles.length !== destinationFiles.length) {
    return false;
  }

  for (let index = 0; index < sourceFiles.length; index += 1) {
    if (sourceFiles[index] !== destinationFiles[index]) {
      return false;
    }

    const sourceContent = fs.readFileSync(path.join(sourcePath, sourceFiles[index]), "utf8");
    const destinationContent = fs.readFileSync(path.join(destinationPath, destinationFiles[index]), "utf8");
    if (sourceContent !== destinationContent) {
      return false;
    }
  }

  return true;
}

function copyDir(sourcePath, destinationPath, options) {
  const { dryRun } = options;
  if (dryRun) {
    console.log(`[dry-run] copy ${sourcePath} -> ${destinationPath}`);
    return;
  }

  fs.mkdirSync(destinationPath, { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function copyIntoDestination(sourcePath, destinationPath, options) {
  const { force, dryRun } = options;
  const destinationExists = fs.existsSync(destinationPath);

  if (destinationExists && !force) {
    if (directoriesMatch(sourcePath, destinationPath)) {
      console.log(`Destination already matches source: ${destinationPath}`);
      return "unchanged";
    }

    fail(`Destination already exists and differs: ${destinationPath}. Re-run with --force to overwrite.`);
  }

  if (destinationExists) {
    removeDir(destinationPath, dryRun);
  }

  copyDir(sourcePath, destinationPath, options);
  return dryRun ? "dry-run" : "copied";
}

function ensureMarketplaceShape(marketplace) {
  const next = marketplace ?? {};
  if (typeof next.name !== "string") {
    next.name = "local-marketplace";
  }

  if (!next.interface || typeof next.interface !== "object") {
    next.interface = { displayName: "Local Plugins" };
  }

  if (typeof next.interface.displayName !== "string") {
    next.interface.displayName = "Local Plugins";
  }

  if (!Array.isArray(next.plugins)) {
    next.plugins = [];
  }

  return next;
}

function updateMarketplace(marketplacePath, entry, dryRun) {
  const marketplace = ensureMarketplaceShape(readJson(marketplacePath, null));
  const existingIndex = marketplace.plugins.findIndex((plugin) => plugin.name === entry.name);

  if (existingIndex >= 0) {
    marketplace.plugins[existingIndex] = entry;
  } else {
    marketplace.plugins.push(entry);
  }

  writeJson(marketplacePath, marketplace, dryRun);
}

function installCodex(scope, repoPath, options) {
  const packageRoot = resolvePackageRoot();
  const pluginSource = path.join(packageRoot, "src", "codex-plugin");
  ensureExists(pluginSource, "Built Codex plugin");

  let pluginDestination;
  let marketplacePath;
  let entry;

  if (scope === "personal") {
    const homeDir = os.homedir();
    pluginDestination = path.join(homeDir, ".codex", "plugins", PLUGIN_NAME);
    marketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
    entry = {
      ...DEFAULT_ENTRY,
      source: {
        source: "local",
        path: pluginDestination
      }
    };
  } else if (scope === "repo") {
    if (!repoPath) {
      fail('Missing required "--path" for repo-scoped Codex install.');
    }

    const repoRoot = path.resolve(repoPath);
    pluginDestination = path.join(repoRoot, "plugins", PLUGIN_NAME);
    marketplacePath = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
    entry = { ...DEFAULT_ENTRY };
  } else {
    fail('Codex installs require "--scope personal" or "--scope repo".');
  }

  const status = copyIntoDestination(pluginSource, pluginDestination, options);
  updateMarketplace(marketplacePath, entry, options.dryRun);

  if (status === "dry-run") {
    console.log(`Dry-run completed for Codex plugin destination ${pluginDestination}`);
  } else if (status === "unchanged") {
    console.log(`Codex plugin already up to date at ${pluginDestination}`);
  } else {
    console.log(`Installed Codex plugin to ${pluginDestination}`);
  }

  console.log(`${options.dryRun ? "Dry-run updated" : "Updated"} marketplace at ${marketplacePath}`);
}

function installRawSkill(targetPath, options, label) {
  const packageRoot = resolvePackageRoot();
  const rawSkillSource = path.join(packageRoot, "src", "raw-skill");
  ensureExists(rawSkillSource, "Raw skill bundle");

  if (!targetPath) {
    fail('Missing required "--path" for this install target.');
  }

  const destination = path.resolve(targetPath);
  const status = copyIntoDestination(rawSkillSource, destination, options);
  if (status === "dry-run") {
    console.log(`Dry-run completed for ${label} destination ${destination}`);
    return;
  }

  if (status === "unchanged") {
    console.log(`${label} bundle already up to date at ${destination}`);
    return;
  }

  console.log(`Installed ${label} bundle to ${destination}`);
}

function printUsageAndExit() {
  const lines = [
    "Usage:",
    "  csharp-code-calisthenics-reviewer install --target codex --scope personal [--force] [--dry-run]",
    "  csharp-code-calisthenics-reviewer install --target codex --scope repo --path <repo-root> [--force] [--dry-run]",
    "  csharp-code-calisthenics-reviewer install --target dir --path <destination> [--force] [--dry-run]",
    "  csharp-code-calisthenics-reviewer install --target claude --path <destination> [--force] [--dry-run]"
  ];

  console.log(lines.join("\n"));
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.command !== "install" || !args.target) {
    printUsageAndExit();
  }

  const options = { force: args.force, dryRun: args.dryRun };

  switch (args.target) {
    case "codex":
      installCodex(args.scope, args.path, options);
      break;
    case "dir":
      installRawSkill(args.path, options, "raw skill");
      break;
    case "claude":
      installRawSkill(args.path, options, "Claude-compatible");
      break;
    default:
      fail(`Unsupported target: ${args.target}`);
  }
}

main();
