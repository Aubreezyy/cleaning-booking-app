// Sends a booking notification email using Resend (https://resend.com).
// Resend has a free tier (100 emails/day, 3,000/month) which is plenty
// for a small cleaning business. See README for the 5-minute setup.

const NOTIFY_EMAIL = "reliancecleaners2015@gmail.com";

type BookingEmailPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
};

export async function sendBookingNotification(payload: BookingEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY not set — skipping email notification. See README to enable emails."
    );
    return;
  }

  const html = `
    <h2>New booking received</h2>
    <p><strong>Service:</strong> ${payload.serviceName}</p>
    <p><strong>Date:</strong> ${payload.date}</p>
    <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
    <hr />
    <p><strong>Customer:</strong> ${payload.customerName}</p>
    <p><strong>Email:</strong> ${payload.customerEmail}</p>
    <p><strong>Phone:</strong> ${payload.customerPhone}</p>
    <p><strong>Address:</strong> ${payload.address}</p>
    ${payload.notes ? `<p><strong>Notes:</strong> ${payload.notes}</p>` : ""}
  `;

  // Notify the business
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "bookings@yourdomain.com",
      to: NOTIFY_EMAIL,
      subject: `New booking: ${payload.customerName} - ${payload.date}`,
      html,
    }),
  });

  // Confirmation to the customer
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "bookings@yourdomain.com",
      to: payload.customerEmail,
      subject: `Your cleaning is booked for ${payload.date}`,
      html: `
        <h2>You're booked!</h2>
        <p>Thanks ${payload.customerName}, your ${payload.serviceName} is confirmed for:</p>
        <p><strong>${payload.date}, ${payload.startTime} - ${payload.endTime}</strong></p>
        <p>Address on file: ${payload.address}</p>
        <p>If anything needs to change, just reply to this email.</p>
      `,
    }),
  });
}
