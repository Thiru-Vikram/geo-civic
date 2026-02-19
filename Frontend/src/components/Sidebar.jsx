import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, LogOut } from "lucide-react";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getUser = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { title: "Home", icon: <Home size={20} />, path: "/dashboard" },
    { title: "My Reports", icon: <FileText size={20} />, path: "/reports" },
  ];

  const bottomItems = [];

  const userInitial = user?.fullName
    ? user.fullName[0].toUpperCase()
    : user?.email
      ? user.email[0].toUpperCase()
      : "U";

  return (
    <div
      className={`h-full bg-white flex flex-col border-r border-slate-100 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? "w-64" : "w-0"}`}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 whitespace-nowrap">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transform transition-transform duration-500 hover:rotate-6">
          <FileText size={24} />
        </div>
        <div
          className={`transition-all duration-500 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
        >
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            GeoCivic
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            Civic Reporting
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group whitespace-nowrap ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span
                className={`${isActive ? "text-emerald-600" : "group-hover:text-emerald-500"} shrink-0 transition-colors duration-300`}
              >
                {item.icon}
              </span>
              <span
                className={`text-sm transition-all duration-500 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-6 border-t border-slate-50 space-y-1 shrink-0 bg-white/50 backdrop-blur-sm">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 font-medium whitespace-nowrap hover:scale-[1.02]"
          >
            <span className="shrink-0">{item.icon}</span>
            <span
              className={`text-sm transition-all duration-500 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            >
              {item.title}
            </span>
          </Link>
        ))}

        <Link
          to="/profile"
          className="flex items-center space-x-3 px-4 py-3 mt-4 group whitespace-nowrap border-t border-slate-50 pt-6 hover:bg-slate-50 transition-all duration-300 rounded-2xl"
        >
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs ring-4 ring-white shadow-sm shrink-0">
            {userInitial}
          </div>
          <div
            className={`flex-1 overflow-hidden transition-all duration-500 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
          >
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.fullName || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter">
              View Profile
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className={`p-2 text-slate-300 hover:text-red-500 transition-all duration-300 shrink-0 rounded-lg hover:bg-red-50 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
