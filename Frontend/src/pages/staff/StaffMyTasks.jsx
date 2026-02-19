import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const StaffMyTasks = () => {
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

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "resolved")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (sl === "pendingverification")
      return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getStatusIcon = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "resolved") return <CheckCircle2 size={12} />;
    if (sl === "pendingverification") return <AlertCircle size={12} />;
    return <Clock size={12} />;
  };

  const formatStatus = (s) => {
    if (s === "Progress") return "IN PROGRESS";
    if (s === "PendingVerification") return "AWAITING VERIFY";
    return s?.toUpperCase() || "ASSIGNED";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          My Tasks
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {tasks.length} reports assigned to you
        </p>
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
                  Location
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading tasks...</p>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <FileText
                      size={32}
                      className="text-slate-700 mx-auto mb-3"
                    />
                    <p className="text-slate-500 font-bold text-sm">
                      No tasks assigned yet
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Wait for the admin to assign reports to you.
                    </p>
                  </td>
                </tr>
              ) : (
                tasks.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/staff/reports/${r.id}`)}
                    className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        TKT-{String(r.id).padStart(3, "0")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-400 max-w-[200px] truncate">
                        {r.location}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}
                      >
                        {getStatusIcon(r.status)}
                        <span>{formatStatus(r.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <ArrowRight
                        size={16}
                        className="text-slate-400 group-hover:text-blue-600 transition-colors ml-auto"
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

export default StaffMyTasks;
