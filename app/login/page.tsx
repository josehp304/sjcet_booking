"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top banner */}
      <div className="bg-[#F35E46] text-white py-2 px-4 text-center text-sm font-medium">
        St. Joseph&apos;s College of Engineering and Technology — Facility Booking Portal
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and title */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#E54B3F] rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-bold text-2xl">SJ</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              SJCET Booking System
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with your college credentials
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-xl shadow-md p-8 space-y-6 border border-gray-100">
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Authorized Personnel Only
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
                <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F] sm:text-sm"
                  placeholder="you@sjcet.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E54B3F] focus:border-[#E54B3F] sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#E54B3F] hover:bg-[#d43d32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E54B3F] transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center font-medium uppercase tracking-wide mb-2">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="bg-gray-50 rounded p-2">
                  <p className="font-semibold text-gray-700">Admin</p>
                  <p>admin@sjcet.edu</p>
                  <p>admin123</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="font-semibold text-gray-700">HOD</p>
                  <p>hodcs@sjcet.edu</p>
                  <p>hod123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#363839] text-gray-400 py-4 text-center text-xs">
        © {new Date().getFullYear()} SJCET Facility Booking System · All rights reserved
      </div>
    </div>
  );
}
