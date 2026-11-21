# Hooks

Format: **Kiro v1 hook schema** — standalone JSON files in `.kiro/hooks/`,
shared by Kiro IDE 1.0 and Kiro CLI 3.x (the retired 0.x `.kiro.hook`
`when`/`then` format is NOT used; legacy files do not execute).

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "format-on-save",
      "trigger": "PostFileSave",
      "matcher": "\\.ts$",
      "action": { "type": "command", "command": "prettier --write {{filePath}}" }
    }
  ]
}
```

(Official example shape above; schema reference: kiro.dev "Hooks — What's
new in 1.0". `matcher` is a regex matched against the file path for file
triggers; a `command` action runs in the project root and receives the
event as JSON on stdin.)

## This repo's hooks

| File | Trigger | Matcher (path regex) | Command |
| --- | --- | --- | --- |
| `test-on-save.json` | `PostFileSave` | `src/.*\.ts$` | `npm test` |
| `citation-lint.json` | `PostFileSave` | `(fixtures/.*\.json\|out/cards\.json)$` | `npm run demo && npm run lint:citations` |
| `fixture-refresh.json` | `PostFileSave` | `src/core/.*\.ts$` | `npm run demo && npm test` |

Notes:

- File triggers fire on changes **the agent** makes, not on a human's own
  editor saves (per the official trigger reference).
- `test-on-save` runs the full suite: the suite is small (15 tests) and
  has no per-file affected-test selection.
- `citation-lint` is the spec-R4 gate: it regenerates the demo outputs,
  then `scripts/citation-lint.ts` verifies every citation in
  `out/cards.json` is complete.

## Verification status (2026-11-21)

- The v1 format was proven loadable and executable under the local
  Kiro CLI 3.5.0: a sample workspace hook with a `SessionStart` command
  action fired during a real `kiro-cli chat` run (sample kept outside
  this repo, in the track workspace's `hook-sample/` directory).
- A live-fire test of these `PostFileSave` hooks is still pending: on
  2026-11-21 the account's model inference returned
  `TEMPORARILY_SUSPENDED`, so the agent could not make a file save to
  trigger them. Re-test once account access is restored.
