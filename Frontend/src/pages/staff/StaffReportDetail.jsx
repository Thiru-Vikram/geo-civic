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
  Upload,
  Navigation,
  ShieldCheck,
  Calendar,
  Tag,
  Camera,
  AlertTriangle,
} from "lucide-react";

const StaffReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // GPS State
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | checking | near | far | error
  const [userLocation, setUserLocation] = useState(null);
  const [distanceToIssue, setDistanceToIssue] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, updRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/reports/${id}`),
          axios.get(`http://localhost:8080/api/reports/${id}/updates`),
        ]);
        setReport(repRes.data);
        if (Array.isArray(updRes.data)) setUpdates(updRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setMessage("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Reject IP-based / VPN geolocation — real GPS accuracy is < 500m.
        // IP geolocation (including VPN exits) typically returns 1000m–50000m.
        if (accuracy > 500) {
          setGpsStatus("error");
          setMessage(
            `⚠ Location accuracy too low (${Math.round(accuracy)}m). Your browser is using IP-based location instead of real GPS. Please disable VPN, enable device GPS, and try again.`,
          );
          return;
        }

        setUserLocation({ lat: latitude, lng: longitude });

        if (report?.latitude && report?.longitude) {
          const dist = haversine(
            report.latitude,
            report.longitude,
            latitude,
            longitude,
          );
          setDistanceToIssue(Math.round(dist));
          setGpsStatus(dist <= 200 ? "near" : "far");
        } else {
          // Report has no GPS coords — still verified real GPS above, allow resolve
          setGpsStatus("near");
        }
      },
      () => {
        setGpsStatus("error");
        setMessage(
          "Could not get your location. Please enable GPS and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleResolve = async () => {
    if (gpsStatus !== "near") {
      setMessage("⚠ Please verify your location first before resolving.");
      return;
    }
    if (!proofImage) {
      setMessage("⚠ Please upload a proof photo before resolving.");
      return;
    }

    setResolving(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("staffLat", userLocation.lat);
      formData.append("staffLng", userLocation.lng);
      formData.append("proofImage", proofImage);

      const res = await axios.put(
        `http://localhost:8080/api/reports/${id}/resolve`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.status === 400) {
        setMessage(`❌ ${res.data}`);
        setGpsStatus("far");
        return;
      }

      setReport(res.data);
      const updRes = await axios.get(
        `http://localhost:8080/api/reports/${id}/updates`,
      );
      if (Array.isArray(updRes.data)) setUpdates(updRes.data);
      setMessage(
        "✓ Proof submitted! Ticket stays In Progress until the citizen verifies at the location.",
      );
      setTimeout(() => setMessage(""), 5000);
    } catch (e) {
      const errMsg =
        e.response?.data || "Error resolving report. Please try again.";
      setMessage(`❌ ${errMsg}`);
      if (e.response?.status === 400 && errMsg.includes("away"))
        setGpsStatus("far");
    } finally {
      setResolving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );

  if (!report)
    return (
      <div className="p-8 text-center text-slate-500">Report not found.</div>
    );

  const isPendingVerification = report.status === "PendingVerification";
  const isTrulyResolved =
    report.status === "Resolved" || report.status === "Closed";
  const isResolved = isPendingVerification || isTrulyResolved;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button
        onClick={() => navigate("/staff/tasks")}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-colors group text-sm"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />{" "}
        Back to My Tasks
      </button>

      {/* Banner */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
                  TKT-{String(report.id).padStart(3, "0")}
                </span>
                <span className="bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  <Tag size={10} className="inline mr-1" />
                  {report.category}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase">
                {report.title}
              </h1>
              <p className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin size={14} className="text-blue-500" /> {report.location}
              </p>
              <p className="flex items-center gap-2 text-slate-500 text-xs">
                <Calendar size={13} />{" "}
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            <span
              className={`px-6 py-2.5 rounded-2xl font-black uppercase text-sm tracking-widest
              ${isTrulyResolved ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}
            >
              {isTrulyResolved
                ? "Resolved"
                : isPendingVerification
                  ? "Awaiting Verification"
                  : "In Progress"}
            </span>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <ShieldCheck size={120} />
          </div>
        </div>

        {/* Description + Photos */}
        <div className="p-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Issue Description
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200 italic">
              "{report.description || "No description."}"
            </p>
          </div>
          {report.imagePath && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Citizen Evidence Photo
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
                Your Proof Photo ✓
              </p>
              <img
                src={`http://localhost:8080${report.proofImagePath}`}
                className="w-full h-36 object-cover rounded-2xl border border-emerald-700/50"
                alt="Proof"
              />
            </div>
          )}
        </div>
      </div>

      {!isResolved ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GPS Check */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Step 1: Verify Location
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                You must be within 200m of the issue to resolve it.
              </p>
            </div>

            {gpsStatus === "idle" && (
              <button
                onClick={checkLocation}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200"
              >
                <Navigation size={18} /> Check My Location
              </button>
            )}

            {gpsStatus === "checking" && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <p className="text-slate-700 font-bold">
                  Getting your GPS location...
                </p>
              </div>
            )}

            {gpsStatus === "near" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <p className="text-emerald-700 font-black text-lg">
                  Location Verified! ✓
                </p>
                {distanceToIssue !== null && (
                  <p className="text-emerald-600/70 text-xs font-bold">
                    You are {distanceToIssue}m from the issue
                  </p>
                )}
                <button
                  onClick={checkLocation}
                  className="text-slate-500 text-xs underline mt-2"
                >
                  Re-check location
                </button>
              </div>
            )}

            {gpsStatus === "far" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
                <AlertTriangle size={36} className="text-red-500 mx-auto" />
                <p className="text-red-700 font-black">Wrong Location!</p>
                <p className="text-red-600/80 text-sm font-medium">
                  You are{" "}
                  {distanceToIssue !== null ? `${distanceToIssue}m` : "too far"}{" "}
                  away from the issue. Please go to the correct location.
                </p>
                <button
                  onClick={checkLocation}
                  className="mt-3 flex items-center justify-center gap-2 mx-auto bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-sm px-5 py-2 rounded-xl transition-all border border-slate-200"
                >
                  <Navigation size={15} /> Try Again
                </button>
              </div>
            )}

            {gpsStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertTriangle
                  size={32}
                  className="text-red-500 mx-auto mb-3"
                />
                <p className="text-red-700 font-bold text-sm">
                  GPS Error — Enable location access and try again.
                </p>
                <button
                  onClick={checkLocation}
                  className="mt-3 bg-slate-100 text-slate-700 font-bold text-xs px-5 py-2 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Photo Upload + Resolve */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Step 2: Upload Proof & Resolve
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Take a photo showing the issue has been fixed.
              </p>
            </div>

            {/* Image Upload */}
            <label
              className={`block cursor-pointer border-2 border-dashed rounded-2xl transition-all
              ${proofPreview ? "border-blue-500/50" : "border-slate-200 hover:border-blue-500/40"}`}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              {proofPreview ? (
                <div className="relative">
                  <img
                    src={proofPreview}
                    className="w-full h-48 object-cover rounded-2xl"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm">
                      Click to change photo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Camera size={28} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm text-slate-600">
                      Tap to take / select a photo
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG accepted
                    </p>
                  </div>
                </div>
              )}
            </label>

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

            <button
              onClick={handleResolve}
              disabled={resolving || gpsStatus !== "near"}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resolving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <CheckCircle2 size={18} /> Mark as Resolved & Notify Citizen
                </>
              )}
            </button>

            {gpsStatus !== "near" && (
              <p className="text-center text-xs text-slate-400 font-bold">
                Complete location check first to enable resolve.
              </p>
            )}
          </div>
        </div>
      ) : isPendingVerification ? (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-10 text-center space-y-3">
          <CheckCircle2 size={48} className="text-amber-600 mx-auto" />
          <h2 className="text-2xl font-black text-amber-700">
            Proof Submitted!
          </h2>
          <p className="text-slate-600 font-medium">
            Awaiting citizen verification at the location. Ticket stays In
            Progress until the citizen confirms.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-10 text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-black text-emerald-700">
            Issue Resolved!
          </h2>
          <p className="text-slate-600 font-medium">
            Citizen has verified the fix at the location. Ticket is officially
            resolved.
          </p>
        </div>
      )}

      {/* Update History */}
      {updates.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 space-y-5 shadow-sm">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Update History
          </h2>
          <div className="relative space-y-5">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full" />
            {updates.map((upd, idx) => (
              <div key={upd.id || idx} className="flex gap-5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center z-10 shrink-0 border
                  ${
                    upd.status?.toLowerCase() === "resolved"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : upd.status?.toLowerCase() === "pendingverification"
                        ? "bg-amber-50 border-amber-200 text-amber-600"
                        : "bg-amber-50 border-amber-200 text-amber-600"
                  }`}
                >
                  {upd.status?.toLowerCase() === "resolved" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-black text-slate-800 uppercase">
                    {upd.status}
                  </p>
                  {upd.comment && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {upd.comment}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {upd.createdAt
                      ? new Date(upd.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReportDetail;
