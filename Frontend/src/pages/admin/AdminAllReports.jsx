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

const AdminAllReports = () => {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/reports")
      .then((r) => {
        if (Array.isArray(r.data)) {
          setReports(r.data);
          setFiltered(r.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = reports;
    if (searchQuery)
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
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
        if (statusFilter === "Resolved") return s === "resolved";
        if (statusFilter === "Closed") return s === "closed";
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
      if (sl === "closed") return 3;
      return 4;
    };
    result = [...result].sort(
      (a, b) => statusOrder(a.status) - statusOrder(b.status),
    );
    setFiltered(result);
  }, [searchQuery, statusFilter, reports]);

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed") return "bg-slate-100 text-slate-500 border-slate-200";
    if (sl === "resolved")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (
      sl === "progress" ||
      sl === "in progress" ||
      sl === "pendingverification"
    )
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getStatusIcon = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed" || sl === "resolved") return <CheckCircle2 size={12} />;
    if (
      sl === "progress" ||
      sl === "in progress" ||
      sl === "pendingverification"
    )
      return <Clock size={12} />;
    return <AlertCircle size={12} />;
  };

  const formatStatus = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "pending") return "OPEN";
    if (sl === "in progress") return "PROGRESS";
    if (sl === "pendingverification") return "AWAITING VERIFICATION";
    return s?.toUpperCase() || "OPEN";
  };

  const statuses = ["All", "Open", "Progress", "Resolved", "Closed"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          All Reports
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {filtered.length} reports · Click to manage & assign
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-400 transition-colors"
              size={17}
            />
            <input
              type="text"
              placeholder="Search by title, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600/40 focus:border-rose-600 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${showFilters || statusFilter !== "All" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
          >
            <Filter size={16} /> Filter{" "}
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
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

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ticket
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Date
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
                      <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading...</p>
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
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/admin/reports/${r.id}`)}
                    className="hover:bg-rose-50/30 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        TKT-{String(r.id).padStart(3, "0")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p
                        className={`text-xs font-bold ${r.assignedAgentName ? "text-amber-600" : "text-slate-400 italic"}`}
                      >
                        {r.assignedAgentName || "Unassigned"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}
                      >
                        {getStatusIcon(r.status)}
                        <span>{formatStatus(r.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-500 font-medium">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString(
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
                      <ArrowRight
                        size={16}
                        className="text-slate-600 group-hover:text-rose-400 transition-colors ml-auto"
                      />
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

export default AdminAllReports;
