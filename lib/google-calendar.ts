import { google } from "googleapis";
import { getGoogleAuth } from "./google-auth";

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  location: string;
  startDateTime: string; // ISO
  endDateTime: string; // ISO
}): Promise<string | null> {
  const auth = getGoogleAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!auth || !calendarId) {
    console.warn(
      "Google Calendar not configured — skipping calendar sync. See README to enable it."
    );
    return null;
  }

  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: { dateTime: params.startDateTime },
      end: { dateTime: params.endDateTime },
    },
  });

  return res.data.id || null;
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = getGoogleAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!auth || !calendarId) return;

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId, eventId });
}
