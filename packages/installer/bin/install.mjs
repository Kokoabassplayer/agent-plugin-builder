#!/usr/bin/env node
import { runInstaller } from '../src/install.mjs';

runInstaller().catch((error) => {
  console.error(`agent-plugin-builder installer: ${error.message}`);
  process.exitCode = 1;
});