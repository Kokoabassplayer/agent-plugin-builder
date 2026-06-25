import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { detectTargets, installAgentPluginBuilder, normalizeTargets, parseInstallArgs } from '../../installer/src/install.mjs';

export function normalizePluginName(input) {
  const name = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (!name) throw new Error('Plugin name must include at least one letter or digit.');
  if (name.length > 64) throw new Error('Plugin name must be 64 characters or fewer.');
  return name;
}

export async function createPluginProject(options) {
  const name = normalizePluginName(options.name);
  const description = options.description || `Cross-harness AI plugin for ${name}.`;
  const root = path.join(options.directory || process.cwd(), name);
  const files = projectFiles({ name, description });
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return { name, root, files: Object.keys(files) };
}

function projectFiles({ name, description }) {
  return {
    'README.md': readme({ name, description }),
    'LICENSE': mitLicense(),
    'package.json': json({
      name: `@${name}/install`,
      version: '0.1.0',
      description,
      type: 'module',
      license: 'MIT',
      bin: { [`${name}-install`]: './packages/installer/bin/install.mjs' },
      scripts: { test: 'node --test test/*.test.mjs', 'install:dry-run': 'node packages/installer/bin/install.mjs --target all --dry-run --yes' },
      files: ['skills/', 'packages/', 'adapters/', 'installers/', 'docs/', 'README.md', 'LICENSE'],
      engines: { node: '>=20' },
    }),
    [`skills/${name}/SKILL.md`]: skill({ name, description }),
    [`skills/${name}/agents/openai.yaml`]: `interface:\n  display_name: "${titleCase(name)}"\n  short_description: "${description}"\n  default_prompt: "Use $${name} to help with this task."\n`,
    'packages/cli/src/index.mjs': cliSource({ name }),
    'packages/cli/bin/cli.mjs': `#!/usr/bin/env node\nimport { runCli } from '../src/index.mjs';\nrunCli().catch((error) => { console.error(error.message); process.exitCode = 1; });\n`,
    'packages/installer/src/install.mjs': installerSource({ name }),
    'packages/installer/bin/install.mjs': `#!/usr/bin/env node\nimport { runInstaller } from '../src/install.mjs';\nrunInstaller().catch((error) => { console.error(error.message); process.exitCode = 1; });\n`,
    'adapters/claude-code/.claude-plugin/plugin.json': json({ name, description, version: '0.1.0', license: 'MIT' }),
    'adapters/claude-code/ADAPTER.md': adapter('Claude Code', `Install as a plugin with skills under the plugin root.`),
    'adapters/codex/ADAPTER.md': adapter('Codex', `Install skills into $CODEX_HOME/skills or ~/.codex/skills.`),
    'adapters/openclaw/ADAPTER.md': adapter('OpenClaw', `Install skills into ~/.openclaw/skills or a workspace skill root.`),
    'adapters/gemini-cli/ADAPTER.md': adapter('Gemini CLI', `Install skills plus a GEMINI.md context file.`),
    'adapters/generic/ADAPTER.md': adapter('Generic Agent Skills', `Install plain Agent Skills into ~/.agents/skills.`),
    'installers/install.sh': shellInstaller(),
    'installers/install.ps1': powerShellInstaller(),
    'docs/index.html': docsHtml({ name, description }),
    'docs/styles.css': docsCss(),
    'test/scaffold.test.mjs': scaffoldTest({ name }),
  };
}

function skill({ name, description }) {
  return `---\nname: ${name}\ndescription: "${description} Use when the user asks for ${name} workflows, tool help, or project-specific automation."\n---\n\n# ${titleCase(name)}\n\n## Overview\n\n${description}\n\n## Core Workflow\n\n1. Clarify the user's target outcome.\n2. Inspect available project files and tools.\n3. Use bundled scripts when they make the work more reliable.\n4. Verify outputs before claiming completion.\n\n## Bundled Resources\n\n- scripts/: add deterministic helper scripts here when repeated code would be error-prone.\n- references/: add detailed domain notes here and load them only when needed.\n- assets/: add reusable output templates or static assets here.\n`;
}

function readme({ name, description }) {
  return `# ${titleCase(name)}\n\n${description}\n\n## How To Use\n\nInstall from GitHub during development:\n\n\`\`\`bash\nnpx github:<owner>/${name}\n\`\`\`\n\nOr install from npm after publishing:\n\n\`\`\`bash\nnpx @${name}/install@latest\n\`\`\`\n\nFrom a local checkout, install the skill into your target harness:\n\n\`\`\`bash\nnode packages/installer/bin/install.mjs --target codex\nnode packages/installer/bin/install.mjs --target claude-code\nnode packages/installer/bin/install.mjs --target openclaw\nnode packages/installer/bin/install.mjs --target gemini-cli\nnode packages/installer/bin/install.mjs --target generic\n\`\`\`\n\nThen start your agent and ask it to use the skill:\n\n\`\`\`text\nUse $${name} to help with this workflow.\n\`\`\`\n\n## Structure\n\n\`\`\`text\nskills/\npackages/cli/\npackages/installer/\nadapters/\ninstallers/\ndocs/\ntest/\n\`\`\`\n\n## Test\n\n\`\`\`bash\nnpm test\n\`\`\`\n`;
}

