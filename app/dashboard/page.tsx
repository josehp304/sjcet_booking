"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import Link from "next/link";
import { formatSession, getSessionColor } from "@/lib/utils";

type Booking = {
  id: number;
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, facilitiesRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/facilities"),
        ]);
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (facilitiesRes.ok) setFacilities(await facilitiesRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E54B3F]"></div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#87AFF4] rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p className="mt-1 text-blue-100 text-sm">
              {user?.department} · {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center px-5 py-2.5 bg-[#E54B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#d43d32] transition-colors shadow-md"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Link>
        </div>
      </div>


      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Facilities list — PRIMARY (col-span-2) */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Available Facilities</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {facilities.map((facility) => (
              <li key={facility.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{facility.name}</p>
                    {facility.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{facility.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {facility.capacity && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                        Cap: {facility.capacity}
                      </span>
                    )}
                    <Link
                      href={`/book?facility=${facility.id}`}
                      className="px-3 py-1.5 bg-[#E54B3F] text-white text-xs font-semibold rounded-lg hover:bg-[#d43d32] transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Bookings — SECONDARY (col-span-1, collapsible) */}
        <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200 self-start">
          <button
            onClick={() => setBookingsOpen((o) => !o)}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-base font-semibold text-gray-900">Recent Bookings</span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${bookingsOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {bookingsOpen && (
            <div className="border-t border-gray-100">
              {bookings.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">
                  No bookings yet.{" "}
                  <Link href="/book" className="text-[#E54B3F] font-medium hover:underline">Make the first one!</Link>
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                  {bookings.slice(0, 8).map((booking) => (
                    <li key={booking.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{booking.facility_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5" title={booking.purpose || ""}>
                            {booking.purpose || "—"}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "APPROVAL_PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {booking.status === "APPROVAL_PENDING" ? "Pending" : booking.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-5 py-3 border-t border-gray-100">
                <Link href="/availability" className="block w-full text-center py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  View All →
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
