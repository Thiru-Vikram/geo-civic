import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Navigation2,
  Calendar,
  ShieldCheck,
  Loader2,
  Camera,
} from "lucide-react";

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [userDistance, setUserDistance] = useState(null);
  const [canVerify, setCanVerify] = useState(false);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/reports/${id}`,
        );
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportDetails();
  }, [id]);

  useEffect(() => {
    if (report?.status === "PendingVerification") {
      checkProximity();
    }
  }, [report]);

  const checkProximity = () => {
    // If report has no GPS coords, skip distance check and allow verify immediately
    if (!report?.latitude || !report?.longitude) {
      setCanVerify(true);
      return;
    }

    if (!navigator.geolocation) {
      setCanVerify(true); // fallback: allow verify if no geolocation support
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(
          latitude,
          longitude,
          report.latitude,
          report.longitude,
        );
        setUserDistance(dist);
        // If user is within 200 meters, allow verification
        if (dist <= 0.2) {
          setCanVerify(true);
        }
      },
      () => {
        // GPS error — allow verify anyway so user isn't blocked
        setCanVerify(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const params = {};
      if (userDistance !== null && report.latitude && report.longitude) {
        // get current position to send with verify request
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              params.userLat = pos.coords.latitude;
              params.userLng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
          );
        });
      }
      const response = await axios.put(
        `http://localhost:8080/api/reports/${id}/verify`,
        null,
        { params },
      );
      setReport(response.data);
      // Update coins in localStorage using actual value from API response
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Use the real updated coin count from the server response
          const updatedCoins = response.data?.user?.civicCoins;
          parsed.civicCoins =
            updatedCoins != null ? updatedCoins : (parsed.civicCoins || 0) + 50;
          localStorage.setItem("user", JSON.stringify(parsed));
          // Trigger a storage event so MainLayout picks it up instantly
          window.dispatchEvent(new Event("storage"));
        }
      } catch (_) {}
      alert("Verification successful! You earned 50 CC.");
    } catch (err) {
      console.error("Verification failed:", err);
      alert(err.response?.data || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  if (!report)
    return (
      <div className="p-8 text-center text-slate-500">Report not found.</div>
    );

  const STATUS_FLOW = [
    { key: "open", label: "Report Open", icon: <AlertCircle />, color: "red" },
    { key: "progress", label: "In Progress", icon: <Clock />, color: "amber" },
    {
      key: "resolved",
      label: "Resolved",
      icon: <CheckCircle2 />,
      color: "emerald",
    },
  ];

  const currentStatusIdx =
    report.status?.toLowerCase() === "resolved"
      ? 2
      : report.status?.toLowerCase() === "progress" ||
          report.status?.toLowerCase() === "in progress" ||
          report.status === "PendingVerification"
        ? 1
        : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />{" "}
        Back to Dashboard
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Top Summary Banner */}
        <div className="bg-slate-900 p-10 text-white relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  TKT-{String(report.id).padStart(3, "0")}
                </span>
                <span className="bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  {report.category}
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                {report.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <MapPin size={16} className="text-emerald-500" />
                {report.location}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                Current Status
              </p>
              <div
                className={`px-6 py-2 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg
                    ${
                      report.status?.toLowerCase() === "resolved"
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : report.status?.toLowerCase() === "progress" ||
                            report.status?.toLowerCase() === "in progress" ||
                            report.status === "PendingVerification"
                          ? "bg-amber-500 text-white shadow-amber-500/20"
                          : "bg-red-500 text-white shadow-red-500/20"
                    }`}
              >
                {report.status === "PendingVerification"
                  ? "IN PROGRESS"
                  : report.status?.toLowerCase() === "pending"
                    ? "OPEN"
                    : report.status?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <ShieldCheck size={120} />
          </div>
        </div>

        <div className="p-10 space-y-12">
          {/* Tracking Flow */}
          <div className="relative">
            <div className="absolute left-[23px] top-6 bottom-6 w-1 bg-slate-100 rounded-full"></div>

            <div className="space-y-10 relative">
              {STATUS_FLOW.map((step, idx) => {
                const isActive = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;

                return (
                  <div
                    key={idx}
                    className={`flex gap-8 group ${!isActive && "opacity-40"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all duration-500
                        ${isActive ? `bg-${step.color}-500 text-white ring-8 ring-${step.color}-50` : "bg-slate-100 text-slate-400"}`}
                    >
                      {step.icon}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            className={`text-lg font-black uppercase tracking-tight ${isActive ? "text-slate-900" : "text-slate-400"}`}
                          >
                            {step.label}
                          </h3>
                          {isActive && (
                            <p className="text-xs text-slate-500 font-medium">
                              {idx === 0
                                ? `Reported on ${new Date(report.createdAt).toLocaleString()}`
                                : idx === 1
                                  ? `Work started on ${report.assignedAgentName || "Field Agent"}`
                                  : `Issue resolved by ${report.assignedAgentName || "Civic Staff"}`}
                            </p>
                          )}
                        </div>
                        {isActive && idx < 2 && (
                          <div className="bg-slate-50 px-4 py-2 rounded-xl text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Expected Resolve
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {report.expectedResolutionTime
                                ? new Date(
                                    report.expectedResolutionTime,
                                  ).toLocaleDateString()
                                : "Within 48h"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* In-Progress details + PendingVerification verify section */}
                      {isCurrent && idx === 1 && (
                        <div className="bg-amber-50 rounded-[1.5rem] p-6 border border-amber-100 animate-in slide-in-from-left-4 duration-500 space-y-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0 border border-amber-200">
                              <User size={32} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                Assigned Field Agent
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {report.assignedAgentName || "Vikram Kumar"}
                              </p>
                              <p className="text-xs text-amber-700/70 font-medium mt-1">
                                Dispatched to your area with necessary
                                equipment.
                              </p>
                            </div>
                          </div>

                          {/* Verify section — shown once staff submits proof */}
                          {report.status === "PendingVerification" && (
                            <div className="pt-4 border-t border-amber-100">
                              <p className="text-sm font-black text-amber-800 mb-3">
                                Staff has submitted proof! Please go to the
                                location and verify the fix to earn{" "}
                                <span className="text-emerald-700">50 CC</span>.
                              </p>
                              {canVerify ? (
                                <div className="space-y-4">
                                  <div className="text-sm font-medium text-emerald-800">
                                    You are at the location! Confirm the issue
                                    is resolved.
                                  </div>
                                  <button
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                                  >
                                    {verifying ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <>
                                        Verify & Resolve{" "}
                                        <CheckCircle2 size={18} />
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-white/70 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Navigation2 size={20} />
                                  </div>
                                  <div className="text-[10px] font-black text-amber-800/70 uppercase tracking-widest leading-relaxed">
                                    Verify button will appear when you are
                                    within 100m of the issue location (
                                    {userDistance
                                      ? `${(userDistance * 1000).toFixed(0)}m away`
                                      : "Locating..."}
                                    )
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resolved step — shown after citizen verifies */}
                      {isActive && idx === 2 && (
                        <div className="bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100 animate-in slide-in-from-left-4 duration-500 space-y-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0 border border-emerald-200 flex items-center justify-center">
                              {report.assignedAgentPhoto ? (
                                <img
                                  src={report.assignedAgentPhoto}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShieldCheck
                                  className="text-emerald-500"
                                  size={32}
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                Issue Resolved & Verified
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                Fixed by{" "}
                                {report.assignedAgentName || "Civic Team"}
                              </p>
                              <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                  <Calendar size={12} />{" "}
                                  {new Date().toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                  <ShieldCheck size={12} /> Citizen Verified
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-black uppercase tracking-widest">
                              Verified by You — +50 CC Earned!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Metadata */}
          <div className="pt-10 border-t border-slate-50 flex flex-wrap gap-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Original Submission
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img
                  src={`http://localhost:8080${report.imagePath}`}
                  className="w-40 h-24 object-cover rounded-xl shadow-sm hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Description
              </p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-emerald-100 pl-4 py-2 bg-slate-50/50 rounded-r-xl">
                "{report.description || "No description provided."}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