function cliSource({ name }) {
  return `export async function runCli(argv = process.argv.slice(2)) {\n  const [command] = argv;\n  if (!command || command === '--help') {\n    console.log('${name} CLI');\n    return { help: true };\n  }\n  throw new Error('Unknown command: ' + command);\n}\n`;
}

function installerSource({ name }) {
  return `import { cp, mkdir } from 'node:fs/promises';\nimport os from 'node:os';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nexport function targetRoot(target, home = os.homedir()) {\n  if (target === 'codex') return path.join(home, '.codex', 'skills');\n  if (target === 'claude-code') return path.join(home, '.claude', 'skills', '${name}', 'skills');\n  if (target === 'openclaw') return path.join(home, '.openclaw', 'skills');\n  if (target === 'gemini-cli') return path.join(home, '.gemini', '${name}', 'skills');\n  return path.join(home, '.agents', 'skills');\n}\n\nexport async function install(options = {}) {\n  const target = options.target || 'generic';\n  const root = options.dest || targetRoot(target, options.home);\n  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');\n  await mkdir(root, { recursive: true });\n  await cp(path.join(repoRoot, 'skills', '${name}'), path.join(root, '${name}'), { recursive: true, force: true });\n  return { target, root };\n}\n\nexport async function runInstaller(argv = process.argv.slice(2)) {\n  const targetFlag = argv.indexOf('--target');\n  const target = targetFlag >= 0 ? argv[targetFlag + 1] : 'generic';\n  const result = await install({ target });\n  console.log('Installed ${name} to ' + result.root);\n  return result;\n}\n`;
}

function scaffoldTest({ name }) {
  return `import { it } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { existsSync } from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');\n\nit('contains the generated skill', () => {\n  assert.equal(existsSync(path.join(projectRoot, 'skills/${name}/SKILL.md')), true);\n});\n`;
}

function adapter(title, body) {
  return `# ${title} Adapter\n\n${body}\n`;
}

function shellInstaller() {
  return `#!/usr/bin/env sh\nset -eu\nSCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nREPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)\nexec node "$REPO_ROOT/packages/installer/bin/install.mjs" "$@"\n`;
}

function powerShellInstaller() {
  return `$ErrorActionPreference = "Stop"\n$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path\n$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")\n& node (Join-Path $RepoRoot "packages\\installer\\bin\\install.mjs") @args\nexit $LASTEXITCODE\n`;
}

function docsHtml({ name, description }) {
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titleCase(name)}</title><link rel="stylesheet" href="styles.css"></head>\n<body><main><h1>${titleCase(name)}</h1><p>${description}</p><h2>Use this skill</h2><pre>npx github:&lt;owner&gt;/${name}</pre><pre>node packages/installer/bin/install.mjs --target codex</pre><pre>Use $${name} to help with this workflow.</pre></main></body>\n</html>\n`;
}

function docsCss() {
  return `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-width:320px;font-family:Aptos,"Segoe UI",ui-sans-serif,system-ui,sans-serif;background:#0b0d10;color:#f7f3eb;line-height:1.5}main{max-width:960px;margin:0 auto;padding:72px 24px}h1{font-size:72px;line-height:.96;margin:0 0 24px}h2{font-size:28px;margin:42px 0 16px}p{font-size:20px;color:#a5a39e;max-width:720px}pre{background:#101216;color:#f7f3eb;padding:18px;border:1px solid #292d35;border-radius:8px;overflow:auto}@media (max-width:720px){main{padding:48px 18px}h1{font-size:48px}}\n`;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function titleCase(name) {
  return name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function mitLicense() {
  return `MIT License\n\nCopyright (c) ${new Date().getFullYear()} Nuttapong Buttprom\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.\n`;
}

export async function runCli(argv = process.argv.slice(2)) {
  const [command, rawName, ...rest] = argv;

  if (command === 'install') {
    const args = parseInstallArgs([rawName, ...rest].filter(Boolean));
    const target = args.target || 'auto';
    const targets = target === 'auto' ? detectTargets() : normalizeTargets(target);
    const result = await installAgentPluginBuilder({
      targets,
      dest: args.dest,
      dryRun: Boolean(args['dry-run']),
    });
    console.log(result.dryRun ? 'Agent Plugin Builder dry run complete.' : 'Agent Plugin Builder skill installed.');
    return result;
  }

  if (command !== 'create' || !rawName) {
    console.log('Usage: agent-plugin-builder create <plugin-name> [--description text] [--dir path]');
    console.log('Usage: agent-plugin-builder install [--target auto|all|codex|claude-code|openclaw|gemini-cli|generic] [--dest path] [--dry-run]');
    return { help: true };
  }

  const descriptionIndex = rest.indexOf('--description');
  const dirIndex = rest.indexOf('--dir');
  const result = await createPluginProject({
    name: rawName,
    description: descriptionIndex >= 0 ? rest[descriptionIndex + 1] : undefined,
    directory: dirIndex >= 0 ? rest[dirIndex + 1] : process.cwd(),
  });
  console.log(`Created ${result.name} at ${result.root}`);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error) => { console.error(error.message); process.exitCode = 1; });
}