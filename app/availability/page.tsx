"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Booking = {
  id: number;
  facility_id: number;
  facility_name: string;
  user_name: string;
  department: string;
  booking_date: string;
  session: string;
  status: string;
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

  const isBooked = (facilityId: number, session: "FORENOON" | "AFTERNOON") => {
    return bookings.find(
      (b) => b.facility_id === facilityId && b.session === session
    );
  };

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
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-red-400"></div>
          <span className="text-gray-600">Booked</span>
        </div>
      </div>

      {/* Availability Grid */}
      <div className="grid grid-cols-1 gap-4">
        {bookingsLoading ? (
          Array.from({ length: displayFacilities.length || 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : displayFacilities.map((facility) => {
          const fnBooking = isBooked(facility.id, "FORENOON");
          const anBooking = isBooked(facility.id, "AFTERNOON");

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
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {/* Forenoon slot */}
                <div className={`p-5 ${fnBooking ? "bg-red-50" : "bg-green-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">🌅 Forenoon</p>
                      <p className="text-xs text-gray-500 mt-0.5">9:00 AM – 1:00 PM</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      fnBooking ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {fnBooking ? "Booked" : "Available"}
                    </span>
                  </div>
                  {fnBooking && (
                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-gray-700">{fnBooking.user_name}</p>
                      <p className="text-xs text-gray-400">{fnBooking.department}</p>
                    </div>
                  )}
                </div>
                {/* Afternoon slot */}
                <div className={`p-5 ${anBooking ? "bg-red-50" : "bg-green-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">🌇 Afternoon</p>
                      <p className="text-xs text-gray-500 mt-0.5">2:00 PM – 5:00 PM</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      anBooking ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {anBooking ? "Booked" : "Available"}
                    </span>
                  </div>
                  {anBooking && (
                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-gray-700">{anBooking.user_name}</p>
                      <p className="text-xs text-gray-400">{anBooking.department}</p>
                    </div>
                  )}
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
    </div>
  );
}
