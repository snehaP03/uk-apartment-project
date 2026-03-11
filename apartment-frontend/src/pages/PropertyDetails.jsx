import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isLoggedIn } = useAuth();
  const [property, setProperty] = useState(null);
  const [residents, setResidents] = useState([]);
  const [contactMessage, setContactMessage] = useState("");
  const [showContactForm, setShowContactForm] = useState(null);
  const [showReportForm, setShowReportForm] = useState(null);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5002/properties/${id}`).then((r) => r.json()).then(setProperty).catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`http://localhost:5003/properties/${id}/residents`).then((r) => r.json()).then(setResidents).catch(console.error);
  }, [id]);

  const handleContactRequest = async (resident) => {
    if (!isLoggedIn) { alert("Please log in."); navigate("/login"); return; }
    try {
      const res = await fetch("http://localhost:5003/contact-request", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: resident.userId, propertyId: id, message: contactMessage }),
      });
      const data = await res.json(); alert(data.message); setShowContactForm(null); setContactMessage("");
    } catch { alert("Failed to send contact request."); }
  };

  const handleReport = async (residencyId) => {
    if (!reportReason.trim()) { alert("Please provide a reason."); return; }
    try {
      const res = await fetch(`http://localhost:5003/residencies/${residencyId}/report`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json(); alert(data.message); setShowReportForm(null); setReportReason("");
    } catch { alert("Failed to report."); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      const res = await fetch(`http://localhost:5002/properties/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json(); if (!res.ok) { alert(data.message); return; } alert("Property deleted."); navigate("/search");
    } catch { alert("Failed to delete property."); }
  };

  if (!property) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  const isOwner = isLoggedIn && user && property.createdBy === user.id;
  const badgeColors = { verified: "bg-emerald-50 text-emerald-600 border-emerald-200", pending: "bg-amber-50 text-amber-600 border-amber-200", rejected: "bg-red-50 text-red-500 border-red-200" };
  const borderColors = { verified: "border-l-emerald-400", pending: "border-l-amber-400", rejected: "border-l-red-400" };

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 sm:h-80 bg-cover bg-center" style={{ backgroundImage: `url('http://localhost:5002/uploads/${property.imageKey}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:left-10 z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{property.addressLine1}</h1>
          <p className="mt-1 text-sm text-slate-300">{property.city} &mdash; {property.postcode}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Property Information</h2>
            {isOwner && (
              <button onClick={handleDelete} className="text-sm text-red-500 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer">Delete</button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Price", value: property.price ? `\u00A3${property.price}` : "N/A" },
              { label: "Type", value: property.type || "N/A" },
              { label: "Bedrooms", value: property.bedrooms || "N/A" },
              { label: "Bathrooms", value: property.bathrooms || "N/A" },
              { label: "Size", value: property.size ? `${property.size} sq ft` : "N/A" },
              { label: "Year Built", value: property.yearBuilt || "N/A" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.label}</p>
                <p className="mt-1 text-base font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Residents */}
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Who Lived Here</h2>

          {residents.length === 0 ? (
            <p className="text-sm text-slate-400 mb-6">No resident history available yet. Be the first to share!</p>
          ) : (
            <div className="space-y-3 mb-6">
              {residents.map((r) => (
                <div key={r._id} className={`bg-slate-50 border border-slate-200 border-l-4 ${borderColors[r.status] || borderColors.pending} rounded-xl p-4 ${r.status === "rejected" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">
                        <span className="font-bold">{r.userName || "A resident"}</span> lived here from <span className="font-semibold">{r.fromYear}</span> to <span className="font-semibold">{r.toYear}</span>
                      </p>
                      {r.description && <p className="text-xs text-slate-500 italic mt-1">{r.description}</p>}
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColors[r.status] || badgeColors.pending}`}>
                      {r.status || "pending"}
                    </span>
                  </div>

                  {isLoggedIn && user && r.userId !== user.id && (
                    <div className="mt-3">
                      {showContactForm === r._id ? (
                        <div className="space-y-2">
                          <textarea placeholder="Write a message (optional)..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none h-16" />
                          <div className="flex gap-2">
                            <button onClick={() => handleContactRequest(r)} className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition cursor-pointer">Send</button>
                            <button onClick={() => { setShowContactForm(null); setContactMessage(""); }} className="px-4 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                          </div>
                        </div>
                      ) : showReportForm === r._id ? (
                        <div className="space-y-2">
                          <textarea placeholder="Why do you think this is fake?" value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none h-16" />
                          <div className="flex gap-2">
                            <button onClick={() => handleReport(r._id)} className="px-4 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition cursor-pointer">Submit Report</button>
                            <button onClick={() => { setShowReportForm(null); setReportReason(""); }} className="px-4 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setShowContactForm(r._id)} className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition cursor-pointer">Request Contact</button>
                          <button onClick={() => setShowReportForm(r._id)} className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer">Report Fake</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { if (!isLoggedIn) { alert("Please log in."); navigate("/login"); return; } navigate(`/property/${id}/residency`); }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all cursor-pointer">
            I Lived Here
          </button>
        </div>
      </div>
    </div>
  );
}
