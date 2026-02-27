"use client";

import { useMemo, useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";

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

type Props = {
    facilityName: string;
    bookings: Booking[];
    currentMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
};

export function MonthlyCalendar({ facilityName, bookings, currentMonth, onPrevMonth, onNextMonth }: Props) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getDayStatus = (date: Date) => {
        // format date to YYYY-MM-DD for comparison, keeping local time zone into account
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = bookings.filter((b) => {
            const bDateStr = format(new Date(b.booking_date), "yyyy-MM-dd");
            return bDateStr === dateStr;
        });

        const hasForenoon = dayBookings.some((b) => b.session === "FORENOON");
        const hasAfternoon = dayBookings.some((b) => b.session === "AFTERNOON");

        if (hasForenoon && hasAfternoon) return "both";
        if (hasForenoon) return "forenoon";
        if (hasAfternoon) return "afternoon";
        return "available";
    };

    const selectedDayBookings = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        return bookings.filter((b) => {
            const bDateStr = format(new Date(b.booking_date), "yyyy-MM-dd");
            return bDateStr === dateStr;
        });
    }, [selectedDate, bookings]);

    return (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{facilityName || "Select a facility"}</h3>
                    <p className="text-sm text-gray-500">{format(currentMonth, "MMMM yyyy")}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-6">
                {/* Calendar Grid */}
                <div className="flex-1">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300"></div> Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400"></div> Forenoon Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-[#FFAC1C] border border-orange-500"></div> Afternoon Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-red-400 border border-red-500 text-white flex items-center justify-center"></div> Fully Booked
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {days.map((day, idx) => {
                            const status = getDayStatus(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);

                            let bgClass = "bg-gray-50 border-gray-100 text-gray-400"; // non-current month
                            if (isCurrentMonth) {
                                if (status === "both") bgClass = "bg-red-400 border-red-500 text-white hover:bg-red-500 cursor-pointer";
                                else if (status === "forenoon") bgClass = "bg-yellow-200 border-yellow-400 text-yellow-900 hover:bg-yellow-300 cursor-pointer";
                                else if (status === "afternoon") bgClass = "bg-[#FFAC1C] border-orange-500 text-orange-900 hover:bg-orange-400 cursor-pointer";
                                else bgClass = "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => isCurrentMonth && setSelectedDate(day)}
                                    className={`
                    flex flex-col items-center justify-center aspect-square rounded-lg border sm:text-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 relative
                    ${bgClass}
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-md z-10" : ""}
                  `}
                                    disabled={!isCurrentMonth}
                                >
                                    <span className="font-semibold tracking-tight">{format(day, "d")}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Details Sidebar */}
                <div className="w-full md:w-80 border-l border-gray-100 md:pl-6 pt-6 md:pt-0">
                    <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-50">
                        <CalendarIcon className="w-4 h-4 text-[#E54B3F]" />
                        {selectedDate ? format(selectedDate, "eeee, MMMM d, yyyy") : "Booking Details"}
                    </h4>

                    {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 space-y-3">
                            <Info className="w-8 h-8 opacity-50" />
                            <p className="text-sm">Click on any date in the calendar to view its booking details.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <DetailCard sessionName="Forenoon" sessionTime="9:00 AM – 1:00 PM" booking={selectedDayBookings.find(b => b.session === "FORENOON")} />
                            <DetailCard sessionName="Afternoon" sessionTime="2:00 PM – 5:00 PM" booking={selectedDayBookings.find(b => b.session === "AFTERNOON")} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailCard({ sessionName, sessionTime, booking }: { sessionName: string; sessionTime: string; booking?: Booking }) {
    if (!booking) {
        return (
            <div className="p-4 rounded-xl border border-green-100 bg-green-50/50">
                <h5 className="font-semibold text-green-800 text-sm mb-0.5">{sessionName}</h5>
                <div className="text-xs text-green-600/80 mb-2">{sessionTime}</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">
                    Available
                </span>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
            <h5 className="font-semibold text-gray-900 text-sm mb-0.5">{sessionName}</h5>
            <div className="text-xs text-gray-500 mb-3">{sessionTime}</div>
            <div className="space-y-2">
                <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
                    <div>
                        <div className="text-sm font-medium text-gray-800">{booking.user_name}</div>
                        <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{booking.department}</div>
                    </div>
                </div>
                {booking.purpose && (
                    <div className="mt-2 text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100 italic">
                        "{booking.purpose}"
                    </div>
                )}
            </div>
        </div>
    );
}
