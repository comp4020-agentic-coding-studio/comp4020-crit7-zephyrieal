import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  BOOKING_STATUSES,
  type BookingRequest,
  bookingRequests,
  type Venue,
  venues,
} from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Seed reflects ANU's own published venue categories — three of them, per
// services.anu.edu.au/campus-environment/venues-functions/anu-venue-hire and
// .../functions-on-campus/find-a-venue — each with a genuinely different
// contact shape, not just a different address. The venue-hire page also
// names its three central-teaching-space types outright (flat rooms, tiered
// theatres, computer labs), so all three are seeded rather than just two,
// and its own quoted numbers — a 5-business-day reply time, and FOC's
// 14/21-day notice windows — show up as hints in the UI instead of being
// left implicit:
// - Central Teaching Spaces: a shared team, ANU Venue Hire, one inbox
//   (venuehire@anu.edu.au).
// - Commercial venues (Kambri, University House, School of Music, ...):
//   "book directly with the relevant venue" — no shared inbox, you go to
//   that venue's own site. Kambri also gives a direct email
//   (kambri.venues@anu.edu.au) for external teaching-room clients, so it's
//   modeled as email; the others below are modeled as website since that's
//   all ANU's own page gives.
// - Department-managed spaces: "contact the relevant College, School or
//   department" — literally no fixed contact ANU can name for you, which is
//   exactly the gap this app exists to paper over.
// The one real dead end: the general venue-hire page's own answer for "who
// else do I contact" is a "Contacts for Other Venues" link to a personal
// OneDrive file that doesn't resolve — so the Hanna Neumann/CSIT-style
// entries below are best-effort stand-ins for teams no public ANU page
// actually names; swap in real ones if you can get them.
const SEED_VENUES: (typeof venues.$inferInsert)[] = [
  {
    name: "Central Teaching Space — Flat Room",
    building: "Central Teaching Spaces",
    capacity: 30,
    owningTeam: "ANU Venue Hire",
    contactMethod: "email",
    contact: "venuehire@anu.edu.au",
  },
  {
    name: "Central Teaching Space — Tiered Lecture Theatre",
    building: "Central Teaching Spaces",
    capacity: 200,
    owningTeam: "ANU Venue Hire",
    contactMethod: "email",
    contact: "venuehire@anu.edu.au",
  },
  {
    // "Computer labs (PC or MAC)" is one of the three venue types the page
    // names outright alongside flat rooms and tiered theatres.
    name: "Central Teaching Space — Computer Lab",
    building: "Central Teaching Spaces",
    capacity: 24,
    owningTeam: "ANU Venue Hire",
    contactMethod: "email",
    contact: "venuehire@anu.edu.au",
  },
  {
    name: "Marie Reay Teaching Centre — Room 4.03",
    building: "Marie Reay Teaching Centre",
    capacity: 30,
    owningTeam: "Kambri Venues",
    contactMethod: "email",
    contact: "kambri.venues@anu.edu.au",
  },
  {
    name: "Marie Reay Teaching Centre — Lecture Theatre",
    building: "Marie Reay Teaching Centre",
    capacity: 200,
    owningTeam: "Kambri Venues",
    contactMethod: "email",
    contact: "kambri.venues@anu.edu.au",
  },
  {
    // Illustrative capacity — ANU's page names this as a commercial venue
    // but publishes no seating figures, only a booking site.
    name: "University House — function rooms",
    building: "University House",
    capacity: 80,
    owningTeam: "University House",
    contactMethod: "website",
    contact: "https://unihouse.anu.edu.au/events-meetings/",
  },
  {
    name: "School of Music — performance venues",
    building: "School of Music",
    capacity: 50,
    owningTeam: "School of Music",
    contactMethod: "website",
    contact: "https://music.cass.anu.edu.au/services/bookings/venues",
  },
  {
    name: "Department-managed space",
    building: "Department-managed space",
    capacity: 20,
    owningTeam: "Your College, School or department",
    contactMethod: "department",
    contact: "ANU doesn't name a shared contact for these — ask your department directly.",
  },
  {
    name: "Hanna Neumann Building — Tutorial Room",
    building: "Hanna Neumann Building",
    capacity: 40,
    owningTeam: "MSI Venues",
    contactMethod: "email",
    contact: "msi.venues@anu.edu.au",
  },
  {
    name: "CSIT Building — Seminar Room N101",
    building: "CSIT Building",
    capacity: 60,
    owningTeam: "CECS Venues",
    contactMethod: "email",
    contact: "cecs.venues@anu.edu.au",
  },
];

if (db.select().from(venues).all().length === 0) {
  db.insert(venues).values(SEED_VENUES).run();
}

export type { BookingRequest, Venue };

export function listVenues(): Venue[] {
  return db.select().from(venues).orderBy(asc(venues.capacity)).all();
}

export function venueById(id: number | null): Venue | undefined {
  if (id === null) return undefined;
  return db.select().from(venues).where(eq(venues.id, id)).get();
}

export function listBookings(): BookingRequest[] {
  return db.select().from(bookingRequests).orderBy(desc(bookingRequests.id)).all();
}

export function createBooking(input: {
  event: string;
  headcount: number;
  preferredBuilding?: string;
}): BookingRequest {
  // listVenues() is sorted by capacity ascending, so the first candidate
  // that fits is the tightest fit — no picking your own room, same as the
  // real process, but at least it's instant and it tells you who owns it.
  const candidates = listVenues().filter((venue) => {
    if (venue.capacity < input.headcount) return false;
    if (
      input.preferredBuilding &&
      venue.building.toLowerCase() !== input.preferredBuilding.toLowerCase()
    ) {
      return false;
    }
    return true;
  });
  const assigned = candidates[0];

  return db
    .insert(bookingRequests)
    .values({
      event: input.event,
      headcount: input.headcount,
      preferredBuilding: input.preferredBuilding ?? null,
      venueId: assigned?.id ?? null,
      status: assigned ? "tentatively_assigned" : "no_venue_available",
    })
    .returning()
    .get();
}

export function advanceBooking(id: number): BookingRequest | undefined {
  const booking = db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).get();
  if (!booking) return undefined;

  const index = BOOKING_STATUSES.indexOf(booking.status as (typeof BOOKING_STATUSES)[number]);
  if (index === -1 || index === BOOKING_STATUSES.length - 1) return booking;

  return db
    .update(bookingRequests)
    .set({ status: BOOKING_STATUSES[index + 1] })
    .where(eq(bookingRequests.id, id))
    .returning()
    .get();
}
