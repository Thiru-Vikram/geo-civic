import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { useNavigate, Outlet, Link } from "react-router-dom";
import {
  PanelLeft,
  Bell,
  Search as SearchIcon,
  X,
  CheckSquare,
  Clock,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  getUserDetails,
} from "../services/userService";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [civicCoins, setCivicCoins] = useState(0);
  const dropdownRef = useRef(null);

  const getUser = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    if (user?.civicCoins != null) setCivicCoins(user.civicCoins);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [notifRes, userRes] = await Promise.all([
          getNotifications(user.id),
          getUserDetails(user.id),
        ]);
        if (Array.isArray(notifRes.data)) setNotifications(notifRes.data);
        if (userRes.data) {
          const freshCoins = userRes.data.civicCoins ?? 0;
          setCivicCoins(freshCoins);
          // Keep localStorage in sync
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.civicCoins = freshCoins;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();

    // Refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Listen for coin updates from other pages (e.g. verify in ReportDetails)
  useEffect(() => {
    const handleStorage = () => {
      const u = getUser();
      if (u?.civicCoins != null) setCivicCoins(u.civicCoins);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isSidebarOpen ? "w-64" : "w-0"
        }`}
      >
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <main className="flex-1 overflow-auto relative text-slate-900">
        <div className="sticky top-0 z-20 bg-[#f8fafc]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-slate-100/50">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300 flex items-center justify-center group"
            >
              <PanelLeft size={20} />
            </button>
            <div className="ml-4 font-extrabold text-slate-900 tracking-tight">
              GeoCivic
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black text-white italic">
                CC
              </div>
              <span className="text-sm font-black text-emerald-700">
                {civicCoins ?? 0}
              </span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative p-2 rounded-xl transition-all ${showNotifDropdown ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">
                      Notifications
                    </h3>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {!Array.isArray(notifications) ||
                    notifications.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                          <Bell size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-400">
                          All caught up!
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {[...notifications].reverse().map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 group relative ${!notif.isRead ? "bg-emerald-50/30" : ""}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                            >
                              <Clock size={18} />
                            </div>
                            <div className="flex-1 min-w-0 pr-4 text-left">
                              <p
                                className={`text-xs leading-relaxed ${!notif.isRead ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}
                              >
                                {notif.message}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-1 font-bold">
                                {new Date(notif.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                              >
                                <CheckSquare size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
