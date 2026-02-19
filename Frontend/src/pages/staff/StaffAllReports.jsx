import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";

const StaffAllReports = () => {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/reports");
        if (Array.isArray(res.data)) {
          setReports(res.data);
          setFiltered(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch reports", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    let result = reports;
    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((r) => {
        const s = r.status?.toLowerCase();
        if (statusFilter === "Open") return s === "open" || s === "pending";
        if (statusFilter === "Progress")
          return (
            s === "progress" ||
            s === "in progress" ||
            s === "pendingverification"
          );
        if (statusFilter === "Resolved")
          return s === "resolved" || s === "solved";
        return true;
      });
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
    result = [...result].sort(
      (a, b) => statusOrder(a.status) - statusOrder(b.status),
    );
    setFiltered(result);
  }, [searchQuery, statusFilter, reports]);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "resolved" || s === "solved")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "progress" || s === "in progress" || s === "pendingverification")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === "resolved" || s === "solved") return <CheckCircle2 size={13} />;
    if (s === "progress" || s === "in progress" || s === "pendingverification")
      return <Clock size={13} />;
    return <AlertCircle size={13} />;
  };

  const formatStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "OPEN";
    if (s === "in progress") return "PROGRESS";
    if (s === "pendingverification") return "AWAITING VERIFICATION";
    return status?.toUpperCase() || "OPEN";
  };

  const statuses = ["All", "Open", "Progress", "Resolved"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            All Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} total · Click a report to manage it
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={17}
            />
            <input
              type="text"
              placeholder="Search by title, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${
              showFilters || statusFilter !== "All"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Filter size={16} /> Filter
            {statusFilter !== "All" && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
              Status:
            </span>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => {
                setStatusFilter("All");
                setSearchQuery("");
              }}
              className="ml-auto text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ticket
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Submitted
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading reports...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <FileText
                      size={32}
                      className="text-slate-300 mx-auto mb-3"
                    />
                    <p className="text-slate-500 font-bold text-sm">
                      No reports found
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/staff/reports/${report.id}`)}
                    className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {report.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        TKT-{String(report.id).padStart(3, "0")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-400 font-medium max-w-[200px] truncate">
                        {report.location}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(report.status)}`}
                      >
                        {getStatusIcon(report.status)}
                        <span>{formatStatus(report.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-500 font-medium">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ArrowRight size={16} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffAllReports;
