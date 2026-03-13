"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/book", label: "Book Facility" },
    { href: "/availability", label: "Availability" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin Panel" }] : []),
    ...(user.role === "CUSTODIAN" || user.role === "HOD" ? [{ href: "/custodian", label: "My Approvals" }] : []),
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      {/* Top accent banner */}
      <div className="bg-[#F35E46] h-1 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-[#E54B3F] text-white rounded-lg w-9 h-9 flex items-center justify-center font-bold text-sm">
                SJ
              </div>
              <span className="text-lg font-bold text-gray-800 hidden sm:block">
                SJCET Booking
              </span>
            </Link>

            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
                      ? "text-[#E54B3F] bg-red-50 border-b-2 border-[#E54B3F]"
                      : "text-gray-600 hover:text-[#E54B3F] hover:bg-red-50"
                  } px-3 py-2 text-sm font-medium rounded-t-md transition-colors duration-150`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.department} · {user.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-[#E54B3F] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#d43d32] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`${
                  pathname === link.href
                    ? "bg-red-50 border-l-4 border-[#E54B3F] text-[#E54B3F]"
                    : "border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                } block pl-3 pr-4 py-2 text-sm font-medium`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 px-4">
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.department}</p>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center space-x-2 bg-[#E54B3F] text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
