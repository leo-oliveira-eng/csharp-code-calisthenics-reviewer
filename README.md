# csharp-code-calisthenics-reviewer

`csharp-code-calisthenics-reviewer` is an npm-distributed Codex plugin package that currently ships one instruction-heavy review skill for analyzing a single C# file or small class against a narrow set of code-calisthenics rules and suggesting a deterministic refactor plan.

The package is plugin-first for Codex installs, and it also includes a raw skill bundle for path-based installs and other tooling. The plugin structure leaves room for additional related skills in future versions without changing the main install surface.

## Included in v1

The first bundled skill checks exactly these 5 rules:

- Only one level of indentation per method
- Avoid `else`
- Wrap primitives in value objects when it makes sense
- First-class collections
- Small methods with intention-revealing names

This first skill is instruction-heavy by design. It does not perform full automatic rewrites by default, but it may include short illustrative snippets when they clarify a proposed refactor.

## Repo layout

```text
src/
  raw-skill/
    SKILL.md
    references/calisthenics-checklist.md
    examples/input/OrderService.cs
    examples/output/review.md
  codex-plugin/
    .codex-plugin/plugin.json
    skills/csharp-code-calisthenics-reviewer/
bin/
  installer.js
scripts/
  build.js
.agents/
  plugins/marketplace.json
```

`src/raw-skill` is the canonical source for the current reviewer skill. `npm run build` mirrors it into the Codex plugin skill folder and synchronizes the plugin manifest version from `package.json`.

## Install

### npm / npx

Build first:

```bash
npm install
npm run build
```

Run from the published package or locally:

```bash
npx csharp-code-calisthenics-reviewer install --target codex --scope personal
npx csharp-code-calisthenics-reviewer install --target codex --scope repo --path /path/to/repo
npx csharp-code-calisthenics-reviewer install --target dir --path /path/to/destination
npx csharp-code-calisthenics-reviewer install --target claude --path /path/to/destination
```

Optional flags:

```bash
--dry-run
--force
```

### Skillfish

Use the raw skill bundle when you want the skill files directly instead of the Codex plugin wrapper:

```bash
npx csharp-code-calisthenics-reviewer install --target dir --path /path/to/skills/csharp-code-calisthenics-reviewer
```

### Codex local plugin install

Personal install:

```bash
npx csharp-code-calisthenics-reviewer install --target codex --scope personal
```

This installs the plugin to `~/.codex/plugins/csharp-code-calisthenics-reviewer` and creates or updates `~/.agents/plugins/marketplace.json`.

Repo install:

```bash
npx csharp-code-calisthenics-reviewer install --target codex --scope repo --path /path/to/repo
```

This installs the plugin to `<repo>/plugins/csharp-code-calisthenics-reviewer` and creates or updates `<repo>/.agents/plugins/marketplace.json`.

### Claude-compatible path copy

```bash
npx csharp-code-calisthenics-reviewer install --target claude --path /path/to/destination
```

This performs an explicit path-based copy only. v1 does not assume or document an official Claude install location.

## Build and verify

```bash
npm run build
python C:/Users/USUARIO/.codex/skills/.system/skill-creator/scripts/quick_validate.py src/raw-skill
npm pack
```

On Windows PowerShell, if `npm pack` is blocked by `npm.ps1` execution policy or by the global npm cache, use:

```powershell
npm run pack:ps
```

## Marketplace metadata

The Codex plugin manifest lives at `src/codex-plugin/.codex-plugin/plugin.json`.

The repository also includes `.agents/plugins/marketplace.json` as a repo-local marketplace catalog entry that points to `./plugins/csharp-code-calisthenics-reviewer`. Installer runs generate or update marketplace entries at the chosen destination without duplicating existing entries.
