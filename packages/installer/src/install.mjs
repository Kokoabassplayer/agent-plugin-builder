import { access, cp, mkdir, writeFile } from 'node:fs/promises';
import { constants, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SKILL_NAME = 'agent-plugin-builder';
export const HARNESS_TARGETS = ['claude-code', 'codex', 'openclaw', 'gemini-cli', 'generic'];

export function normalizeTargets(targets) {
  const list = Array.isArray(targets) ? targets : String(targets).split(',');
  const expanded = list.flatMap((target) => String(target).trim() === 'all' ? HARNESS_TARGETS : [String(target).trim()]).filter(Boolean);
  const unique = [...new Set(expanded)];
  for (const target of unique) {
    if (!HARNESS_TARGETS.includes(target)) throw new Error(`Unsupported install target: ${target}`);
  }
  return unique.length ? unique : ['generic'];
}

export function detectTargets(options = {}) {
  const home = options.home || os.homedir();
  const found = [];
  if (existsSync(path.join(home, '.claude'))) found.push('claude-code');
  if (existsSync(path.join(home, '.codex'))) found.push('codex');
  if (existsSync(path.join(home, '.openclaw'))) found.push('openclaw');
  if (existsSync(path.join(home, '.gemini'))) found.push('gemini-cli');
  return found.length ? found : ['generic'];
}

export function planInstall(options = {}) {
  const home = options.home || os.homedir();
  const targets = normalizeTargets(options.targets || ['generic']);
  return targets.map((target) => ({ target, root: destinationFor(target, home) }));
}

export async function installAgentPluginBuilder(options = {}) {
  const repoRoot = options.repoRoot || resolveRepoRoot();
  const targets = normalizeTargets(options.targets || detectTargets({ home: options.home }));
  const plan = planInstall({ targets, home: options.home });
  const actions = [];

  for (const item of plan) {
    const root = options.dest ? destinationUnder(options.dest, item.target) : item.root;
    actions.push(...actionsForTarget({ target: item.target, root }));
    if (!options.dryRun) await installTarget({ target: item.target, root, repoRoot });
  }

  return { installed: !options.dryRun, dryRun: Boolean(options.dryRun), targets, actions };
}

function destinationFor(target, home) {
  if (target === 'claude-code') return path.join(home, '.claude', 'skills', 'agent-plugin-builder');
  if (target === 'codex') return path.join(home, '.codex', 'skills');
  if (target === 'openclaw') return path.join(home, '.openclaw', 'skills');
  if (target === 'gemini-cli') return path.join(home, '.gemini', 'agent-plugin-builder');
  return path.join(home, '.agents', 'skills');
}

function destinationUnder(dest, target) {
  if (target === 'claude-code') return path.join(dest, 'claude-code', 'agent-plugin-builder');
  if (target === 'gemini-cli') return path.join(dest, 'gemini-cli', 'agent-plugin-builder');
  if (target === 'generic') return path.join(dest, 'skills');
  return path.join(dest, target, 'skills');
}

function skillRootForTarget(target, root) {
  if (target === 'claude-code') return path.join(root, 'skills');
  if (target === 'gemini-cli') return path.join(root, 'skills');
  return root;
}

function actionsForTarget({ target, root }) {
  const skillRoot = skillRootForTarget(target, root);
  const actions = [{ type: 'copy-skill', target, skill: SKILL_NAME, to: path.join(skillRoot, SKILL_NAME) }];
  if (target === 'claude-code') actions.unshift({ type: 'write-manifest', target, to: path.join(root, '.claude-plugin', 'plugin.json') });
  if (target === 'gemini-cli') actions.push({ type: 'write-context', target, to: path.join(root, 'GEMINI.md') });
  return actions;
}

async function installTarget({ target, root, repoRoot }) {
  const skillRoot = skillRootForTarget(target, root);
  await mkdir(skillRoot, { recursive: true });
  await copySkill({ repoRoot, destination: path.join(skillRoot, SKILL_NAME) });
  if (target === 'claude-code') await writeClaudeManifest(root);
  if (target === 'gemini-cli') await writeGeminiContext(root);
}

async function copySkill({ repoRoot, destination }) {
  const source = path.join(repoRoot, 'skills', SKILL_NAME);
  await access(path.join(source, 'SKILL.md'), constants.F_OK);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

async function writeClaudeManifest(root) {
  const manifest = {
    name: 'agent-plugin-builder',
    description: 'Create cross-harness AI plugin repositories with Agent Skills as the portable core.',
    version: '0.1.0',
    author: { name: 'Kokoabassplayer' },
    homepage: 'https://kokoabassplayer.github.io/agent-plugin-builder/',
    repository: 'https://github.com/Kokoabassplayer/agent-plugin-builder',
    license: 'MIT',
  };
  const dir = path.join(root, '.claude-plugin');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function writeGeminiContext(root) {
  const body = '# Agent Plugin Builder\n\nUse the skill in ./skills/agent-plugin-builder when the user asks to create, scaffold, or package a cross-harness AI plugin or Agent Skills project.\n';
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'GEMINI.md'), body);
}

function resolveRepoRoot() {
  if (process.env.AGENT_PLUGIN_BUILDER_REPO_ROOT) return process.env.AGENT_PLUGIN_BUILDER_REPO_ROOT;
  return path.resolve(path.dirname(fileURLToFilePath(import.meta.url)), '../../..');
}

function fileURLToFilePath(url) {
  return fileURLToPath(url);
}

export function parseInstallArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    args[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return args;
}

export async function runInstaller(argv = process.argv.slice(2)) {
  const args = parseInstallArgs(argv);
  const target = args.target || 'auto';
  const targets = target === 'auto' ? detectTargets() : normalizeTargets(target);
  const result = await installAgentPluginBuilder({
    targets,
    dest: args.dest,
    dryRun: Boolean(args['dry-run']),
  });
  printResult(result);
  return result;
}

function printResult(result) {
  console.log(result.dryRun ? 'Agent Plugin Builder dry run complete.' : 'Agent Plugin Builder skill installed.');
  console.log('\nTargets:');
  for (const target of result.targets) console.log(`- ${target}`);
  console.log('\nTry:');
  console.log('Use $agent-plugin-builder to create a plugin repo for visual evidence comments.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runInstaller().catch((error) => {
    console.error(`agent-plugin-builder installer: ${error.message}`);
    process.exitCode = 1;
  });
}