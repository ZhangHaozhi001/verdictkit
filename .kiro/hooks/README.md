# Hooks (pending CLI sample)

Planned hooks (see ../../DESIGN.md in the track workspace):

- test-on-save — run affected unit tests when `src/**` changes
- citation-lint — run `npm run lint:citations` when verdict outputs/fixtures change
- fixture-refresh — regenerate demo fixtures + full tests when verdict-core changes

File format is intentionally NOT hand-written yet: per the build plan, the
first build step generates one sample hook with the local Kiro CLI (3.5.0)
and these files are then written to that exact schema.
