# SJCET Booking System - Project Context

This document provides a comprehensive overview of the SJCET (St. Joseph's College of Engineering and Technology) Facility Booking System for AI agents.

## 🏗️ Project Overview
The SJCET Booking System is a web application designed to manage and streamline the booking of college facilities (like auditoriums, labs, etc.). It features a granular approval workflow involving multiple user roles and precise time slot management.

## 🛠️ Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Shadcn UI (Radix UI primitives), Lucide React Icons
- **Database:** PostgreSQL (via Neon / `pg` pool)
- **State/Forms:** React Hook Form, Zod
- **Authentication:** Custom JWT-based (`jose`), `bcryptjs` for hashing passwords

## 📁 Project Structure
- `app/`: Next.js App Router routes
  - `admin/`: Admin dashboard (Approvals, user management)
  - `custodian/`: Custodian dashboard (Facility-specific booking management)
  - `dashboard/`: User/Coordinator dashboard
  - `book/`: Main facility booking portal
  - `availability/`: Real-time availability checker
  - `api/`: Backend API endpoints
- `components/`: Reusable React components
- `lib/`: Core utilities and database connection
- `public/`: Static assets (images, logos)

## 👥 User Roles & Permissions
- **Admin:** Overall system control, approves coordinators, manages all facilities and bookings.
- **Coordinator:** College staff/students who request bookings. Requires admin approval after registration.
- **Custodian:** Responsible for specific facilities. Approves or denies booking requests for their assigned areas. (HODs can also act as custodians).
- **HOD (Head of Department):** Can act as custodians and oversee department-specific resources.

## 🔄 Core Workflows
1. **Registration & Approval:**
   - Coordinators register via `/register`.
   - Accounts are inactive by default.
   - Admin reviews and approves registration requests in the `/admin` panel.
2. **Booking Process:**
   - Users select a facility and a date.
   - A **Precise Timeline** (minute-level) shows current availability.
   - Users select specific start and end times (not restricted to fixed hours).
   - Facility features (Amenities like Mic, Projector) are displayed as tags.
3. **Approval Lifecycle:**
   - Booking requests are routed to the assigned **Custodian**.
   - Custodians approve/deny requests.
   - Notifications/Status updates are shown in the user's dashboard.

## 📊 Database Context
- Managed on **Neon**.
- Connected via standard `pg` Pool with SSL.
- Tables likely include: `users`, `facilities`, `bookings`, `custodians`.

## ✨ Key Features & Recent Updates
- **Minute-Level Precision:** Booking slots are precise to the minute, not just hourly.
- **Dynamic Availability:** Color-coded timeline (Green = Available, Red = Booked).
- **Facility Tags:** Amenities like "Projector", "Sound System" are searchable and visible.
- **Coordinator Self-Registration:** Automated registration flow with admin validation.
- **Custodian Assignment:** Facilities are linked to specific custodians for decentralized management.

## 🚀 Development Mode
- Run locally with `npm run dev`.
- Uses `.env.local` for `DATABASE_URL` and `JWT_SECRET`.
