import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [reported, setReported] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("http://localhost:5003/admin/residencies/pending", { headers }).then((r) => r.json()),
      fetch("http://localhost:5003/admin/residencies/reported", { headers }).then((r) => r.json()),
    ])
      .then(([pendingData, reportedData]) => {
        setPending(pendingData);
        setReported(reportedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isAdmin, token]);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5003/admin/residencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      alert(data.message);

      // Refresh data
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const [p, r] = await Promise.all([
        fetch("http://localhost:5003/admin/residencies/pending", { headers }).then((r) => r.json()),
        fetch("http://localhost:5003/admin/residencies/reported", { headers }).then((r) => r.json()),
      ]);
      setPending(p);
      setReported(r);
    } catch {
      alert("Failed to update residency.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500">You need admin privileges to view this page.</p>
        <button onClick={() => navigate("/")} className="mt-6 px-5 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition cursor-pointer">
          Go Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusBadge = (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-600 border-amber-200",
      verified: "bg-emerald-50 text-emerald-600 border-emerald-200",
      rejected: "bg-red-50 text-red-500 border-red-200",
    };
    return `inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.pending}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage residency claims and reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {[
          { key: "pending", label: "Pending Verification", count: pending.length },
          { key: "reported", label: "Reported", count: reported.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition cursor-pointer ${
              activeTab === t.key
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}{" "}
            <span className="ml-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pending */}
      {activeTab === "pending" &&
        (pending.length === 0 ? (
          <p className="text-center py-16 text-slate-400">No pending residencies to review.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r._id} className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-bold">{r.userName}</span> claims to have lived at{" "}
                    <span className="text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/property/${r.propertyId}`)}>
                      #{r.propertyId.slice(-6)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{r.fromYear} &mdash; {r.toYear}</p>
                  {r.description && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{r.description}&rdquo;</p>}
                  <p className="text-[11px] text-slate-400 mt-2">Submitted: {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleAction(r._id, "verified")} className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition cursor-pointer">Verify</button>
                  <button onClick={() => handleAction(r._id, "rejected")} className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer">Reject</button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* Reported */}
      {activeTab === "reported" &&
        (reported.length === 0 ? (
          <p className="text-center py-16 text-slate-400">No reported residencies.</p>
        ) : (
          <div className="space-y-3">
            {reported.map((r) => (
              <div key={r._id} className="bg-white border border-slate-200 border-l-4 border-l-red-400 rounded-xl p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-bold">{r.userName}</span> &mdash;{" "}
                      <span className="text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/property/${r.propertyId}`)}>
                        #{r.propertyId.slice(-6)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{r.fromYear} &mdash; {r.toYear}</p>
                    <span className={`${statusBadge(r.status)} mt-2`}>{r.status}</span>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-600">Reports ({r.reports.length}):</p>
                      {r.reports.map((report, i) => (
                        <div key={i} className="mt-2 bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-600">&ldquo;{report.reason}&rdquo;</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.status !== "verified" && (
                      <button onClick={() => handleAction(r._id, "verified")} className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition cursor-pointer">Verify</button>
                    )}
                    {r.status !== "rejected" && (
                      <button onClick={() => handleAction(r._id, "rejected")} className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer">Reject</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
