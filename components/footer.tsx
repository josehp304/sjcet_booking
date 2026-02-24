export function Footer() {
  return (
    <footer className="bg-[#363839] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-[#E54B3F] text-white rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm">
                SJ
              </div>
              <span className="font-bold text-lg">SJCET Booking</span>
            </div>
            <p className="text-sm text-gray-400">
              Centralized Facility Booking System for St. Joseph's College of Engineering and Technology.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/book" className="hover:text-white transition-colors">Book a Facility</a></li>
              <li><a href="/availability" className="hover:text-white transition-colors">Check Availability</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-3">Sessions</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>🌅 Forenoon: 9:00 AM – 1:00 PM</li>
              <li>🌇 Afternoon: 2:00 PM – 5:00 PM</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} SJCET Facility Booking System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
