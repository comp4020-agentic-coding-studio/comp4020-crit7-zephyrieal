import type { APIRoute } from "astro";
import { listVenues } from "../../lib/db";

// The lookup the whole app is for: which team owns which room, and its
// capacity, in one place instead of five separate inboxes.
export const GET: APIRoute = () => {
  return new Response(JSON.stringify(listVenues()), {
    headers: { "content-type": "application/json" },
  });
};
