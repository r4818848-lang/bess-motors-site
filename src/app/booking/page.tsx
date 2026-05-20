"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { serviceCategories, timeSlots } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { Button } from "@/components/ui/Button";
import { loadDb, saveDb } from "@/lib/store";

export default function BookingPage() {
  const { t, locale } = useI18n();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    const db = loadDb();
    const userId = db.currentUserId ?? "guest";
    const vehicle = db.vehicles.find((v) => v.userId === userId);
    db.appointments.push({
      id: `apt-${Date.now()}`,
      userId,
      vehicleId: vehicle?.id ?? "",
      serviceIds: serviceId ? [serviceId] : ["diagnostic"],
      date: date?.toISOString().slice(0, 10) ?? "",
      time,
      mechanicId: db.mechanics[0]?.id ?? "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    saveDb(db);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-red rounded-2xl p-12 text-center neon-border"
        >
          <Check className="w-16 h-16 text-bm-red mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-glow">{t.booking.success}</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">{t.booking.title}</h1>
        <p className="mt-2 text-sm text-bm-muted">{siteConfig.workingHours}</p>
        <div className="mt-4 h-1 w-24 bg-bm-red" />

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <label className="block text-sm uppercase tracking-wide text-bm-red mb-3">
                {t.booking.selectService}
              </label>
              <select
                className="input-premium"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">—</option>
                {serviceCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t.serviceItems[c.id as keyof typeof t.serviceItems]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide text-bm-red mb-3">
                {t.booking.selectTime}
              </label>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                      time === slot
                        ? "bg-bm-red text-white shadow-neon-sm"
                        : "glass hover:border-bm-red/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide text-bm-muted mb-3">
                {t.booking.comment}
              </label>
              <textarea
                className="input-premium min-h-[80px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-wide text-bm-red mb-3">
              {t.booking.selectDate}
            </label>
            <BookingCalendar selected={date} onSelect={setDate} locale={locale} />
            <Button
              className="w-full mt-8"
              disabled={!serviceId || !date || !time}
              onClick={handleSubmit}
            >
              {t.booking.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
