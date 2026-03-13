"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { MonthlyCalendar } from "@/components/monthly-calendar";

type Booking = {
  id: number;
  facility_id: number;
  facility_name: string;
  user_name: string;
  department: string;
  booking_date: string;
  session: string;
  status: string;
  purpose: string;
};

type Facility = {
  id: number;
  name: string;
  capacity: number;
  description: string;
};

function SkeletonCard() {
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-3 bg-gray-100 rounded w-56"></div>
        </div>
        <div className="h-5 bg-gray-100 rounded-full w-28"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {[0, 1].map((s) => (
          <div key={s} className="p-5 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [filterFacility, setFilterFacility] = useState("all");
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [monthlyBookings, setMonthlyBookings] = useState<Booking[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  useEffect(() => {
    if (filterFacility === "all") {
      setMonthlyBookings([]);
      return;
    }

    async function fetchMonthlyBookings() {
      setMonthlyLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("facilityId", filterFacility);
        params.set("month", format(calendarMonth, "yyyy-MM"));

        const res = await fetch(`/api/bookings?${params.toString()}`);
        if (res.ok) setMonthlyBookings(await res.json());
      } catch (error) {
        console.error("Failed to fetch monthly bookings", error);
      } finally {
        setMonthlyLoading(false);
      }
    }
    fetchMonthlyBookings();
  }, [filterFacility, calendarMonth]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [facilitiesRes] = await Promise.all([
          fetch("/api/facilities"),
        ]);
        if (facilitiesRes.ok) setFacilities(await facilitiesRes.json());
      } catch (error) {
        console.error("Failed to fetch facilities", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchBookings() {
      setBookingsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterFacility !== "all") params.set("facilityId", filterFacility);
        if (filterDate) params.set("date", filterDate);

        const res = await fetch(`/api/bookings?${params.toString()}`);
        if (res.ok) setBookings(await res.json());
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setBookingsLoading(false);
      }
    }
    fetchBookings();
  }, [filterFacility, filterDate]);

  const displayFacilities = filterFacility === "all"
    ? facilities
    : facilities.filter(f => f.id === parseInt(filterFacility));

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-[#87AFF4] rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-7 bg-blue-300 rounded w-56 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-80"></div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-28"></div>
              <div className="h-9 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="flex items-end">
              <div className="h-9 w-20 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Card skeletons */}
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#87AFF4] rounded-xl p-6 text-white shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold">Real-Time Availability</h1>
        <p className="mt-1 text-blue-100 text-sm">
          View slot availability across all facilities in real-time.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Filter by Facility</label>
            <select
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
              value={filterFacility}
              onChange={(e) => setFilterFacility(e.target.value)}
            >
              <option value="all">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Filter by Date</label>
            <input
              type="date"
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterFacility("all"); setFilterDate(format(new Date(), "yyyy-MM-dd")); }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <p className="text-xs text-gray-400">
        <span className="inline-block w-3 h-3 rounded-sm bg-green-400 mr-1 align-middle"></span>Available&nbsp;
        <span className="inline-block w-3 h-3 rounded-sm bg-red-500 mr-1 align-middle ml-2"></span>Booked&nbsp;
        <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1 align-middle ml-2"></span>Pending
      </p>

      {/* Availability Grid */}
      <div className="grid grid-cols-1 gap-4">
        {bookingsLoading ? (
          Array.from({ length: displayFacilities.length || 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : displayFacilities.map((facility) => {

          return (
            <div key={facility.id} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                  {facility.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{facility.description}</p>
                  )}
                </div>
                {facility.capacity && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    👥 Capacity: {facility.capacity}
                  </span>
                )}
              </div>
              <div className="p-5">
                {/* Minute-Precise Timeline */}
                {(() => {
                  const DAY_START = 8 * 60;  // 08:00 in minutes
                  const DAY_END   = 18 * 60; // 18:00 in minutes
                  const DAY_SPAN  = DAY_END - DAY_START;

                  const toMinutes = (t: string) => {
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                  };

                  const toPercent = (mins: number) =>
                    Math.min(100, Math.max(0, ((mins - DAY_START) / DAY_SPAN) * 100));

                  const facilityBookings = bookings.filter(b => b.facility_id === facility.id);
                  const ticks = Array.from({ length: 11 }, (_, i) => i + 8);

                  return (
                    <div className="mb-4">
                      {/* Bar */}
                      <div className="relative h-8 rounded-lg overflow-hidden border border-gray-200 bg-green-100">
                        {facilityBookings.map((b, idx) => {
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

                {/* Details of Bookings */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bookings.filter(b => b.facility_id === facility.id).map((booking, idx) => {
                    const [bStart, bEnd] = booking.session.split('-');
                    const isPending = booking.status === 'APPROVAL_PENDING';
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${isPending ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[11px] font-bold text-gray-800">{bStart} – {bEnd}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isPending ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {isPending ? 'Pending' : 'Booked'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{booking.user_name}</p>
                        <p className="text-xs text-gray-500">{booking.department}</p>
                        {booking.purpose && (
                          <p className="text-xs text-gray-600 mt-1 italic truncate" title={booking.purpose}>"{booking.purpose}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!bookingsLoading && displayFacilities.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No facilities found.</p>
        </div>
      )}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Monthly Calendar Overview</h2>
          <p className="text-sm text-gray-500">View overall booking status over the entire month.</p>
        </div>

        {filterFacility === "all" ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-2">
              <span className="text-xl">📅</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">Select a specific facility.</p>
            <p className="text-sm text-gray-400 max-w-sm">Please choose a facility from the dropdown filter above to view its detailed monthly availability calendar.</p>
          </div>
        ) : (
          <div className="relative">
            {monthlyLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E54B3F]"></div>
              </div>
            )}
            <MonthlyCalendar
              facilityName={facilities.find(f => f.id.toString() === filterFacility)?.name || ""}
              bookings={monthlyBookings}
              currentMonth={calendarMonth}
              onPrevMonth={() => setCalendarMonth(prev => subMonths(prev, 1))}
              onNextMonth={() => setCalendarMonth(prev => addMonths(prev, 1))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
