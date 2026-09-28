# Process overview

Written by you, for a reader: how you got from the brief to the harness and
agentic workflow behind this submission. Markers read this file and follow its
citations; they don't trawl the repo for evidence you didn't point at.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A club venue-booking workflow: one form that asks for the same information
ANU's own Venue Hire Request Form asks for, one assignment step that tells you
which team owns the room it picked, and one ledger that tracks a request
through the approval chain instead of leaving you to guess where it sits.
`README.md` has the full account of what the app is and what good means here;
this file is how I got there.

## How I got here

I started from the course's `template-dynamic` starter
([`45c6de8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/45c6de8)),
which ships a guestbook slice end to end (schema, API route, page, spec test)
as a pattern to copy, not a feature to keep. The first real work was turning
that pattern into the booking domain: swap the schema
([`9f16c89`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/9f16c89)),
wire the venue-assignment route and page
([`c3c4d37`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/c3c4d37)),
and replace the guestbook's plumbing test with tests against the actual
booking-workflow contract
([`066b096`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/066b096)).

The design pass came next
([`732db8f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/732db8f)).
I asked the agent to self-critique its own output against a checklist of
generic-AI-design tells (cream+serif+terracotta, ALL-CAPS eyebrow labels,
middle-dot meta strings) rather than take a first pass as finished, which
caught and fixed two real instances of exactly that
([`fdf354a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/fdf354a)).

> re-run the design against the tell checklist on the actual rendered markup,
> not just in the abstract

Grounding the app in the real workflow, not an invented one, was the recurring
theme of the week. Seed venues came from the actual ANU venue-hire page rather
than made-up rooms
([`3c153fa`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/3c153fa)),
and when it became clear the page names three distinct venue categories, not
two, I was asked to choose whether to keep the narrower scope or model the
real structure — I chose the latter
([`a9e053e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/a9e053e)).
That "ask, don't assume, on scope calls that change the data model" rule is
now in `CLAUDE.md`
([`74c8e09`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/74c8e09))
because it's the kind of decision I want to keep making myself.

Later in the week I pushed the same grounding further: pulling more detail off
the ANU venue-hire page into the UI as concrete hints (processing times, FOC
deadlines) rather than generic copy
([`37497c7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/37497c7)),
then expanding the request form to collect the same fields ANU's own Venue
Hire Request Form collects — contact details, event timings, food/AV/setup
requirements — instead of the two-field form I'd started with
([`765213f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/765213f)).

> venue hire would require these info: [pasted ANU's real form field list]

That expansion made a single page carrying both a long intake form and a
running ledger feel cramped, so I split it: a landing page that greets you
with a choice between submitting a new request or checking on ones already in
flight, and two separate pages behind it
([`ab1ca5a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/ab1ca5a)).
Splitting the routes meant re-pointing the API redirects, the invariants
route list, and a test helper's default path at the new `/requests` page —
easy to miss, and exactly the kind of thing a red `pnpm check` catches before
it ships silently broken.

The last piece closed a gap between the simulated workflow and the real one:
the app lets you "submit" a Functions on Campus form as an internal status
change, but the actual submission still happens on ANU's own site, so I added
a direct link to it wherever the app tells you FOC approval is needed
([`544d6ea`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zephyrieal/commit/544d6ea)).
That commit also fixed a contrast bug the change surfaced — the site's link
colour is tuned for its dark background and fails WCAG on the light form
panel — which `pnpm check`'s accessibility test doesn't catch on its own,
since axe can't judge colour contrast without real layout.

Throughout, `pnpm check` stayed the gate before every commit: typecheck, the
booking-workflow spec, and a per-page accessibility floor (one `<h1>`, alt
text, a nav landmark, zero axe violations). Nothing here shipped on a red
check.

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
