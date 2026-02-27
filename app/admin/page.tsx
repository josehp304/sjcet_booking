"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
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
  created_at: string;
  purpose: string;
};

type Facility = {
  id: number;
  name: string;
  capacity: number;
  description: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
};

type Tab = "bookings" | "facilities" | "users";

export default function AdminPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // New facility form
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityCapacity, setNewFacilityCapacity] = useState("");
  const [newFacilityDesc, setNewFacilityDesc] = useState("");
  const [facilityMsg, setFacilityMsg] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [addingFacility, setAddingFacility] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);
  const [deletingFacilityId, setDeletingFacilityId] = useState<number | null>(null);

  // New user form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("HOD");
  const [newUserDept, setNewUserDept] = useState("");
  const [userMsg, setUserMsg] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    async function fetchData() {
      try {
        const [bookingsRes, facilitiesRes, usersRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/facilities"),
          fetch("/api/users"),
        ]);
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (facilitiesRes.ok) setFacilities(await facilitiesRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleCancelBooking = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
      } else {
        alert("Failed to cancel booking");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacilityMsg(null);
    setAddingFacility(true);
    try {
      const isEditing = editingFacilityId !== null;
      const url = isEditing ? `/api/facilities/${editingFacilityId}` : "/api/facilities";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFacilityName,
          capacity: newFacilityCapacity ? parseInt(newFacilityCapacity) : null,
          description: newFacilityDesc,
        }),
      });
      if (res.ok) {
        const savedFacility = await res.json();
        if (isEditing) {
          setFacilities(prev => prev.map(f => f.id === editingFacilityId ? savedFacility : f));
          setFacilityMsg({ type: "success", msg: "Facility updated successfully!" });
        } else {
          setFacilities(prev => [...prev, savedFacility]);
          setFacilityMsg({ type: "success", msg: "Facility added successfully!" });
        }
        resetFacilityForm();
      } else {
        const data = await res.json();
        setFacilityMsg({ type: "error", msg: data.error || `Failed to ${isEditing ? "update" : "add"} facility` });
      }
    } finally {
      setAddingFacility(false);
    }
  };

  const resetFacilityForm = () => {
    setNewFacilityName("");
    setNewFacilityCapacity("");
    setNewFacilityDesc("");
    setEditingFacilityId(null);
  };

  const handleEditFacility = (facility: Facility) => {
    setEditingFacilityId(facility.id);
    setNewFacilityName(facility.name);
    setNewFacilityCapacity(facility.capacity ? facility.capacity.toString() : "");
    setNewFacilityDesc(facility.description || "");
    setFacilityMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFacility = async (id: number) => {
    if (!confirm("Are you sure you want to delete this facility?")) return;
    setDeletingFacilityId(id);
    try {
      const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFacilities(prev => prev.filter(f => f.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete facility");
      }
    } finally {
      setDeletingFacilityId(null);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["ID", "Facility", "Date", "Session", "Booked By", "Department", "Purpose", "Status"],
      ...bookings.map(b => [
        b.id, b.facility_name, format(new Date(b.booking_date), "yyyy-MM-dd"), b.session, b.user_name, b.department, `"${(b.purpose || "").replace(/"/g, '""')}"`, b.status
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    setAddingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          department: newUserDept,
        }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => [...prev, newUser]);
        setUserMsg({ type: "success", msg: "User added successfully!" });
        setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserDept("");
      } else {
        const data = await res.json();
        setUserMsg({ type: "error", msg: data.error || "Failed to add user" });
      }
    } finally {
      setAddingUser(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="text-center mt-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
        <p className="text-gray-400 mt-2">This page is restricted to Admin users only.</p>
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

  const filteredBookings = bookings.filter(b =>
    b.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "bookings", label: "All Bookings", count: bookings.length },
    { id: "facilities", label: "Facilities", count: facilities.length },
    { id: "users", label: "Users", count: users.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#87AFF4] rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-blue-100 text-sm">Manage bookings, facilities, and users.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4 mr-2 text-[#E54B3F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, icon: "📋" },
          { label: "Facilities", value: facilities.length, icon: "🏛️" },
          { label: "HOD Users", value: users.filter(u => u.role === "HOD").length, icon: "👨‍🏫" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${activeTab === tab.id
                ? "border-[#E54B3F] text-[#E54B3F]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1.5`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id ? "bg-red-100 text-[#E54B3F]" : "bg-gray-100 text-gray-500"
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 block border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
            />
          </div>
          <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booked By</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-sm text-gray-400 text-center">
                        {searchTerm ? "No bookings match your search." : "No bookings found."}
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{booking.facility_name}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(booking.booking_date), "MMM dd, yyyy")}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.session === "FORENOON" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700"
                            }`}>
                            {booking.session === "FORENOON" ? "🌅 Forenoon" : "🌇 Afternoon"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">
                          <div>{booking.user_name}</div>
                          <div className="text-xs text-gray-400">{booking.department}</div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={booking.purpose || ""}>
                          {booking.purpose || "-"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="inline-flex items-center text-red-500 hover:text-red-700 text-sm font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {cancellingId === booking.id ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Cancelling...
                                </>
                              ) : "Cancel"}
                            </button>
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
      )}

      {/* Facilities Tab */}
      {activeTab === "facilities" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {editingFacilityId ? "Edit Facility" : "Add New Facility"}
              </h3>
              <form onSubmit={handleSaveFacility} className="space-y-4">
                {facilityMsg && (
                  <div className={`p-3 rounded-lg text-sm ${facilityMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {facilityMsg.msg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]"
                    value={newFacilityCapacity}
                    onChange={(e) => setNewFacilityCapacity(e.target.value)}
                    placeholder="e.g. 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F] resize-none"
                    value={newFacilityDesc}
                    onChange={(e) => setNewFacilityDesc(e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addingFacility}
                    className={`flex-1 flex justify-center items-center py-2 px-4 bg-[#E54B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#d43d32] transition-colors ${addingFacility ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {addingFacility ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {editingFacilityId ? "Updating..." : "Adding..."}
                      </>
                    ) : (editingFacilityId ? "Update Facility" : "Add Facility")}
                  </button>
                  {editingFacilityId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFacilityForm();
                        setFacilityMsg(null);
                      }}
                      className="py-2 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">All Facilities ({facilities.length})</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {facilities.map((facility) => (
                  <li key={facility.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{facility.name}</p>
                        {facility.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{facility.description}</p>
                        )}
                      </div>
                      {facility.capacity && (
                        <span className="ml-4 flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          👥 {facility.capacity}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleEditFacility(facility)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFacility(facility.id)}
                        disabled={deletingFacilityId === facility.id}
                        className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingFacilityId === facility.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Add New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                {userMsg && (
                  <div className={`p-3 rounded-lg text-sm ${userMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {userMsg.msg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name *</label>
                  <input type="text" required className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Dr. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email *</label>
                  <input type="email" required className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="hod@sjcet.edu" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Password *</label>
                  <input type="password" required className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department *</label>
                  <input type="text" required className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]" value={newUserDept} onChange={e => setNewUserDept(e.target.value)} placeholder="e.g. Electrical Engineering" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</label>
                  <select className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F]" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="HOD">HOD</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addingUser}
                  className={`w-full flex justify-center items-center py-2 px-4 bg-[#E54B3F] text-white text-sm font-semibold rounded-lg hover:bg-[#d43d32] transition-colors ${addingUser ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {addingUser ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Adding...
                    </>
                  ) : "Add User"}
                </button>
              </form>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Registered Users ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{u.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{u.department}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === "ADMIN" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
