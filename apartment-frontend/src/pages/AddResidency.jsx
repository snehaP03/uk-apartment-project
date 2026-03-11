import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RESIDENCY_URL } from "../config/api";

export default function AddResidency() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [description, setDescription] = useState("");

  const submitResidency = async () => {
    if (!isLoggedIn) { alert("Please log in first."); navigate("/login"); return; }
    try {
      const res = await fetch("${RESIDENCY_URL}/residencies", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId: id, fromYear, toYear, description }),
      });
      const data = await res.json(); alert(data.message); navigate(`/property/${id}`);
    } catch (err) { console.error(err); alert("Failed to save residency."); }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition placeholder:text-slate-400";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">I Lived Here</h2>
          <p className="mt-1 text-sm text-slate-500">Share your experience at this property</p>
        </div>

        <div className="space-y-5">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">From Year</label><input type="number" placeholder="2020" value={fromYear} onChange={(e) => setFromYear(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">To Year (optional)</label><input type="number" placeholder="2023" value={toYear} onChange={(e) => setToYear(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">About you (optional)</label>
            <textarea placeholder="e.g. A student from University of Hertfordshire studying MSc Computer Science" value={description} onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none h-24`} />
          </div>
          <button onClick={submitResidency} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all cursor-pointer">Save Residency</button>
        </div>
      </div>
    </div>
  );
}
