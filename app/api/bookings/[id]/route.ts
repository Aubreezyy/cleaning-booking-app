import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus, getAllBookings } from "@/lib/google-sheets";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const adminKey = searchParams.get("admin_key");
  if (adminKey !== process.env.ADMIN_DASHBOARD_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    if (body.status === "cancelled") {
      const bookings = await getAllBookings();
      const existing = bookings.find((b) => b.id === params.id);
      if (existing?.google_event_id) {
        try {
          await deleteCalendarEvent(existing.google_event_id);
        } catch (e) {
          console.error("Failed to remove calendar event:", e);
        }
      }
    }

    const updated = await updateBookingStatus(params.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ booking: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
