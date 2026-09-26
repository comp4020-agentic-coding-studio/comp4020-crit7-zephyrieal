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

// Seed reflects what's actually verifiable about ANU venue hire
// (services.anu.edu.au/campus-environment/venues-functions/anu-venue-hire):
// - "ANU Venue Hire" runs centrally bookable teaching spaces (flat rooms,
//   tiered theatres, computer labs) and is reachable at venuehire@anu.edu.au.
// - Kambri Venues owns the Kambri precinct, including MRTC, and is reachable
//   at kambri.venues@anu.edu.au (the page directs external clients there).
// - The page's own answer for "who else do I contact" is a "Contacts for
//   Other Venues" link — a personal OneDrive file that doesn't resolve. That
//   dead link is *the problem this app exists to route around*, so the
//   MSI/CECS-style entries below are a best-effort stand-in for teams no
//   public page actually names; swap in real ones if you can get them.
const SEED_VENUES: (typeof venues.$inferInsert)[] = [
  {
    name: "Central Teaching Space — Flat Room",
    building: "Central Teaching Spaces",
    capacity: 30,
    owningTeam: "ANU Venue Hire",
    contactEmail: "venuehire@anu.edu.au",
  },
  {
    name: "Central Teaching Space — Tiered Lecture Theatre",
    building: "Central Teaching Spaces",
    capacity: 200,
    owningTeam: "ANU Venue Hire",
    contactEmail: "venuehire@anu.edu.au",
  },
  {
    name: "Marie Reay Teaching Centre — Room 4.03",
    building: "Marie Reay Teaching Centre",
    capacity: 30,
    owningTeam: "Kambri Venues",
    contactEmail: "kambri.venues@anu.edu.au",
  },
  {
    name: "Marie Reay Teaching Centre — Lecture Theatre",
    building: "Marie Reay Teaching Centre",
    capacity: 200,
    owningTeam: "Kambri Venues",
    contactEmail: "kambri.venues@anu.edu.au",
  },
  {
    name: "Hanna Neumann Building — Tutorial Room",
    building: "Hanna Neumann Building",
    capacity: 40,
    owningTeam: "MSI Venues",
    contactEmail: "msi.venues@anu.edu.au",
  },
  {
    name: "CSIT Building — Seminar Room N101",
    building: "CSIT Building",
    capacity: 60,
    owningTeam: "CECS Venues",
    contactEmail: "cecs.venues@anu.edu.au",
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
