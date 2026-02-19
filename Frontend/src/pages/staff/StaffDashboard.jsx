import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";

const StaffDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const statusOrder = (s) => {
      const sl = s?.toLowerCase();
      if (sl === "open" || sl === "pending") return 0;
      if (
        sl === "progress" ||
        sl === "in progress" ||
        sl === "pendingverification"
      )
        return 1;
      if (sl === "resolved" || sl === "solved") return 2;
      return 3;
    };
    axios
      .get(`http://localhost:8080/api/reports/staff/${user.id}`)
      .then((r) => {
        if (Array.isArray(r.data))
          setTasks(
            [...r.data].sort(
              (a, b) => statusOrder(a.status) - statusOrder(b.status),
            ),
          );
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const open = tasks.filter(
    (r) => r.status === "Progress" || r.status === "In Progress",
  ).length;
  const resolved = tasks.filter(
    (r) => r.status === "PendingVerification",
  ).length;
  const closed = tasks.filter((r) => r.status === "Resolved").length;

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "resolved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (sl === "pendingverification") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const formatStatus = (s) => {
    if (s === "Progress") return "IN PROGRESS";
    if (s === "PendingVerification") return "AWAITING VERIFY";
    return s?.toUpperCase() || "ASSIGNED";
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome, {user?.fullName || user?.email?.split("@")[0] || "Staff"}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Here are your assigned tasks.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Active Tasks",
            value: open,
            icon: <Clock size={20} />,
            color: "amber",
          },
          {
            label: "Await Verify",
            value: resolved,
            icon: <AlertCircle size={20} />,
            color: "violet",
          },
          {
            label: "Completed",
            value: closed,
            icon: <CheckCircle2 size={20} />,
            color: "emerald",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
              ${
                s.color === "amber"
                  ? "bg-amber-50 text-amber-600"
                  : s.color === "violet"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {s.icon}
            </div>
            <p className="text-3xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            My Assigned Reports
          </h2>
          <Link
            to="/staff/tasks"
            className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:text-blue-700 transition-colors">
          >
            View All <ArrowRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <User size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No tasks assigned yet</p>
              <p className="text-slate-400 text-xs mt-1">
                The admin will assign reports to you.
              </p>
            </div>
          ) : (
            tasks.slice(0, 6).map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/staff/tasks/${r.id}`)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50/40 transition-all group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                    {r.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {r.category} · TKT-{String(r.id).padStart(3, "0")}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap ${getStatusStyle(r.status)}`}
                >
                  {formatStatus(r.status)}
                </span>
                <ArrowRight
                  size={13}
                  className="text-slate-500 group-hover:text-blue-600 transition-colors shrink-0"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
