import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Tag,
  UserCheck,
} from "lucide-react";

const AdminReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reportRes, updatesRes, staffRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/reports/${id}`),
          axios.get(`http://localhost:8080/api/reports/${id}/updates`),
          axios.get("http://localhost:8080/api/users/staff"),
        ]);
        setReport(reportRes.data);
        setSelectedStaffId(reportRes.data.assignedStaffId?.toString() || "");
        if (Array.isArray(updatesRes.data)) setUpdates(updatesRes.data);
        if (Array.isArray(staffRes.data)) setStaffList(staffRes.data);
      } catch (e) {
        console.error("Failed to fetch", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleAssign = async () => {
    if (!selectedStaffId) {
      setMessage("Please select a staff member to assign.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const staff = staffList.find((s) => s.id.toString() === selectedStaffId);
      const res = await axios.put(
        `http://localhost:8080/api/reports/${id}/assign`,
        {
          staffId: parseInt(selectedStaffId),
          staffName: staff?.fullName || staff?.email,
        },
      );
      setReport(res.data);
      const updatesRes = await axios.get(
        `http://localhost:8080/api/reports/${id}/updates`,
      );
      if (Array.isArray(updatesRes.data)) setUpdates(updatesRes.data);
      setMessage(
        "✓ Report assigned! Staff has been notified and status set to In Progress.",
      );
      setTimeout(() => setMessage(""), 5000);
    } catch (e) {
      setMessage("Error assigning report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed") return "bg-slate-500 text-white";
    if (sl === "resolved") return "bg-emerald-500 text-white";
    if (
      sl === "progress" ||
      sl === "in progress" ||
      sl === "pendingverification"
    )
      return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  const formatStatus = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "pending") return "OPEN";
    if (sl === "in progress") return "PROGRESS";
    if (sl === "pendingverification") return "AWAITING VERIFICATION";
    return s?.toUpperCase() || "OPEN";
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
      </div>
    );

  if (!report)
    return (
      <div className="p-8 text-center text-slate-500">Report not found.</div>
    );

  const isAssigned =
    report.status === "Progress" ||
    report.status === "PendingVerification" ||
    report.status === "Resolved" ||
    report.status === "Closed";
  const selectedStaff = staffList.find(
    (s) => s.id.toString() === selectedStaffId,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button
        onClick={() => navigate("/admin/reports")}
        className="flex items-center gap-2 text-slate-400 hover:text-rose-400 font-bold transition-colors group text-sm"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />{" "}
        Back to All Reports
      </button>

      {/* Banner */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
                  TKT-{String(report.id).padStart(3, "0")}
                </span>
                <span className="bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Tag size={10} /> {report.category}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                {report.title}
              </h1>
              <p className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <MapPin size={14} className="text-rose-400" /> {report.location}
              </p>
              <p className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <Calendar size={13} />{" "}
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleString()
                  : "—"}
              </p>
              {report.assignedAgentName && (
                <p className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <UserCheck size={14} className="text-amber-400" /> Assigned
                  to:{" "}
                  <span className="text-amber-400">
                    {report.assignedAgentName}
                  </span>
                </p>
              )}
            </div>
            <span
              className={`px-6 py-2.5 rounded-2xl font-black uppercase text-sm tracking-widest ${getStatusStyle(report.status)}`}
            >
              {formatStatus(report.status)}
            </span>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <ShieldCheck size={120} />
          </div>
        </div>

        {/* Description & Evidence */}
        <div className="p-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Description
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200 italic">
              "{report.description || "No description."}"
            </p>
          </div>
          {report.imagePath && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Citizen Photo
              </p>
              <img
                src={`http://localhost:8080${report.imagePath}`}
                className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                alt="Evidence"
              />
            </div>
          )}
          {report.proofImagePath && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Staff Proof Photo ✓
              </p>
              <img
                src={`http://localhost:8080${report.proofImagePath}`}
                className="w-full h-36 object-cover rounded-2xl border border-emerald-700/50"
                alt="Staff Proof"
              />
            </div>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${!["Resolved", "PendingVerification", "Closed"].includes(report.status) ? "lg:grid-cols-2" : ""}`}
      >
        {/* Assign Panel — hidden once ticket is resolved / pending verification / closed */}
        {!["Resolved", "PendingVerification", "Closed"].includes(
          report.status,
        ) && (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Assign to Staff
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select a staff member to handle this report. This will set
                status to In Progress.
              </p>
            </div>

            {message && (
              <div
                className={`px-4 py-3 rounded-2xl text-sm font-bold border ${
                  message.startsWith("✓")
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {staffList.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                <User size={28} className="text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-sm">
                  No staff accounts found
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Create staff accounts by registering and setting role =
                  'STAFF' in the database.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id.toString())}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                    ${
                      selectedStaffId === staff.id.toString()
                        ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm shrink-0">
                      {(staff.fullName || staff.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {staff.fullName || staff.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {staff.email}
                      </p>
                    </div>
                    {selectedStaffId === staff.id.toString() && (
                      <CheckCircle2
                        size={18}
                        className="text-rose-400 shrink-0"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleAssign}
              disabled={
                saving || !selectedStaffId || report.status === "Closed"
              }
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-900/50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <UserCheck size={18} /> Assign & Set In Progress
                </>
              )}
            </button>

            {report.status === "Closed" && (
              <p className="text-center text-xs text-slate-500 font-bold">
                This ticket is already closed and verified by the citizen.
              </p>
            )}
          </div>
        )}

        {/* Update History */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Update History
          </h2>
          {updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Clock size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-bold">No updates yet</p>
            </div>
          ) : (
            <div className="relative space-y-5">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full" />
              {updates.map((upd, idx) => (
                <div key={upd.id || idx} className="flex gap-5 relative">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center z-10 shrink-0 border
                    ${
                      upd.status?.toLowerCase() === "closed"
                        ? "bg-slate-100 border-slate-200 text-slate-500"
                        : upd.status?.toLowerCase() === "resolved"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : upd.status?.toLowerCase().includes("progress")
                            ? "bg-amber-50 border-amber-200 text-amber-600"
                            : "bg-red-50 border-red-200 text-red-600"
                    }`}
                  >
                    {upd.status?.toLowerCase() === "closed" ||
                    upd.status?.toLowerCase() === "resolved" ? (
                      <CheckCircle2 size={16} />
                    ) : upd.status?.toLowerCase().includes("progress") ? (
                      <Clock size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {upd.status}
                    </p>
                    {upd.comment && (
                      <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                        {upd.comment}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {upd.createdAt
                        ? new Date(upd.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetail;
