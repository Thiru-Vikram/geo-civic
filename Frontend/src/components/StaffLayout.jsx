import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  Wrench,
  PanelLeft,
  Clock,
  CheckSquare,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
} from "../services/userService";

const StaffLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };
  const user = getUser();

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const res = await getNotifications(user.id);
        if (Array.isArray(res.data)) setNotifications(res.data);
      } catch (e) {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
    } catch (e) {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userInitial =
    user?.fullName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "S";

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/staff/dashboard",
    },
    { title: "My Tasks", icon: <FileText size={20} />, path: "/staff/tasks" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSidebarOpen ? "w-64" : "w-0"} shrink-0`}
      >
        <div
          className={`h-full bg-white flex flex-col border-r border-slate-100 shadow-sm overflow-hidden ${isSidebarOpen ? "w-64" : "w-0"}`}
        >
          <div className="p-6 flex items-center gap-3 whitespace-nowrap border-b border-slate-100">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
              <Wrench size={22} />
            </div>
            <div
              className={`transition-all duration-500 ${isSidebarOpen ? "opacity-100" : "opacity-0 -translate-x-4"}`}
            >
              <h1 className="text-base font-black text-slate-900 leading-none">
                GeoCivic
              </h1>
              <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase mt-0.5">
                Field Staff
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap
                    ${isActive ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span
                    className={`text-sm transition-all ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                {userInitial}
              </div>
              <div
                className={`flex-1 overflow-hidden transition-all ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}
              >
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || user?.email?.split("@")[0] || "Staff"}
                </p>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                  Field Worker
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  navigate("/login");
                }}
                className={`p-1.5 text-slate-500 hover:text-red-400 transition-all shrink-0 ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-20 bg-[#f8fafc]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-slate-100/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <PanelLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-blue-500" />
              <span className="text-slate-900 font-black text-sm">
                Field Staff Portal
              </span>
            </div>
          </div>

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`relative p-2 rounded-xl transition-all ${showNotifDropdown ? "bg-blue-600 text-white" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/60 z-50 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">
                    Notifications
                  </h3>
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                    {unreadCount} New
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell size={24} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">
                        All caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 flex gap-3 group relative ${!notif.isRead ? "bg-blue-50/30" : ""}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                          >
                            <Clock size={16} />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p
                              className={`text-xs leading-relaxed ${!notif.isRead ? "text-slate-900 font-semibold" : "text-slate-500"}`}
                            >
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="opacity-0 group-hover:opacity-100 absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg transition-all"
                            >
                              <CheckSquare size={12} />
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
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StaffLayout;
