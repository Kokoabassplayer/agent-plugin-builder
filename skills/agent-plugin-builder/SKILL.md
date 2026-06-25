---
name: agent-plugin-builder
description: "Use when the user wants to create, scaffold, or package a cross-harness AI plugin or Agent Skills project for Claude Code, Codex, OpenClaw, Gemini CLI, or generic Agent Skills."
---

# Agent Plugin Builder

## Overview

Scaffold cross-harness AI plugin projects that use Agent Skills as the portable core and harness adapters for distribution.

## Install This Builder Skill

When setting up this workflow for a harness, install this repo's own skill first:

```bash
npx github:Kokoabassplayer/agent-plugin-builder install --target codex
```

Supported targets are `codex`, `claude-code`, `openclaw`, `gemini-cli`, `generic`, and `all`.

## Workflow

1. Clarify the plugin name, purpose, and target harnesses.
2. Use the bundled CLI when command execution is available:

```bash
npx github:Kokoabassplayer/agent-plugin-builder create my-plugin --description "What this plugin helps users do."
```

3. Inspect the generated structure before modifying it.
4. Add domain-specific skill instructions, scripts, references, and assets.
5. Run generated tests before claiming the scaffold is ready.

## Output Standard

A generated project should include:

- `skills/` with at least one valid `SKILL.md`
- `packages/cli/` for deterministic helpers
- `packages/installer/` for one-command install
- `adapters/` for Claude Code, Codex, OpenClaw, Gemini CLI, and generic Agent Skills
- `installers/` with shell and PowerShell wrappers
- `docs/` for a GitHub Pages starter
- `test/` with an initial smoke test

## Boundaries

Do not put product-specific behavior into Agent Plugin Builder itself. Generate the structure and starter contracts; customize the generated plugin after scaffolding.