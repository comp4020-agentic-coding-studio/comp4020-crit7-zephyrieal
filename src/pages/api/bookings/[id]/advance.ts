import type { APIRoute } from "astro";
import { advanceBooking } from "../../../../lib/db";

// Stands in for the email round-trip (submit FOC form, wait, forward the
// reply) as a single step forward through the workflow.
export const POST: APIRoute = async ({ params, redirect }) => {
  const id = Number(params.id);
  if (Number.isInteger(id)) advanceBooking(id);
  return redirect("/requests", 303);
};
