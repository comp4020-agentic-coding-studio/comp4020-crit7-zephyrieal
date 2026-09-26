import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
// How to reach the team that owns a venue. Not every venue has a shared
// team inbox: commercial venues (ANU Commons, Kambri, University House...)
// say "book directly with the relevant venue" on their own site, and
// department-managed spaces have no fixed contact at all ("contact the
// relevant College, School or department").
export const CONTACT_METHODS = ["email", "website", "department"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const venues = sqliteTable("venues", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  building: text().notNull(),
  capacity: int().notNull(),
  owningTeam: text("owning_team").notNull(),
  contactMethod: text("contact_method").notNull().default("email"),
  contact: text().notNull().default(""),
});

export type Venue = typeof venues.$inferSelect;

// The approval workflow a request moves through once a venue is tentatively
// assigned. "no_venue_available" sits outside this sequence — nothing to
// advance if no room ever fit.
export const BOOKING_STATUSES = [
  "tentatively_assigned",
  "foc_pending",
  "foc_approved",
  "confirmed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number] | "no_venue_available";

// Columns beyond event/headcount mirror ANU's own Venue Hire Request Form
// field-for-field (its "Contact Information" and "Event Information"
// sections) — the actual information the real Venue Hire team says it needs
// before it can act on a request, not a guess at what a form might ask.
export const bookingRequests = sqliteTable("booking_requests", {
  id: int().primaryKey({ autoIncrement: true }),
  event: text().notNull(),
  headcount: int().notNull(),
  preferredBuilding: text("preferred_building"),
  venueId: int("venue_id").references(() => venues.id),
  status: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),

  contactName: text("contact_name").notNull().default(""),
  organisation: text().notNull().default(""),
  phone: text().notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  address: text().notNull().default(""),

  eventDate: text("event_date").notNull().default(""),
  setupTime: text("setup_time").notNull().default(""),
  startTime: text("start_time").notNull().default(""),
  conclusionTime: text("conclusion_time").notNull().default(""),
  packDownTime: text("pack_down_time").notNull().default(""),
  vipAttendance: text("vip_attendance").notNull().default(""),
  description: text().notNull().default(""),
  foodBeverage: text("food_beverage").notNull().default(""),
  venueSetup: text("venue_setup").notNull().default(""),
  avRequirements: text("av_requirements").notNull().default(""),
});

export type BookingRequest = typeof bookingRequests.$inferSelect;
