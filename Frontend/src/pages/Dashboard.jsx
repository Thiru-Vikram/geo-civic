import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const Dashboard = () => {
  const getUser = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:8080/api/reports/user/${user.id}`,
        );
        if (Array.isArray(response.data)) {
          setReports(response.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user?.id]);

  const stats = [
    { label: "Total Tickets", value: reports.length },
    { label: "Civic Coins", value: user?.civicCoins || 0 },
    {
      label: "Open",
      value: reports.filter(
        (r) => r.status === "Open" || r.status === "Pending",
      ).length,
    },
    {
      label: "Solved",
      value: reports.filter((r) => r.status === "Resolved").length,
    },
  ];

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "resolved" || s === "solved") return "emerald";
    if (s === "open" || s === "pending") return "red";
    if (s === "progress" || s === "in progress" || s === "pendingverification")
      return "amber";
    return "slate";
  };

  const formatStatus = (status) => {
    if (!status) return "OPEN";
    const s = status.toLowerCase();
    if (s === "pending") return "OPEN";
    if (s === "in progress") return "PROGRESS";
    if (s === "pendingverification") return "IN PROGRESS";
    return status.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-emerald-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <span className="bg-emerald-500/30 text-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Dashboard
            </span>
            <h1 className="text-4xl font-bold">Welcome to GeoCivic</h1>
            <p className="text-emerald-50/80 text-sm leading-relaxed">
              Report civic issues, track ticket status, and monitor your
              community engagement coins.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                to="/add-report"
                className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-colors shadow-lg"
              >
                <Plus size={18} /> Create Report
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-5 flex flex-col items-center justify-center min-w-[120px] shadow-inner"
              >
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-[10px] text-emerald-100/70 font-semibold uppercase tracking-widest mt-1 text-center">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Open Issues
          </p>
          <p className="text-4xl font-bold mt-2 text-red-600">
            {
              reports.filter(
                (r) => r.status === "Open" || r.status === "Pending",
              ).length
            }
          </p>
          <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-medium">
            <AlertCircle size={14} /> Attention required
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            In Progress
          </p>
          <p className="text-4xl font-bold mt-2 text-amber-500">
            {
              reports.filter(
                (r) =>
                  r.status === "Progress" ||
                  r.status === "In Progress" ||
                  r.status === "PendingVerification",
              ).length
            }
          </p>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-medium">
            <Clock size={14} /> Being resolved
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Solved
          </p>
          <p className="text-4xl font-bold mt-2 text-emerald-600">
            {
              reports.filter(
                (r) => r.status === "Resolved" || r.status === "Solved",
              ).length
            }
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-medium">
            <CheckCircle2 size={14} /> Community fixed
          </div>
        </div>
      </div>

      {/* Recent Tickets List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-900">
            Your Recent Reports
          </h2>
          <Link
            to="/reports"
            className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {!Array.isArray(reports) || reports.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 font-medium italic">
                No reports found in database. Create your first report!
              </p>
            </div>
          ) : (
            reports.slice(0, 5).map((report) => {
              const color = getStatusColor(report.status);
              return (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-50 text-${color}-600 shrink-0`}
                  >
                    {report.status?.toLowerCase() === "resolved" ? (
                      <CheckCircle2 size={20} />
                    ) : report.status?.toLowerCase() === "progress" ||
                      report.status?.toLowerCase() === "in progress" ? (
                      <Clock size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">
                      {report.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {report.category} ·{" "}
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString()
                        : "Recent"}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors
                    ${
                      color === "red"
                        ? "bg-red-50 text-red-600"
                        : color === "amber"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {formatStatus(report.status)}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
