import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AUTH_URL, PROPERTY_URL, RESIDENCY_URL } from "../config/api";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [myProperties, setMyProperties] = useState([]);
  const [myResidencies, setMyResidencies] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");

  const authHeaders = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    fetch(`${PROPERTY_URL}/my-properties`, { headers: authHeaders }).then((r) => r.json()).then(setMyProperties).catch(console.error);
    fetch(`${RESIDENCY_URL}/my-residencies`, { headers: authHeaders }).then((r) => r.json()).then(setMyResidencies).catch(console.error);
    fetch(`${RESIDENCY_URL}/contact-requests/incoming`, { headers: authHeaders }).then((r) => r.json()).then(setIncomingRequests).catch(console.error);
    fetch(`${RESIDENCY_URL}/contact-requests/outgoing`, { headers: authHeaders }).then((r) => r.json()).then(setOutgoingRequests).catch(console.error);
  }, [authHeaders]);

  const handleRequestAction = async (requestId, status) => {
    try {
      const res = await fetch(`${RESIDENCY_URL}/contact-requests/${requestId}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ status }) });
      const data = await res.json(); alert(data.message);
      const updated = await fetch(`${RESIDENCY_URL}/contact-requests/incoming`, { headers: authHeaders }); setIncomingRequests(await updated.json());
    } catch { alert("Failed to update request."); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${AUTH_URL}/auth/account`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        logout();
        navigate("/");
      } else {
        alert(data.error || "Failed to delete account.");
      }
    } catch { alert("Failed to delete account."); }
  };

  const handleDeleteResidency = async (id) => {
    if (!confirm("Delete this residency record?")) return;
    try {
      const res = await fetch(`${RESIDENCY_URL}/residencies/${id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setMyResidencies((prev) => prev.filter((r) => r._id !== id));
      } else {
        alert(data.message || "Failed to delete.");
      }
    } catch { alert("Failed to delete residency."); }
  };

  const handleDeleteContactRequest = async (id) => {
    if (!confirm("Delete this contact request?")) return;
    try {
      const res = await fetch(`${RESIDENCY_URL}/contact-requests/${id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setOutgoingRequests((prev) => prev.filter((r) => r._id !== id));
      } else {
        alert(data.message || "Failed to delete.");
      }
    } catch { alert("Failed to delete contact request."); }
  };

  const tabs = [
    { key: "properties", label: "Properties", count: myProperties.length },
    { key: "residencies", label: "Residencies", count: myResidencies.length },
    { key: "incoming", label: "Incoming", count: incomingRequests.filter((r) => r.status === "pending").length },
    { key: "outgoing", label: "Outgoing", count: outgoingRequests.length },
  ];

  const statusBadge = (status) => {
    const colors = { pending: "bg-amber-50 text-amber-600 border-amber-200", accepted: "bg-emerald-50 text-emerald-600 border-emerald-200", rejected: "bg-red-50 text-red-500 border-red-200", verified: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    return `inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.pending}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-200">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <button onClick={handleDeleteAccount}
          className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer">
          Delete Account
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition cursor-pointer ${activeTab === t.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            {t.label} <span className="ml-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Properties */}
      {activeTab === "properties" && (
        myProperties.length === 0 ? <p className="text-center py-16 text-slate-400">You haven&apos;t listed any properties yet.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myProperties.map((p) => (
              <div key={p._id} onClick={() => navigate(`/property/${p._id}`)} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition cursor-pointer">
                <img src={`${PROPERTY_URL}/uploads/${p.imageKey}`} alt="Property" onError={(e) => { e.target.src = "/property-images/1.jpg"; }} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{p.addressLine1}</h3>
                  <p className="text-xs text-slate-400 mt-1">{p.city} &mdash; {p.postcode}</p>
                  <p className="mt-2 text-sm font-bold text-indigo-600">{p.price ? `\u00A3${p.price}` : "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Residencies */}
      {activeTab === "residencies" && (
        myResidencies.length === 0 ? <p className="text-center py-16 text-slate-400">No residency history yet.</p> : (
          <div className="space-y-3">
            {myResidencies.map((r) => (
              <div key={r._id} className="bg-white border border-slate-200 border-l-4 border-l-indigo-400 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <p onClick={() => navigate(`/property/${r.propertyId}`)} className="text-sm font-bold text-slate-800 cursor-pointer hover:text-indigo-600">Property #{r.propertyId.slice(-6)}</p>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge(r.status || "pending")}>{r.status || "pending"}</span>
                    <button onClick={() => handleDeleteResidency(r._id)}
                      className="text-xs text-red-400 hover:text-red-600 transition cursor-pointer" title="Delete residency">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{r.fromYear} &mdash; {r.toYear}</p>
                {r.description && <p className="text-xs text-slate-500 italic mt-1">{r.description}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {/* Incoming */}
      {activeTab === "incoming" && (
        incomingRequests.length === 0 ? <p className="text-center py-16 text-slate-400">No contact requests received yet.</p> : (
          <div className="space-y-3">
            {incomingRequests.map((req) => (
              <div key={req._id} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm text-slate-800"><span className="font-bold">{req.fromUserName}</span> wants to contact you</p>
                {req.message && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{req.message}&rdquo;</p>}
                <span className={`${statusBadge(req.status)} mt-2`}>{req.status}</span>
                {req.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleRequestAction(req._id, "accepted")} className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition cursor-pointer">Accept</button>
                    <button onClick={() => handleRequestAction(req._id, "rejected")} className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer">Reject</button>
                  </div>
                )}
                {req.status === "accepted" && <p className="mt-3 text-sm text-emerald-600 font-medium">Their email: <strong>{req.fromUserEmail}</strong></p>}
              </div>
            ))}
          </div>
        )
      )}

      {/* Outgoing */}
      {activeTab === "outgoing" && (
        outgoingRequests.length === 0 ? <p className="text-center py-16 text-slate-400">No outgoing requests yet.</p> : (
          <div className="space-y-3">
            {outgoingRequests.map((req) => (
              <div key={req._id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-800">Request to resident at property <span className="font-bold">#{req.propertyId.slice(-6)}</span></p>
                  <button onClick={() => handleDeleteContactRequest(req._id)}
                    className="text-xs text-red-400 hover:text-red-600 transition cursor-pointer" title="Delete request">
                    Delete
                  </button>
                </div>
                {req.message && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{req.message}&rdquo;</p>}
                <span className={`${statusBadge(req.status)} mt-2`}>{req.status}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
