# Issue Tracker: Local Markdown

Issues and specs for this repository live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- The specification is `.scratch/<feature-slug>/spec.md`.
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`. Do not create a combined tickets file.
- Triage state is recorded as a `Status:` line near the top of each issue file.
- Comments and conversation history append below a `## Comments` heading.

## Publishing And Reading

When a skill publishes to the issue tracker, create the appropriate file under `.scratch/<feature-slug>/`. When a skill fetches a ticket, read the referenced local Markdown file.

## Wayfinding

`/wayfinder` uses `.scratch/<effort>/map.md` and one child ticket per decision at `.scratch/<effort>/issues/<NN>-<slug>.md`. Decision tickets include `Type:`, `Status:`, and `Blocked by:` fields. A ticket is unblocked once every listed blocker is resolved.
