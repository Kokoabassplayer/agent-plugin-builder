# Agent Plugin Builder

Scaffold cross-harness AI plugins with Agent Skills, adapters, installers, docs, and tests.

Project site: https://kokoabassplayer.github.io/agent-plugin-builder/

## Install And Use

From GitHub today:

```bash
npx github:Kokoabassplayer/agent-plugin-builder create my-plugin
```

With a description:

```bash
npx github:Kokoabassplayer/agent-plugin-builder create review-proof-kit --description "Capture proof for reviewers."
```

Local development:

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