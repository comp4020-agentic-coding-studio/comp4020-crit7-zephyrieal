import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// Turns the week's fixed spec lines ("wired end to end", "persists across a
// reload") into tests against the ANU club-venue-booking slice: a club
// submits an event + headcount, the app assigns the tightest-fitting venue
// and surfaces which team owns it (the actual value the real process lacks —
// today you have to guess which of five teams to email), and the request
// then moves through a small approval workflow (submitted, FOC pending,
// FOC approved, confirmed).
//
// The contract this file holds the app to, so it stays buildable however the
// UI is built:
//   - GET /api/venues returns JSON: { id, name, building, capacity,
//     owningTeam, contactMethod, contact }[] — contact is an email address,
//     a booking-site URL, or plain-language contact instructions, depending
//     on contactMethod ("email" | "website" | "department"); not every real
//     ANU venue has a shared team inbox, so the UI must render whichever one
//     a venue has without assuming it's always a mailto link.
//   - POST /api/bookings (form: event, headcount, building?, plus the
//     contact/event-detail fields ANU's own Venue Hire Request Form asks for
//     — contactName, organisation, phone, contactEmail, address, eventDate,
//     setupTime, startTime, conclusionTime, packDownTime, vipAttendance,
//     description, foodBeverage, venueSetup, avRequirements — all optional
//     and stored as given) creates a request, assigns the smallest venue
//     whose capacity fits (matching `building` when given), and redirects to /
//   - GET /requests renders one element per booking with data-booking-id and
//     data-status, containing the event name, headcount, and — when
//     assigned — the venue name, owning team and contact
//   - POST /api/bookings/:id/advance moves that booking to its next
//     workflow status and redirects to /requests
const baseUrl = inject("baseUrl");

type Venue = {
  id: number;
  name: string;
  building: string;
  capacity: number;
  owningTeam: string;
  contactMethod: string;
  contact: string;
};

const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

async function getDoc(path = "/requests"): Promise<Document> {
  const res = await fetch(new URL(path, baseUrl));
  const dom = new JSDOM(await res.text(), { url: new URL(path, baseUrl).href });
  return dom.window.document;
}

function findRow(doc: Document, probeEvent: string): Element {
  const row = [...doc.querySelectorAll("[data-booking-id]")].find((el) =>
    el.textContent?.includes(probeEvent),
  );
  if (!row) throw new Error(`no [data-booking-id] row mentions "${probeEvent}"`);
  return row;
}

describe("bookings", () => {
  let venues: Venue[];

  beforeAll(async () => {
    const res = await fetch(new URL("/api/venues", baseUrl));
    venues = await res.json();
    if (venues.length === 0) throw new Error("no venues seeded — the app needs at least one");
  });

  it("assigns the tightest-fitting venue and surfaces its owning team", async () => {
    const probe = `probe-fit ${process.hrtime.bigint()}`;
    const headcount = Math.min(...venues.map((v) => v.capacity));
    const expected = venues
      .filter((v) => v.capacity >= headcount)
      .sort((a, b) => a.capacity - b.capacity)[0];

    const res = await post(
      "/api/bookings",
      new URLSearchParams({ event: probe, headcount: String(headcount) }),
    );
    expect(res.status).toBe(303);

    const row = findRow(await getDoc(), probe);
    expect(row.getAttribute("data-status")).toBe("tentatively_assigned");
    expect(row.textContent).toContain(expected.name);
    expect(row.textContent).toContain(expected.owningTeam);
    if (expected.contactMethod === "website") {
      expect(row.textContent).toContain("Book on their site");
    } else {
      expect(row.textContent).toContain(expected.contact);
    }
  });

  it("persists the assignment across a reload", async () => {
    const probe = `probe-persist ${process.hrtime.bigint()}`;
    const headcount = Math.min(...venues.map((v) => v.capacity));

    await post("/api/bookings", new URLSearchParams({ event: probe, headcount: String(headcount) }));
    const before = findRow(await getDoc(), probe);
    const status = before.getAttribute("data-status");
    const text = before.textContent;

    const after = findRow(await getDoc(), probe);
    expect(after.getAttribute("data-status")).toBe(status);
    expect(after.textContent).toBe(text);
  });

  it("flags a request no venue can fit, instead of mis-assigning one", async () => {
    const probe = `probe-toobig ${process.hrtime.bigint()}`;
    const impossible = Math.max(...venues.map((v) => v.capacity)) + 1000;

    await post(
      "/api/bookings",
      new URLSearchParams({ event: probe, headcount: String(impossible) }),
    );
    const row = findRow(await getDoc(), probe);
    expect(row.getAttribute("data-status")).toBe("no_venue_available");
  });

  it("advances the approval workflow, and the new status persists", async () => {
    const probe = `probe-advance ${process.hrtime.bigint()}`;
    const headcount = Math.min(...venues.map((v) => v.capacity));

    await post("/api/bookings", new URLSearchParams({ event: probe, headcount: String(headcount) }));
    const created = findRow(await getDoc(), probe);
    const id = created.getAttribute("data-booking-id");
    const before = created.getAttribute("data-status");

    const res = await post(`/api/bookings/${id}/advance`, new URLSearchParams());
    expect(res.status).toBe(303);

    const after = findRow(await getDoc(), probe);
    expect(after.getAttribute("data-status")).not.toBe(before);

    const reloaded = findRow(await getDoc(), probe);
    expect(reloaded.getAttribute("data-status")).toBe(after.getAttribute("data-status"));
  });
});
