# Crit 7

## What was the breakthrough that moved the work forward?

The breakthrough was deciding the app had to be grounded in ANU's actual venue
hire process, not a plausible-looking invention of one. Early on it would have
been easy to make up two or three venues and a generic "request a room" form
and call it done. Instead I had the real ANU Venue Hire page fetched and read
before writing any seed data, and it turned out the page describes three
distinct venue categories, not the two I'd assumed. That forced a real
decision — keep the narrower scope or model what ANU actually has — and I
chose to model it properly rather than let the gap sit. The same grounding
paid off again later: pulling ANU's real request-form fields into my own form,
and its real Functions on Campus deadlines and submission link into the
ledger, made the workflow feel like a stand-in for the actual process instead
of a demo of one.

## What did this work change about who I want to be as a software developer?

It sharpened where I want to draw the line between deciding things myself and
asking first. A data-model scope call — how many venue categories to model —
is cheap to redo in a mockup but expensive once a schema and its migrations
depend on it, so that's where I now default to checking before committing to
a direction. I also noticed how easy it is to trust a green check too much:
my accessibility suite passed all week while a real contrast failure sat in
the UI, because the tool it runs on can't judge color against a rendered
background. Green isn't the same as correct — I still have to look.
