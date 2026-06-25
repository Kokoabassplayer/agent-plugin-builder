# Agent Plugin Builder

Scaffold cross-harness AI plugins with Agent Skills, adapters, installers, docs, and tests.

Project site: https://kokoabassplayer.github.io/agent-plugin-builder/

## How To Use

Prerequisite: Node.js 20 or newer.

Install Agent Plugin Builder itself into your agent harness first:

```bash
npx github:Kokoabassplayer/agent-plugin-builder install --target codex
```

Other install targets:

```bash
npx github:Kokoabassplayer/agent-plugin-builder install --target claude-code
npx github:Kokoabassplayer/agent-plugin-builder install --target openclaw
npx github:Kokoabassplayer/agent-plugin-builder install --target gemini-cli
npx github:Kokoabassplayer/agent-plugin-builder install --target generic
npx github:Kokoabassplayer/agent-plugin-builder install --target all
```

Then start a fresh agent session and ask it to use the skill:

```text
Use $agent-plugin-builder to create a plugin repo for visual evidence comments.
```

You can also use the CLI directly to create a plugin repo:

```bash
npx github:Kokoabassplayer/agent-plugin-builder create visual-evidence-kit --description "Capture proof for reviewers."
```

Enter the generated repo and install the generated skill into the harness you use:

```bash
cd visual-evidence-kit
node packages/installer/bin/install.mjs --target codex
```

For local development of this builder repo:

```bash
node packages/builder/bin/agent-plugin-builder.mjs install --target codex
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
npm run install:dry-run
```

## Sponsor This Work

If this helps you build useful AI tools faster, you can support the project through GitHub Sponsors:

https://github.com/sponsors/Kokoabassplayer

Sponsorship helps fund examples, documentation, installer polish, compatibility testing, and templates without creating a support SLA or custom-work guarantee.

## License

MIT