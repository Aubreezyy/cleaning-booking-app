"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  service_name: string;
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(adminKey: string) {
    setLoading(true);
    const res = await fetch(`/api/bookings?admin_key=${adminKey}`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
      setUnlocked(true);
    } else {
      alert("Incorrect admin key");
    }
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/bookings/${id}?admin_key=${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    load(key);
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen font-body">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(key);
          }}
          className="p-8 bg-chalk rounded-md border border-sage-100 w-full max-w-sm"
        >
          <h1 className="font-display text-xl text-ink mb-4">
            Admin dashboard
          </h1>
          <input
            type="password"
            placeholder="Admin key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-2.5 rounded-md border border-sage-100 mb-3"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-md bg-sage-500 text-chalk font-medium"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen font-body p-6 sm:p-10">
      <h1 className="font-display text-2xl text-ink mb-6">
        Upcoming bookings
      </h1>
      <div className="space-y-3 max-w-3xl">
        {bookings.length === 0 && (
          <p className="text-slate">No bookings yet.</p>
        )}
        {bookings.map((b) => (
          <div
            key={b.id}
            className={`p-4 rounded-md border bg-chalk ${
              b.status === "cancelled"
                ? "border-sage-100 opacity-50"
                : "border-sage-100"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-ink">
                  {b.service_name} — {b.customer_name}
                </p>
                <p className="text-sm text-slate">
                  {b.booking_date} · {b.start_time.slice(0, 5)}-
                  {b.end_time.slice(0, 5)}
                </p>
                <p className="text-sm text-slate">{b.address}</p>
                <p className="text-sm text-slate">
                  {b.customer_phone} · {b.customer_email}
                </p>
                {b.notes && (
                  <p className="text-sm text-slate italic mt-1">
                    "{b.notes}"
                  </p>
                )}
              </div>
              {b.status !== "cancelled" && (
                <button
                  onClick={() => cancelBooking(b.id)}
                  className="text-sm text-red-600 hover:underline whitespace-nowrap ml-4"
                >
                  Cancel
                </button>
              )}
              {b.status === "cancelled" && (
                <span className="text-xs text-slate">Cancelled</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
