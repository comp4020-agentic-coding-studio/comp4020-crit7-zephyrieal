# Book a room, skip the inbox

This is a prototype of the ANU club venue-booking process, cut down to the
slice that actually hurts: to book a room as a club today, you have to know
which of several venue-hire teams owns the building you want, email them,
wait up to a week for a tentative assignment you don't get to choose, submit
a separate Functions on Campus (FOC) form to the Safety team, wait for that
approval, then forward it back to the venue-hire team to confirm. Nothing
tells you up front which team to email, or where you are in that chain once
you've started it.

The app replaces the first guess with an answer: submit an event and a
headcount, and it assigns the smallest room that fits and tells you exactly
who owns it — a shared team inbox, a link to book directly on a venue's own
site, or (honestly) that ANU doesn't publish a fixed contact for that
category at all. From there the request walks the same small workflow the
real process does: tentatively assigned → FOC pending → FOC approved →
confirmed, one button press at a time.

## What good looks like here

The build decision was to model the full multi-stage workflow rather than a
single CRUD form, because the friction in the real process isn't "does a
booking persist" — it's the multi-team ownership and the FOC hand-off in the
middle. A form that only stored a room request would miss the actual
problem.

Two ANU pages shaped the venue data:
[ANU Venue Hire](https://services.anu.edu.au/campus-environment/venues-functions/anu-venue-hire)
and
[Find a venue](https://services.anu.edu.au/campus-environment/venues-functions/functions-on-campus/find-a-venue).
Together they confirm the process really does split ownership three ways —
a central Venue Hire team, commercial venues you book directly on their own
site, and department-managed spaces with no fixed contact at all — and, more
tellingly, that ANU's own answer to "who else do I contact" is a link to a
personal OneDrive file that doesn't resolve. That dead link is the best
evidence I found that this confusion is real rather than invented for the
brief, so the app models all three contact shapes instead of pretending
every venue has one team inbox.

What's deliberately out of scope: there's no login or multi-user state, no
real integration with ANU's FOC system, and no email actually gets sent —
advancing a request just moves its status. The thing being tested is
whether surfacing the owning team up front and walking a status machine
forward removes the guesswork, not building a production booking platform.

`spec/bookings.test.ts` pins the mechanical contract: the tightest-fitting
venue gets assigned, a headcount nothing fits gets flagged rather than
mis-assigned, the workflow advances one step at a time, and all of it
persists across a reload. `spec/invariants.test.ts` holds an accessibility
floor (axe-core) across every route. Everything past that — the ledger
layout, the stamp-style status badges, the exact wording on each action
button — is a judgement call the tests don't and can't enforce.
