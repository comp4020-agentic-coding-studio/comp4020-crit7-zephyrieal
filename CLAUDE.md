# Your harness

This file holds the rules I actually held the agent to this week, not a
generic checklist. Written after the fact from how the build went, so it
matches what happened rather than what a template expects.

## Ground the domain in real sources, don't invent it

Venue names, capacities, and who owns each one came from two live ANU
pages — [ANU Venue Hire](https://services.anu.edu.au/campus-environment/venues-functions/anu-venue-hire)
and [Find a venue](https://services.anu.edu.au/campus-environment/venues-functions/functions-on-campus/find-a-venue) —
fetched and read before any seed data was written, not guessed at. Where ANU's
own pages don't name a real team (a couple of the CS-building entries), that's
marked in a code comment as a best-effort stand-in, not passed off as fact.
Any future domain data goes through the same bar: check the real source
first, and say in the commit or a comment when something is a placeholder.

## Ask, don't assume, on scope calls that change the data model

When the venue-contact model needed to grow from "every venue has one team
email" to three genuinely different contact shapes, I was asked to choose
between keeping the narrower two-team scope or expanding to match ANU's real
three-category structure, rather than the agent picking one. That's the bar
for architecture decisions that aren't obviously implied by the brief: ask.

## No interactive prompts in migrations

drizzle-kit's rename-ambiguity TTY prompt (triggered when a schema diff both
drops and adds columns/tables at once) doesn't work in this environment.
Migrations that rename or restructure go through two sequential one-direction
`db:generate` calls — a pure drop, then a pure add — instead of one ambiguous
diff. New NOT NULL columns get a schema-level `.default()` so SQLite's
`ALTER TABLE ADD COLUMN` doesn't need an interactive default either.

## Self-critique the UI against generic-AI-design tells before calling it done

After a design pass, re-run it against the tell checklist (cream+serif+
terracotta, near-black+single-accent, ALL-CAPS eyebrows, middle-dot meta
strings, decorative numbering) against the actual rendered markup — not just
in the abstract. Caught and fixed two real instances this way (a decorative
kicker label, a middle-dot separator) rather than over-correcting things that
weren't actually tells.

## `pnpm check` before every commit, commit in checkpoints

Small commits as the work lands, each one green, rather than one commit at
the end. Push after each checkpoint so there's a real history to cite in
`PROCESS.md`, not a single squash.

## Docs are mine to write, not the agent's

`PROCESS.md` and `reflections/crit-7.md` are the graded account of my own
judgement and process. The agent can draft them if I ask, but I decide what
they say and rewrite anything that doesn't match how I'd actually put it
before submitting — same as I did with `README.md`.
