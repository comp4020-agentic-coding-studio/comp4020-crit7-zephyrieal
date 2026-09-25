import type { APIRoute } from "astro";
import { createBooking } from "../../lib/db";

// A plain HTML form POSTs here; the 303 redirect makes it work with no
// client-side JavaScript at all — the tab re-renders from SQLite.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const event = String(form.get("event") ?? "").trim();
  const headcount = Number(form.get("headcount"));
  const preferredBuilding = String(form.get("building") ?? "").trim() || undefined;

  if (event && Number.isInteger(headcount) && headcount > 0) {
    createBooking({ event, headcount, preferredBuilding });
  }

  return redirect("/", 303);
};
