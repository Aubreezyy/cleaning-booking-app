# Reliance General Cleaning Services — Booking System

Zero-coding-experience setup guide. Follow the steps in order.

## Where bookings actually go

Every booking does **three things** automatically:
1. **Saved to a Google Sheet** you control — open it anytime to see every
   booking in a normal spreadsheet, no login to a separate dashboard needed.
2. **Emails reliancecleaners2015@gmail.com** with the customer's details.
3. **Adds an event to your Google Calendar** (if you complete Step 3 below).

There's also a lightweight `/admin` page in the app for cancelling bookings
(cancelling there also removes the calendar event automatically — cancelling
by editing the Sheet directly won't remove it from Calendar, so use `/admin`
for cancellations).

**Why Google Sheets instead of a database like Supabase:** you already have
to set up a Google account for Calendar syncing, so this reuses that same
setup instead of adding a second technical tool to manage. You get a familiar
spreadsheet you can open and read directly, instead of a database dashboard.
The tradeoff is Sheets is a little slower under very high traffic, but for a
local cleaning company's booking volume it's not a real-world difference.

---

## Step 1 — Put this code on GitHub

1. Go to https://github.com, create a free account if needed.
2. Click **+** (top right) → **New repository**. Name it
   `cleaning-booking-app`, keep it Private → **Create repository**.
3. On the repo page, click **uploading an existing file**.
4. Drag in every file/folder from this project (keep the folder structure).
5. Click **Commit changes**.

## Step 2 — Create the Google Sheet (your database)

1. Go to https://drive.google.com → **New** → **File upload** → upload the
   `sheet-template.xlsx` file included in this project.
2. Right-click the uploaded file in Drive → **Open with** → **Google Sheets**.
   This converts it to a live Google Sheet with 4 tabs: `Bookings`,
   `Services`, `BusinessHours`, `BlockedDates`.
3. Rename the file at the top (e.g. "Reliance General Cleaning Services Bookings").
4. Look at the URL in your browser. It looks like:
   `https://docs.google.com/spreadsheets/d/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**`/edit`
   Copy the long ID part (bolded above) — this is your `GOOGLE_SHEET_ID`,
   needed in Step 4.
5. Leave this tab open, you'll share it with a service account in Step 3.

**To edit prices/services later:** open this Sheet → `Services` tab → edit
cells directly. Changes appear on the booking form immediately, no redeploy.

## Step 3 — Create the Google service account (connects Sheets + Calendar)

1. Go to https://console.cloud.google.com → create a free project (any name).
2. In the search bar at top, search **"Google Sheets API"** → click it →
   **Enable**. Do the same for **"Google Calendar API"**.
3. Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**.
   Any name is fine (e.g. "booking-app"). Skip the optional steps → **Done**.
4. Click the new service account → **Keys** tab → **Add Key** → **Create
   new key** → **JSON** → it downloads a file. Open it in Notepad/TextEdit.
   You need two values from it:
   - `client_email` → this is `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → this is `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (copy the
     entire value including `-----BEGIN PRIVATE KEY-----` and `-----END...`)
5. Go back to your Google Sheet from Step 2 → click **Share** (top right) →
   paste in the `client_email` from above → set permission to **Editor** →
   **Send** (uncheck "Notify people" if it complains it's not a real inbox).
6. **For Calendar sync:** go to https://calendar.google.com → open the
   calendar you want bookings to appear on → **Settings and sharing** →
   **Share with specific people** → add the same `client_email` with
   **"Make changes to events"** permission. Then under "Integrate calendar",
   copy the **Calendar ID** → this is `GOOGLE_CALENDAR_ID`. (Skip this if you
   don't want calendar sync yet — the Sheet + email will still work fine.)

## Step 4 — Set up email notifications (Resend)

1. Go to https://resend.com → sign up free (3,000 emails/month free).
2. **API Keys** → **Create API Key** → copy it → this is `RESEND_API_KEY`.
3. Under **Domains**, verify your own domain if you have one (e.g.
   `reliancecleaners.com`) to send from `bookings@reliancecleaners.com` as
   `RESEND_FROM_EMAIL`. For a quick start without a domain, use Resend's
   default `onboarding@resend.dev` as `RESEND_FROM_EMAIL` while testing.
4. Emails always go **to** reliancecleaners2015@gmail.com — that's already
   built into the code, nothing to configure there.

## Step 5 — Deploy the booking app (Netlify)

This booking app needs its own deployment (it runs a small server to check
availability and save bookings) — it will get its own web address, separate
from your existing site, and you'll embed it into that site in Step 6.

1. Go to https://app.netlify.com → sign up/log in → **Add new site** →
   **Import an existing project** → **GitHub** → select the
   `cleaning-booking-app` repo from Step 1.
2. Netlify should auto-detect the build settings from `netlify.toml` in the
   project (build command `npm run build`). Leave those as-is.
3. Before deploying, click **Add environment variables** and add each of
   these (values from Steps 2–4):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CALENDAR_ID` (if you did Step 3.6)
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_DASHBOARD_KEY` — make up any password, e.g. `reliance2026admin`
4. Click **Deploy site**. After a minute or two you'll get a live link like
   `https://reliance-booking.netlify.app` (you can rename this in **Site
   configuration** → **Change site name**).
5. Visit that link — you should see the booking form. **Make a real test
   booking** and confirm: it appears in your Google Sheet, the email
   arrives, and (if configured) it shows up on your Google Calendar.

Your admin/cancellation page lives at:
`https://reliance-booking.netlify.app/admin`

## Step 6 — Embed it in your existing website

In the site you already built, add this snippet wherever you want the
booking form to appear:

```html
<iframe
  src="https://reliance-booking.netlify.app"
  style="width: 100%; height: 900px; border: none;"
  title="Book a cleaning"
></iframe>
```

Replace the `src` with your actual link from Step 5. If the form ever looks
cut off, increase the `height` value (try 1000–1100 if the "repeat booking"
step gets cramped on mobile).

**Where to paste it, depending on how your site is built:**
- If it's a static HTML site (plain `.html` files), paste the `<iframe>`
  directly into the page's HTML where you want the form, e.g. inside a
  `<section>`.
- **Wix / Squarespace / WordPress / Webflow**: use their "Embed / Custom
  HTML" block and paste the snippet in there.
- If you're not sure what your site is built with, tell me and I'll point
  you to the exact spot.

---

## Testing checklist before going live

Run through this once so nothing surprises the client:
- [ ] Book a real test appointment for each service type
- [ ] Confirm it appears correctly in the `Bookings` tab of the Sheet
- [ ] Confirm the notification email arrives at reliancecleaners2015@gmail.com
- [ ] Confirm the customer confirmation email arrives
- [ ] Confirm the event appears on Google Calendar (if set up)
- [ ] Try booking the same slot twice in two browser tabs — the second
      should be rejected with "no longer available"
- [ ] Cancel a test booking from `/admin` and confirm the calendar event disappears
- [ ] Check the form looks right embedded in the actual website, on both
      desktop and phone

## Editing services, prices, or hours later

No coding needed:
- **Services/prices**: Google Sheet → `Services` tab → edit rows directly.
- **Business hours**: Google Sheet → `BusinessHours` tab.
- **Block off a holiday**: Google Sheet → `BlockedDates` tab → add a row.

Changes reflect on the live booking form immediately.

## Getting help

If a step doesn't work, tell me exactly what page you're on and what you
see, and I'll walk you through it.
