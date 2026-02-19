import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/reports")
      .then((r) => {
        if (Array.isArray(r.data)) setReports(r.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const total = reports.length;
  const open = reports.filter(
    (r) => r.status === "Open" || r.status === "Pending",
  ).length;
  const inProgress = reports.filter(
    (r) =>
      r.status === "Progress" ||
      r.status === "In Progress" ||
      r.status === "PendingVerification",
  ).length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const closed = reports.filter((r) => r.status === "Closed").length;
  const resRate =
    total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  const topCats = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed") return "bg-slate-100 text-slate-500 border-slate-200";
    if (sl === "resolved")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (sl === "pendingverification")
      return "bg-violet-50 text-violet-700 border-violet-200";
    if (sl === "progress" || sl === "in progress")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const formatStatus = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "pending") return "OPEN";
    if (sl === "in progress") return "PROGRESS";
    if (sl === "pendingverification") return "AWAITING VERIFY";
    return s?.toUpperCase() || "OPEN";
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Overview of all reports across the system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total",
            value: total,
            icon: <FileText size={20} />,
            color: "rose",
          },
          {
            label: "Open",
            value: open,
            icon: <AlertCircle size={20} />,
            color: "red",
          },
          {
            label: "In Progress",
            value: inProgress,
            icon: <Clock size={20} />,
            color: "amber",
          },
          {
            label: "Resolved",
            value: resolved,
            icon: <CheckCircle2 size={20} />,
            color: "emerald",
          },
          {
            label: "Closed",
            value: closed,
            icon: <CheckCircle2 size={20} />,
            color: "slate",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
              ${
                s.color === "rose"
                  ? "bg-rose-50 text-rose-600"
                  : s.color === "red"
                    ? "bg-red-50 text-red-600"
                    : s.color === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : s.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
              }`}
            >
              {s.icon}
            </div>
            <p className="text-3xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Recent Reports
            </h2>
            <Link
              to="/admin/reports"
              className="text-rose-400 text-xs font-bold flex items-center gap-1 hover:text-rose-300 transition-colors"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to={`/admin/reports/${r.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-rose-50/40 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                    {r.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {r.category} · TKT-{String(r.id).padStart(3, "0")}{" "}
                    {r.assignedAgentName && `· Agent: ${r.assignedAgentName}`}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap ${getStatusStyle(r.status)}`}
                >
                  {formatStatus(r.status)}
                </span>
                <ArrowRight
                  size={13}
                  className="text-slate-600 group-hover:text-rose-400 transition-colors shrink-0"
                />
              </Link>
            ))}
            {reports.length === 0 && (
              <div className="p-12 text-center">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No reports yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Category + Resolution */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            By Category
          </h2>
          <div className="space-y-4">
            {topCats.map(([cat, count]) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex justify-between">
                  <p className="text-xs font-bold text-slate-700">{cat}</p>
                  <p className="text-xs font-black text-rose-600">{count}</p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-500" /> Resolution
                Rate
              </p>
              <p className="text-sm font-black text-emerald-600">{resRate}%</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                style={{ width: `${resRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
