const fs = require("fs");
const path = require("path");

const PLUGIN_NAME = "csharp-code-calisthenics-reviewer";
const REQUIRED_SKILL_FILES = [
  "SKILL.md",
  path.join("references", "calisthenics-checklist.md"),
  path.join("examples", "input", "OrderService.cs"),
  path.join("examples", "output", "review.md")
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function listFiles(rootPath) {
  const results = [];

  function visit(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, absolutePath);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else {
        results.push(relativePath);
      }
    }
  }

  visit(rootPath);
  return results.sort();
}

function assertRequiredFiles(rootPath) {
  for (const relativePath of REQUIRED_SKILL_FILES) {
    const absolutePath = path.join(rootPath, relativePath);
    if (!fs.existsSync(absolutePath)) {
      fail(`Required skill file is missing: ${absolutePath}`);
    }
  }
}

function copyDir(sourcePath, destinationPath) {
  fs.rmSync(destinationPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function assertParity(sourcePath, destinationPath) {
  const sourceFiles = listFiles(sourcePath);
  const destinationFiles = listFiles(destinationPath);
  const sourceJoined = sourceFiles.join("\n");
  const destinationJoined = destinationFiles.join("\n");

  if (sourceJoined !== destinationJoined) {
    fail("Raw skill and plugin skill file lists differ after build.");
  }

  for (const relativePath of sourceFiles) {
    const sourceContent = fs.readFileSync(path.join(sourcePath, relativePath), "utf8");
    const destinationContent = fs.readFileSync(path.join(destinationPath, relativePath), "utf8");
    if (sourceContent !== destinationContent) {
      fail(`Skill parity mismatch after build: ${relativePath}`);
    }
  }
}

function syncPluginManifest(packageRoot) {
  const packageJsonPath = path.join(packageRoot, "package.json");
  const pluginJsonPath = path.join(packageRoot, "src", "codex-plugin", ".codex-plugin", "plugin.json");
  const packageJson = readJson(packageJsonPath);
  const pluginJson = readJson(pluginJsonPath);

  pluginJson.name = PLUGIN_NAME;
  pluginJson.version = packageJson.version;
  pluginJson.skills = "./skills/";

  writeJson(pluginJsonPath, pluginJson);

  const reloaded = readJson(pluginJsonPath);
  if (reloaded.version !== packageJson.version) {
    fail("Plugin manifest version did not match package.json after synchronization.");
  }
}

function main() {
  const packageRoot = path.resolve(__dirname, "..");
  const rawSkillRoot = path.join(packageRoot, "src", "raw-skill");
  const pluginSkillRoot = path.join(packageRoot, "src", "codex-plugin", "skills", PLUGIN_NAME);

  assertRequiredFiles(rawSkillRoot);
  copyDir(rawSkillRoot, pluginSkillRoot);
  assertParity(rawSkillRoot, pluginSkillRoot);
  syncPluginManifest(packageRoot);

  console.log("Build completed successfully.");
}

main();
