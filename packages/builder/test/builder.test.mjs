import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createPluginProject, normalizePluginName } from '../src/builder.mjs';

const execFileAsync = promisify(execFile);

describe('agent plugin builder', () => {
  it('normalizes plugin names to short hyphen-case identifiers', () => {
    assert.equal(normalizePluginName('Visual Evidence Plugin'), 'visual-evidence-plugin');
    assert.equal(normalizePluginName('My__Plugin!!'), 'my-plugin');
    assert.throws(() => normalizePluginName('---'), /Plugin name must include/);
  });

  it('scaffolds a cross-harness plugin project', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'apb-'));
    const result = await createPluginProject({
      name: 'Review Proof Kit',
      directory: root,
      description: 'Capture proof for reviewers.',
    });

    assert.equal(result.name, 'review-proof-kit');
    assert.equal(result.root, path.join(root, 'review-proof-kit'));

    const expectedFiles = [
      'README.md',
      'package.json',
      'LICENSE',
      'skills/review-proof-kit/SKILL.md',
      'skills/review-proof-kit/agents/openai.yaml',
      'packages/cli/src/index.mjs',
      'packages/installer/src/install.mjs',
      'adapters/claude-code/.claude-plugin/plugin.json',
      'adapters/codex/ADAPTER.md',
      'adapters/openclaw/ADAPTER.md',
      'adapters/gemini-cli/ADAPTER.md',
      'adapters/generic/ADAPTER.md',
      'installers/install.sh',
      'installers/install.ps1',
      'docs/index.html',
      'docs/styles.css',
      'test/scaffold.test.mjs',
    ];

    for (const file of expectedFiles) {
      assert.equal(existsSync(path.join(result.root, file)), true, `${file} should exist`);
    }

    const skill = await readFile(path.join(result.root, 'skills/review-proof-kit/SKILL.md'), 'utf8');
    assert.match(skill, /^---\nname: review-proof-kit\ndescription:/);
    assert.match(skill, /Capture proof for reviewers\./);

    const readme = await readFile(path.join(result.root, 'README.md'), 'utf8');
    assert.match(readme, /## How To Use/);
    assert.match(readme, /node packages\/installer\/bin\/install\.mjs --target codex/);
    assert.match(readme, /Use \$review-proof-kit to help with this workflow\./);

    const manifest = JSON.parse(await readFile(path.join(result.root, 'adapters/claude-code/.claude-plugin/plugin.json'), 'utf8'));
    assert.equal(manifest.name, 'review-proof-kit');
    assert.equal(manifest.description, 'Capture proof for reviewers.');
  });

  it('generates a scaffold smoke test that passes outside the generated project cwd', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'apb-smoke-'));
    const result = await createPluginProject({
      name: 'Smoke Plugin',
      directory: root,
      description: 'Smoke test plugin.',
    });

    const testFile = path.join(result.root, 'test', 'scaffold.test.mjs');
    const childEnv = { ...process.env };
    for (const key of Object.keys(childEnv)) {
      if (key.startsWith('NODE_TEST')) delete childEnv[key];
    }
    const { stdout, stderr } = await execFileAsync(process.execPath, ['--test', testFile], { cwd: root, env: childEnv });
    assert.match(stdout + stderr, /# pass 1/);
  });
});
