#!/usr/bin/env node
import { runCli } from '../src/builder.mjs';

runCli().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});