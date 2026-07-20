import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { sendBookingNotification } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import {
  getService,
  appendBooking,
  setBookingGoogleEventId,
  getAllBookings,
} from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    service_id,
    customer_name,
    customer_email,
    customer_phone,
    address,
    notes,
    booking_date,
    start_time,
    recurring,
  } = body;

  if (
    !service_id ||
    !customer_name ||
    !customer_email ||
    !customer_phone ||
    !address ||
    !booking_date ||
    !start_time
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const service = await getService(service_id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Re-validate the slot is still open (protects against double-booking
    // if two people book at the same moment)
    const openSlots = await getAvailableSlots(
      booking_date,
      service.duration_minutes
    );
    const matchingSlot = openSlots.find((s) => s.start === start_time);
    if (!matchingSlot) {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please pick another." },
        { status: 409 }
      );
    }

    const bookingId = await appendBooking({
      service_id: service.id,
      service_name: service.name,
      duration_minutes: service.duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      address,
      notes: notes || "",
      booking_date,
      start_time: matchingSlot.start,
      end_time: matchingSlot.end,
      recurring: recurring || "none",
    });

    // Fire off calendar sync + email, but don't fail the booking if these
    // aren't configured yet or hit a transient error.
    try {
      const eventId = await createCalendarEvent({
        summary: `${service.name} - ${customer_name}`,
        description: `${notes || ""}\nPhone: ${customer_phone}\nEmail: ${customer_email}`.trim(),
        location: address,
        startDateTime: `${booking_date}T${matchingSlot.start}:00`,
        endDateTime: `${booking_date}T${matchingSlot.end}:00`,
      });
      if (eventId) {
        await setBookingGoogleEventId(bookingId, eventId);
      }
    } catch (e) {
      console.error("Calendar sync failed:", e);
    }

    try {
      await sendBookingNotification({
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        address,
        serviceName: service.name,
        date: booking_date,
        startTime: matchingSlot.start,
        endTime: matchingSlot.end,
        notes,
      });
    } catch (e) {
      console.error("Email notification failed:", e);
    }

    return NextResponse.json({ booking: { id: bookingId } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Could not save booking" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminKey = searchParams.get("admin_key");

  if (adminKey !== process.env.ADMIN_DASHBOARD_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await getAllBookings();
    bookings.sort((a, b) =>
      (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time)
    );
    return NextResponse.json({ bookings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
