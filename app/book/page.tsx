"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Facility = {
  id: number;
  name: string;
  capacity: number;
  description: string;
  features: string[];
  custodian_id: number | null;
  custodian_name: string | null;
  custodian_department: string | null;
};

type Booking = {
  facility_id: number;
  session: string;
  status: string;
};

export default function BookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFacility, setSelectedFacility] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");



  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch("/api/facilities");
        if (res.ok) {
          const data = await res.json();
          setFacilities(data);
          const paramFacility = searchParams.get("facility");
          const match = paramFacility && data.find((f: Facility) => f.id.toString() === paramFacility);
          setSelectedFacility(match ? paramFacility : data[0]?.id.toString() ?? "");
        }
      } catch (error) {
        console.error("Failed to fetch facilities", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFacilities();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(format(tomorrow, "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchBookingsForDate() {
      try {
        const res = await fetch(`/api/bookings?date=${selectedDate}`);
        if (res.ok) setExistingBookings(await res.json());
      } catch (err) {
        console.error("Failed to fetch bookings for date");
      }
    }
    fetchBookingsForDate();
  }, [selectedDate]);

  const isSlotTaken = (slotStart: string, slotEnd: string) => {
    return existingBookings.some((b) => {
      if (b.facility_id !== parseInt(selectedFacility)) return false;
      const [bStart, bEnd] = b.session.split('-');
      if (!bStart || !bEnd) return false;
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  const getSlotBookingStatus = (slotStart: string, slotEnd: string) => {
    const booking = existingBookings.find((b) => {
      if (b.facility_id !== parseInt(selectedFacility)) return false;
      const [bStart, bEnd] = b.session.split('-');
      if (!bStart || !bEnd) return false;
      return bStart < slotEnd && bEnd > slotStart;
    });
    return booking?.status;
  };

  const selectedFacilityObj = facilities.find(f => f.id.toString() === selectedFacility);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!startTime || !endTime) {
      setError("Please select both start and end times.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    if (isSlotTaken(startTime, endTime)) {
      setError("The selected time overlaps with an existing booking.");
      return;
    }
    
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: parseInt(selectedFacility),
          date: selectedDate,
          session: `${startTime}-${endTime}`,
          purpose,
          phoneNumber,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const isPending = data.status === 'APPROVAL_PENDING';
        const custodian = selectedFacilityObj?.custodian_name;
        setSuccess(isPending
          ? `📋 Booking request sent to ${custodian ? custodian + ' (Custodian)' : 'the admin'} for approval.`
          : `🎉 Booked successfully!`);
        setTimeout(() => router.push("/dashboard"), 2500);
      } else {
         setError(data.error === 'Slot already booked or overlaps with an existing booking' ? 'The selected time slot overlaps with an existing booking.' : (data.error || "An error occurred."));
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E54B3F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-[#87AFF4] rounded-xl p-6 text-white shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold">Book a Facility</h1>
        <p className="mt-1 text-blue-100 text-sm">
          Select a facility, date, and session to confirm your booking.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Facility select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Facility
            </label>
            <select
              required
              className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
            >
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}{facility.capacity ? ` (Cap: ${facility.capacity})` : ""}
                </option>
              ))}
            </select>
            {selectedFacilityObj?.description && (
              <p className="mt-1 text-xs text-gray-400">{selectedFacilityObj.description}</p>
            )}
            {selectedFacilityObj?.features && selectedFacilityObj.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedFacilityObj.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
            {/* Custodian / Approval notice */}
            {selectedFacilityObj && user?.role !== 'ADMIN' && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-amber-500 mt-0.5">🔑</span>
                <p className="text-xs text-amber-700">
                  {selectedFacilityObj.custodian_name
                    ? <>Booking requests for this facility are reviewed by <strong>{selectedFacilityObj.custodian_name}</strong>{selectedFacilityObj.custodian_department ? ` (${selectedFacilityObj.custodian_department})` : ''} before confirmation.</>
                    : <>No custodian assigned. Booking requests will be reviewed by the <strong>Admin</strong>.</>
                  }
                </p>
              </div>
            )}
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          {/* Timeline and Session selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Availability
            </label>
            <p className="text-xs text-gray-400 mb-3">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-400 mr-1 align-middle"></span>Available&nbsp;
              <span className="inline-block w-3 h-3 rounded-sm bg-red-500 mr-1 align-middle ml-2"></span>Booked&nbsp;
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1 align-middle ml-2"></span>Pending&nbsp;
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-400 mr-1 align-middle ml-2"></span>Your selection
            </p>

            {/* Continuous Minute-Precise Timeline */}
            {(() => {
              const DAY_START = 8 * 60;   // 08:00 in minutes
              const DAY_END   = 18 * 60;  // 18:00 in minutes
              const DAY_SPAN  = DAY_END - DAY_START; // 600 minutes

              const toMinutes = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
              };

              const toPercent = (mins: number) =>
                Math.min(100, Math.max(0, ((mins - DAY_START) / DAY_SPAN) * 100));

              // Collect relevant bookings for the selected facility
              const relevantBookings = existingBookings.filter(
                (b) => b.facility_id === parseInt(selectedFacility)
              );

              // Current selection overlay
              const selStart = startTime ? toMinutes(startTime) : null;
              const selEnd   = endTime   ? toMinutes(endTime)   : null;
              const selLeft  = selStart !== null ? toPercent(selStart) : null;
              const selWidth = (selStart !== null && selEnd !== null && selEnd > selStart)
                ? toPercent(selEnd) - toPercent(selStart)
                : null;

              // Hour tick labels: 8 AM … 6 PM
              const ticks = Array.from({ length: 11 }, (_, i) => i + 8);

              return (
                <div className="mb-4">
                  {/* Bar */}
                  <div className="relative h-8 rounded-lg overflow-hidden border border-gray-200 bg-green-100">
                    {/* Booked / Pending segments */}
                    {relevantBookings.map((b, idx) => {
                      const [bStart, bEnd] = b.session.split('-');
                      if (!bStart || !bEnd) return null;
                      const left  = toPercent(toMinutes(bStart));
                      const right = toPercent(toMinutes(bEnd));
                      const width = right - left;
                      if (width <= 0) return null;
                      const isPending = b.status === 'APPROVAL_PENDING';
                      return (
                        <div
                          key={`seg-${idx}`}
                          title={`${bStart}–${bEnd} · ${isPending ? 'Pending Approval' : 'Booked'}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={`absolute inset-y-0 ${isPending ? 'bg-amber-400' : 'bg-red-500'}`}
                        />
                      );
                    })}

                    {/* Selected time overlay */}
                    {selLeft !== null && selWidth !== null && selWidth > 0 && (
                      <div
                        title={`Your selection: ${startTime}–${endTime}`}
                        style={{ left: `${selLeft}%`, width: `${selWidth}%` }}
                        className="absolute inset-y-0 bg-blue-500/70 border-x-2 border-blue-600"
                      />
                    )}

                    {/* Hour divider lines */}
                    {ticks.slice(1, -1).map((h) => (
                      <div
                        key={`tick-${h}`}
                        style={{ left: `${toPercent(h * 60)}%` }}
                        className="absolute inset-y-0 w-px bg-white/40 pointer-events-none"
                      />
                    ))}
                  </div>

                  {/* Hour labels */}
                  <div className="relative h-4 mt-0.5">
                    {ticks.map((h) => {
                      const pct = toPercent(h * 60);
                      const label = h === 12 ? '12P' : h > 12 ? `${h - 12}P` : `${h}A`;
                      return (
                        <span
                          key={`lbl-${h}`}
                          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                          className="absolute text-[9px] text-gray-400 font-medium select-none"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}


            <label className="block text-sm font-medium text-gray-700 mb-1 mt-6">
              Select Custom Time
            </label>
            <p className="text-xs text-gray-400 mb-2">Choose your exact start and end times.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F]"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F]"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Purpose field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              required
              rows={3}
              className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F] resize-none"
              placeholder="Enter the purpose of this booking"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Phone number field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone Number
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              📱 Used to send booking status notifications.
            </p>
            <input
              type="tel"
              required
              pattern="[0-9+\-\s()]{7,20}"
              className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
              placeholder="e.g. +91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* Booking summary */}
          {selectedFacility && selectedDate && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-700 mb-2">Booking Summary</p>
              <dl className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <dt>Facility:</dt>
                  <dd className="font-medium text-gray-800">{selectedFacilityObj?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Date:</dt>
                  <dd className="font-medium text-gray-800">
                    {selectedDate ? format(new Date(selectedDate), "MMMM d, yyyy") : ""}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Time:</dt>
                  <dd className="font-medium text-gray-800 text-right">
                    {startTime && endTime ? (() => {
                      const formatTime = (timeStr: string) => {
                        const [h, m] = timeStr.split(':');
                        const hNum = parseInt(h);
                        const ampm = hNum >= 12 ? 'PM' : 'AM';
                        const h12 = hNum % 12 || 12;
                        return `${h12}:${m} ${ampm}`;
                      };
                      return `${formatTime(startTime)} – ${formatTime(endTime)}`;
                    })() : "None selected"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Booked by:</dt>
                  <dd className="font-medium text-gray-800">{user?.name} ({user?.department})</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1 flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !startTime || !endTime || startTime >= endTime || isSlotTaken(startTime, endTime)}
              className={`flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#E54B3F] hover:bg-[#d43d32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E54B3F] transition-colors ${(submitting || !startTime || !endTime || startTime >= endTime || isSlotTaken(startTime, endTime)) ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming...
                </>
              ) : "Send for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
