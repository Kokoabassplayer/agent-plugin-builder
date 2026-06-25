import { it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runCli } from '../src/builder.mjs';

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

it('installs the bundled agent-plugin-builder skill into an explicit generic destination', async () => {
  const dest = await mkdtemp(path.join(tmpdir(), 'apb-self-install-'));

  const result = await runCli(['install', '--target', 'generic', '--dest', dest]);

  assert.equal(result.installed, true);
  assert.deepEqual(result.targets, ['generic']);

  const skillPath = path.join(dest, 'skills', 'agent-plugin-builder', 'SKILL.md');
  assert.equal(await exists(skillPath), true);

  const content = await readFile(skillPath, 'utf8');
  assert.match(content, /^---\nname: agent-plugin-builder/m);
  assert.match(content, /cross-harness AI plugin/);
});

it('dry-runs self-install without writing files', async () => {
  const dest = path.join(await mkdtemp(path.join(tmpdir(), 'apb-dry-run-')), 'install-root');

  const result = await runCli(['install', '--target', 'generic', '--dest', dest, '--dry-run']);

  assert.equal(result.dryRun, true);
  assert.equal(result.actions.some((action) => action.type === 'copy-skill'), true);
  assert.equal(await exists(dest), false);
});