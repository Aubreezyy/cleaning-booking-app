import { google, sheets_v4 } from "googleapis";
import { randomUUID } from "crypto";
import { getGoogleAuth } from "./google-auth";

function client(): sheets_v4.Sheets {
  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error(
      "Google service account not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }
  return google.sheets({ version: "v4", auth });
}

function sheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not set.");
  return id;
}

export type ServiceRow = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number | null;
  active: boolean;
};

export type BusinessHoursRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  max_concurrent_jobs: number;
};

export type BookingRow = {
  rowNumber: number; // 1-indexed sheet row, for updates
  id: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  notes: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  recurring: string;
  google_event_id: string;
  created_at: string;
};

export async function getServices(): Promise<ServiceRow[]> {
  const sheets = client();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "Services!A2:F1000",
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id: String(r[0]),
      name: String(r[1] || ""),
      description: String(r[2] || ""),
      duration_minutes: Number(r[3]) || 120,
      price_cents: r[4] ? Number(r[4]) : null,
      active: String(r[5] ?? "TRUE").toUpperCase() !== "FALSE",
    }))
    .filter((s) => s.active);
}

export async function getService(serviceId: string): Promise<ServiceRow | null> {
  const services = await getServices();
  return services.find((s) => s.id === serviceId) || null;
}

export async function getBusinessHours(weekday: number): Promise<BusinessHoursRow[]> {
  const sheets = client();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "BusinessHours!A2:D1000",
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0] !== undefined && r[0] !== "" && Number(r[0]) === weekday)
    .map((r) => ({
      weekday: Number(r[0]),
      start_time: String(r[1]),
      end_time: String(r[2]),
      max_concurrent_jobs: Number(r[3]) || 1,
    }));
}

export async function isDateBlocked(dateStr: string): Promise<boolean> {
  const sheets = client();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "BlockedDates!A2:B1000",
  });
  const rows = res.data.values || [];
  return rows.some((r) => String(r[0]).trim() === dateStr);
}

export async function getBookingsForDate(dateStr: string): Promise<BookingRow[]> {
  const all = await getAllBookings();
  return all.filter((b) => b.booking_date === dateStr);
}

export async function getAllBookings(): Promise<BookingRow[]> {
  const sheets = client();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: "Bookings!A2:P100000",
  });
  const rows = res.data.values || [];
  return rows
    .map((r, idx) => ({
      rowNumber: idx + 2, // +2: 1-indexed, plus header row
      id: String(r[0] || ""),
      service_id: String(r[1] || ""),
      service_name: String(r[2] || ""),
      duration_minutes: Number(r[3]) || 0,
      customer_name: String(r[4] || ""),
      customer_email: String(r[5] || ""),
      customer_phone: String(r[6] || ""),
      address: String(r[7] || ""),
      notes: String(r[8] || ""),
      booking_date: String(r[9] || ""),
      start_time: String(r[10] || ""),
      end_time: String(r[11] || ""),
      status: String(r[12] || "confirmed"),
      recurring: String(r[13] || "none"),
      google_event_id: String(r[14] || ""),
      created_at: String(r[15] || ""),
    }))
    .filter((b) => b.id);
}

export async function appendBooking(input: {
  service_id: string;
  service_name: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  notes: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  recurring: string;
}): Promise<string> {
  const sheets = client();
  const id = randomUUID();
  const row = [
    id,
    input.service_id,
    input.service_name,
    input.duration_minutes,
    input.customer_name,
    input.customer_email,
    input.customer_phone,
    input.address,
    input.notes,
    input.booking_date,
    input.start_time,
    input.end_time,
    "confirmed",
    input.recurring,
    "",
    new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: "Bookings!A2",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return id;
}

export async function setBookingGoogleEventId(bookingId: string, eventId: string) {
  const bookings = await getAllBookings();
  const match = bookings.find((b) => b.id === bookingId);
  if (!match) return;
  const sheets = client();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `Bookings!O${match.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[eventId]] },
  });
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<BookingRow | null> {
  const bookings = await getAllBookings();
  const match = bookings.find((b) => b.id === bookingId);
  if (!match) return null;

  const sheets = client();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `Bookings!M${match.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[status]] },
  });

  return { ...match, status };
}
