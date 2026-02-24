"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Facility = {
  id: number;
  name: string;
  capacity: number;
  description: string;
};

type Booking = {
  facility_id: number;
  session: string;
};

export default function BookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFacility, setSelectedFacility] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["FORENOON"]);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch("/api/facilities");
        if (res.ok) {
          const data = await res.json();
          setFacilities(data);
          if (data.length > 0) {
            setSelectedFacility(data[0].id.toString());
          }
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

  const isSlotTaken = (session: string) => {
    return existingBookings.some(
      (b) => b.facility_id === parseInt(selectedFacility) && b.session === session
    );
  };

  const selectedFacilityObj = facilities.find(f => f.id.toString() === selectedFacility);

  const toggleSession = (session: string) => {
    setSelectedSessions(prev =>
      prev.includes(session) ? prev.filter(s => s !== session) : [...prev, session]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (selectedSessions.length === 0) {
      setError("Please select at least one session.");
      return;
    }
    setSubmitting(true);

    try {
      const results = await Promise.all(
        selectedSessions.map(session =>
          fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              facilityId: parseInt(selectedFacility),
              date: selectedDate,
              session,
            }),
          })
        )
      );

      const failed = await Promise.all(
        results.map(async (res) => {
          if (!res.ok) return (await res.json()).error || "Failed to book facility";
          return null;
        })
      );

      const errors = failed.filter(Boolean);
      if (errors.length === 0) {
        const label = selectedSessions.length === 2 ? "Both sessions" : selectedSessions[0] === "FORENOON" ? "Forenoon session" : "Afternoon session";
        setSuccess(`🎉 ${label} booked successfully!`);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setError(errors.map(e => e === "Slot already booked" ? "One or more slots are already booked." : e).join(" "));
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

          {/* Session selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <p className="text-xs text-gray-400 mb-2">You can select one or both sessions.</p>
            <div className="grid grid-cols-2 gap-3">
              {(["FORENOON", "AFTERNOON"] as const).map((session) => {
                const taken = isSlotTaken(session);
                const selected = selectedSessions.includes(session);
                return (
                  <button
                    key={session}
                    type="button"
                    disabled={taken}
                    onClick={() => !taken && toggleSession(session)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                      taken
                        ? "border-red-200 bg-red-50 cursor-not-allowed opacity-60"
                        : selected
                        ? "border-[#E54B3F] bg-red-50"
                        : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
                    }`}
                  >
                    <span className="text-xl mb-1">{session === "FORENOON" ? "🌅" : "🌇"}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {session === "FORENOON" ? "Forenoon" : "Afternoon"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session === "FORENOON" ? "9:00 AM – 1:00 PM" : "2:00 PM – 5:00 PM"}
                    </span>
                    {taken && (
                      <span className="mt-2 text-xs font-semibold text-red-600">Already Booked</span>
                    )}
                    {selected && !taken && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-[#E54B3F] rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
                  <dt>Session:</dt>
                  <dd className="font-medium text-gray-800">
                    {selectedSessions.length === 0
                      ? "None selected"
                      : selectedSessions.length === 2
                      ? "Full Day (Forenoon + Afternoon)"
                      : selectedSessions[0] === "FORENOON"
                      ? "Forenoon (9:00 AM – 1:00 PM)"
                      : "Afternoon (2:00 PM – 5:00 PM)"}
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
              disabled={submitting || selectedSessions.length === 0 || selectedSessions.every(s => isSlotTaken(s))}
              className={`flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#E54B3F] hover:bg-[#d43d32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E54B3F] transition-colors ${
                (submitting || selectedSessions.length === 0 || selectedSessions.every(s => isSlotTaken(s))) ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming...
                </>
              ) : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
