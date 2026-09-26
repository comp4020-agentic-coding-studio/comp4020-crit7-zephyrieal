import type { APIRoute } from "astro";
import { createBooking } from "../../lib/db";

// A plain HTML form POSTs here; the 303 redirect makes it work with no
// client-side JavaScript at all — the tab re-renders from SQLite.
// Field names mirror ANU's own Venue Hire Request Form (Contact Information
// + Event Information) — only `event` and `headcount` are load-bearing for
// the assignment logic, the rest just carries through to storage.
const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const event = field(form, "event");
  const headcount = Number(form.get("headcount"));
  const preferredBuilding = field(form, "building") || undefined;

  if (event && Number.isInteger(headcount) && headcount > 0) {
    createBooking({
      event,
      headcount,
      preferredBuilding,
      contactName: field(form, "contactName"),
      organisation: field(form, "organisation"),
      phone: field(form, "phone"),
      contactEmail: field(form, "contactEmail"),
      address: field(form, "address"),
      eventDate: field(form, "eventDate"),
      setupTime: field(form, "setupTime"),
      startTime: field(form, "startTime"),
      conclusionTime: field(form, "conclusionTime"),
      packDownTime: field(form, "packDownTime"),
      vipAttendance: field(form, "vipAttendance"),
      description: field(form, "description"),
      foodBeverage: field(form, "foodBeverage"),
      venueSetup: field(form, "venueSetup"),
      avRequirements: field(form, "avRequirements"),
    });
  }

  return redirect("/requests", 303);
};
