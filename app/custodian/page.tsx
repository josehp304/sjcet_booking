"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import { formatSession, getSessionColor } from "@/lib/utils";

type Booking = {
  id: number;
  facility_id: number;
  facility_name: string;
  user_name: string;
  department: string;
  booking_date: string;
  session: string;
  status: string;
  created_at: string;
  purpose: string;
  custodian_id: number | null;
  custodian_name: string | null;
};

export default function CustodianPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<"pending" | "all">("pending");

  const isCustodian = user?.role === "CUSTODIAN" || user?.role === "HOD";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isCustodian && !isAdmin) return;
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings?forCustodian=true");
        if (res.ok) {
          const data: Booking[] = await res.json();
          // Filter to only show bookings assigned to this custodian's facilities
          if (user?.role !== "ADMIN") {
            setBookings(data.filter((b) => b.custodian_id === user?.id));
          } else {
            setBookings(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [user, isCustodian, isAdmin]);

  const handleAction = async (id: number, action: "approve" | "deny") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: updated.status } : b))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } finally {
      setActionId(null);
    }
  };

  if (!isCustodian && !isAdmin) {
    return (
      <div className="text-center mt-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
        <p className="text-gray-400 mt-2">This page is for facility custodians only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E54B3F]"></div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === "APPROVAL_PENDING");
  const displayedBookings =
    activeFilter === "pending"
      ? pendingBookings
      : bookings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5B6AF7] to-[#87AFF4] rounded-xl p-6 text-white shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Custodian Dashboard</h1>
          <p className="mt-1 text-blue-100 text-sm">
            Review and manage booking requests for your facilities.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending Approval",
            value: pendingBookings.length,
            icon: "⏳",
            color: "bg-amber-50 border-amber-200",
            textColor: "text-amber-700",
          },
          {
            label: "Approved",
            value: bookings.filter((b) => b.status === "CONFIRMED").length,
            icon: "✅",
            color: "bg-green-50 border-green-200",
            textColor: "text-green-700",
          },
          {
            label: "Denied",
            value: bookings.filter((b) => b.status === "DENIED").length,
            icon: "❌",
            color: "bg-red-50 border-red-200",
            textColor: "text-red-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`relative bg-white rounded-xl border ${stat.color} p-4 text-center shadow-sm`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`${
                activeFilter === f
                  ? "border-[#E54B3F] text-[#E54B3F]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1.5`}
            >
              <span>{f === "pending" ? "Pending Approvals" : "All Requests"}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeFilter === f
                    ? "bg-red-100 text-[#E54B3F]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {f === "pending" ? pendingBookings.length : bookings.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="text-4xl mb-3">
                      {activeFilter === "pending" ? "🎉" : "📭"}
                    </div>
                    <p className="text-sm text-gray-400">
                      {activeFilter === "pending"
                        ? "No pending booking requests. All caught up!"
                        : "No booking requests for your facilities yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      booking.status === "APPROVAL_PENDING"
                        ? "bg-amber-50/30"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">
                      {booking.facility_name}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getSessionColor(
                          booking.session
                        )}`}
                      >
                        {formatSession(booking.session).replace("🕒 ", "")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      <div className="font-medium text-gray-700">{booking.user_name}</div>
                      <div className="text-xs text-gray-400">{booking.department}</div>
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-gray-500 max-w-[150px] truncate"
                      title={booking.purpose || ""}
                    >
                      {booking.purpose || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "APPROVAL_PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : booking.status === "DENIED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {booking.status === "APPROVAL_PENDING"
                          ? "⏳ Pending"
                          : booking.status === "CONFIRMED"
                          ? "✅ Approved"
                          : booking.status === "DENIED"
                          ? "❌ Denied"
                          : booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {booking.status === "APPROVAL_PENDING" ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleAction(booking.id, "approve")}
                            disabled={actionId === booking.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionId === booking.id ? (
                              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : "✓"} Approve
                          </button>
                          <button
                            onClick={() => handleAction(booking.id, "deny")}
                            disabled={actionId === booking.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            ✕ Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
