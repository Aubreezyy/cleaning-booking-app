"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number | null;
};

type Slot = { start: string; end: string };

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function nextNDates(n: number) {
  const dates: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push(nd.toISOString().slice(0, 10));
  }
  return dates;
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    address: "",
    notes: "",
    recurring: "none",
  });

  const dates = nextNDates(21);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []));
  }, []);

  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(
      `/api/availability?date=${selectedDate}&service_id=${selectedService}`
    )
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setErrorMsg("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedService,
        booking_date: selectedDate,
        start_time: selectedSlot.start,
        ...form,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(data.error || "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  const selectedServiceObj = services.find((s) => s.id === selectedService);

  if (success) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8 bg-linen font-body">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-sage-500 text-chalk flex items-center justify-center mx-auto mb-5 text-2xl">
            ✓
          </div>
          <h2 className="font-display text-2xl text-ink mb-2">
            You're booked
          </h2>
          <p className="text-slate">
            {selectedServiceObj?.name} on{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "long", month: "long", day: "numeric" }
            )}{" "}
            at {selectedSlot && formatTime(selectedSlot.start)}.
          </p>
          <p className="text-slate mt-2 text-sm">
            A confirmation has been sent to {form.customer_email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linen font-body p-6 sm:p-10 max-w-xl mx-auto">
      <div className="mb-8">
        <p className="text-sage-500 text-xs tracking-widest uppercase mb-1">
          Reliance General Cleaning Services
        </p>
        <h1 className="font-display text-3xl text-ink">Book your cleaning</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs text-slate">
        {["Service", "Date & time", "Your details"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > i + 1
                  ? "bg-sage-500 text-chalk"
                  : step === i + 1
                  ? "bg-citrus text-ink"
                  : "bg-sage-100 text-slate"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === i + 1 ? "text-ink font-medium" : ""}>
              {label}
            </span>
            {i < 2 && <span className="w-4 h-px bg-sage-100" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {services.length === 0 && (
            <p className="text-slate text-sm">Loading services…</p>
          )}
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s.id);
                setStep(2);
              }}
              className="w-full text-left p-4 rounded-md border border-sage-100 bg-chalk hover:border-sage-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-sm text-slate mt-0.5">{s.description}</p>
                </div>
                {s.price_cents && (
                  <p className="text-sage-700 font-medium whitespace-nowrap ml-4">
                    ${(s.price_cents / 100).toFixed(0)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="text-sm text-slate mb-4 hover:text-ink"
          >
            ← Back
          </button>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {dates.map((d) => {
              const dateObj = new Date(d + "T00:00:00");
              const isSelected = d === selectedDate;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 w-16 py-2 rounded-md border text-center ${
                    isSelected
                      ? "bg-sage-500 border-sage-500 text-chalk"
                      : "border-sage-100 bg-chalk text-ink hover:border-sage-500"
                  }`}
                >
                  <div className="text-[10px] uppercase opacity-80">
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-medium">
                    {dateObj.getDate()}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div>
              {loadingSlots && (
                <p className="text-slate text-sm">Checking availability…</p>
              )}
              {!loadingSlots && slots.length === 0 && (
                <p className="text-slate text-sm">
                  No openings that day — try another date.
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => {
                      setSelectedSlot(s);
                      setStep(3);
                    }}
                    className="py-2 rounded-md border border-sage-100 bg-chalk text-sm hover:border-sage-500"
                  >
                    {formatTime(s.start)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedSlot && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-sm text-slate mb-1 hover:text-ink"
          >
            ← Back
          </button>

          <div className="p-3 rounded-md bg-sage-50 text-sm text-sage-700">
            {selectedServiceObj?.name} ·{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" }
            )}{" "}
            · {formatTime(selectedSlot.start)}
          </div>

          <div>
            <label className="text-sm text-ink block mb-1">Full name</label>
            <input
              required
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-ink block mb-1">Email</label>
            <input
              required
              type="email"
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              value={form.customer_email}
              onChange={(e) =>
                setForm({ ...form, customer_email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-ink block mb-1">Phone</label>
            <input
              required
              type="tel"
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              value={form.customer_phone}
              onChange={(e) =>
                setForm({ ...form, customer_phone: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-ink block mb-1">
              Address to clean
            </label>
            <input
              required
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-ink block mb-1">
              Repeat this booking?
            </label>
            <select
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              value={form.recurring}
              onChange={(e) =>
                setForm({ ...form, recurring: e.target.value })
              }
            >
              <option value="none">Just once</option>
              <option value="weekly">Every week</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Every month</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-ink block mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full p-2.5 rounded-md border border-sage-100 bg-chalk"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-md bg-sage-500 text-chalk font-medium hover:bg-sage-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
