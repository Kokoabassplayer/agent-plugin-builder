# Agent Plugin Builder

Scaffold cross-harness AI plugins with Agent Skills, adapters, installers, docs, and tests.

Project site: https://kokoabassplayer.github.io/agent-plugin-builder/

## How To Use

Prerequisite: Node.js 20 or newer.

Create a plugin repo from GitHub:

```bash
npx github:Kokoabassplayer/agent-plugin-builder create visual-evidence-kit --description "Capture proof for reviewers."
```

Enter the generated repo:

```bash
cd visual-evidence-kit
```

Install the generated skill into the agent harness you use:

```bash
node packages/installer/bin/install.mjs --target codex
node packages/installer/bin/install.mjs --target claude-code
node packages/installer/bin/install.mjs --target openclaw
node packages/installer/bin/install.mjs --target gemini-cli
node packages/installer/bin/install.mjs --target generic
```

Then start your agent and ask it to use the skill:

```text
Use $visual-evidence-kit to capture visual evidence for this PR.
```

For local development of this builder repo:

```bash
node packages/builder/bin/agent-plugin-builder.mjs create my-plugin --description "My cross-harness plugin."
```

## What It Creates

```text
my-plugin/
  skills/
    my-plugin/
      SKILL.md
      agents/openai.yaml
  packages/
    cli/
    installer/
  adapters/
    claude-code/
    codex/
    openclaw/
    gemini-cli/
    generic/
  installers/
    install.sh
    install.ps1
  docs/
  test/
  README.md
  package.json
  LICENSE
```

## Design Principles

- Agent Skills are the portable core.
- Harness plugins are adapters, not the source of truth.
- Node.js owns the cross-platform logic.
- Shell and PowerShell files are thin launchers.
- Generated projects include tests from the start.

## Test

```bash
npm test
npm run check
```

## Sponsor This Work

If this helps you build useful AI tools faster, you can support the project:

https://github.com/sponsors/Kokoabassplayer

## License

MIT