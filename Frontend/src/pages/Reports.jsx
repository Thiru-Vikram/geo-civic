import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FileText,
  X,
} from "lucide-react";

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await axios.get(
          `http://localhost:8080/api/reports/user/${user.id}`,
        );
        setReports(response.data);
        setFilteredReports(response.data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Apply filters whenever search, status, or category changes
  useEffect(() => {
    let result = reports;

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((r) => {
        const s = r.status?.toLowerCase();
        const filter = statusFilter.toLowerCase();
        if (filter === "open") return s === "open" || s === "pending";
        if (filter === "progress")
          return (
            s === "progress" ||
            s === "in progress" ||
            s === "pendingverification"
          );
        if (filter === "solved") return s === "solved" || s === "resolved";
        return s === filter;
      });
    }

    // Category filter
    if (categoryFilter !== "All") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    // Sort: Open → In Progress / PendingVerification → Resolved/Solved
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

    setFilteredReports(result);
  }, [searchQuery, statusFilter, categoryFilter, reports]);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "resolved" || s === "solved")
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (s === "progress" || s === "in progress" || s === "pendingverification")
      return "bg-amber-50 text-amber-600 border-amber-100";
    if (s === "open" || s === "pending")
      return "bg-red-50 text-red-600 border-red-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === "resolved" || s === "solved") return <CheckCircle2 size={14} />;
    if (s === "progress" || s === "in progress" || s === "pendingverification")
      return <Clock size={14} />;
    return <AlertCircle size={14} />;
  };

  const formatStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "OPEN";
    if (s === "in progress") return "PROGRESS";
    if (s === "pendingverification") return "IN PROGRESS";
    return status?.toUpperCase();
  };

  const categories = [
    "All",
    "Roads",
    "Waste Management",
    "Street Lighting",
    "Water Leakage",
    "Public Parks",
  ];
  const statuses = ["All", "Open", "Progress", "Solved"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Reports
          </h1>
          <p className="text-slate-500 font-medium">
            Manage and track your community improvement requests.
          </p>
        </div>
        <Link
          to="/add-report"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus size={20} /> Create New Report
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tickets by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center space-x-2 border px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-95
                            ${
                              showFilters ||
                              statusFilter !== "All" ||
                              categoryFilter !== "All"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
          >
            <Filter size={18} />
            <span>Filter</span>
            {(statusFilter !== "All" || categoryFilter !== "All") && (
              <span className="ml-1 w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                                            ${statusFilter === s ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                                            ${categoryFilter === c ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 pt-2 flex justify-end">
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setCategoryFilter("All");
                  setSearchQuery("");
                }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Issue Details
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-bold text-sm tracking-wide">
                        Syncing data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                        <FileText size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">
                          No matching reports
                        </p>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                          We couldn't find any reports matching your current
                          search or filter criteria.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setStatusFilter("All");
                          setCategoryFilter("All");
                          setSearchQuery("");
                        }}
                        className="text-emerald-600 font-bold text-sm hover:underline"
                      >
                        Clear filters and try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50 transition-all group cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">
                          {report.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          TKT-{String(report.id).padStart(3, "0")}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-semibold text-slate-500 max-w-[250px] leading-relaxed">
                        {report.location}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div
                        className={`flex items-center space-x-2 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(report.status)}`}
                      >
                        {getStatusIcon(report.status)}
                        <span>{formatStatus(report.status)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-medium text-slate-400">
                        {new Date(report.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        className="text-slate-400 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
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

export default Reports;
