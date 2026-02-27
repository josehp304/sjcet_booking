"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import Link from "next/link";

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

  const today = format(new Date(), "yyyy-MM-dd");
  const todayBookings = bookings.filter(b => b.booking_date?.startsWith(today));

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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Facilities", value: facilities.length, icon: "🏛️", color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Total Bookings", value: bookings.length, icon: "📋", color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Today's Bookings", value: todayBookings.length, icon: "📅", color: "bg-orange-50 text-orange-700 border-orange-100" },
          { label: "Available Slots", value: facilities.length * 2 - todayBookings.length, icon: "✅", color: "bg-purple-50 text-purple-700 border-purple-100" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings table */}
        <div className="lg:col-span-2 bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Recent Bookings</h3>
            <Link href="/availability" className="text-[#E54B3F] text-sm font-medium hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-sm text-gray-400 text-center">
                      No bookings yet. <Link href="/book" className="text-[#E54B3F] font-medium hover:underline">Make the first one!</Link>
                    </td>
                  </tr>
                ) : (
                  bookings.slice(0, 8).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{booking.facility_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.session === "FORENOON" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700"
                          }`}>
                          {booking.session === "FORENOON" ? "🌅 FN" : "🌇 AN"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{booking.department}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={booking.purpose || ""}>{booking.purpose || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Facilities list */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Available Facilities</h3>
          </div>
          <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {facilities.map((facility) => (
              <li key={facility.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{facility.name}</p>
                    {facility.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{facility.description}</p>
                    )}
                  </div>
                  {facility.capacity && (
                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded flex-shrink-0">
                      {facility.capacity}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link href="/book" className="block w-full text-center py-2 bg-[#E54B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#d43d32] transition-colors">
              Book a Facility
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
