import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AUTH_URL } from "../config/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError(""); setMessage(""); setLoading(true);
    try {
      const res = await fetch("${AUTH_URL}/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setMessage("Email verified! Redirecting to login..."); setTimeout(() => navigate("/login"), 2000);
    } catch { setError("Verification failed. Please try again."); setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setMessage("");
    if (!email) { setError("Please enter your email address."); return; }
    try {
      const res = await fetch("${AUTH_URL}/auth/resend-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMessage("New verification code sent to your email.");
    } catch { setError("Failed to resend code."); }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition placeholder:text-slate-400";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12 bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-200">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
        <p className="mt-2 text-sm text-slate-500 mb-8">We sent a 6-digit verification code to your email. Enter it below to verify your account.</p>

        <div className="space-y-5 text-left">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Verification Code</label><input type="text" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`} /></div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>}
        {message && <p className="mt-4 text-sm text-emerald-600 font-medium">{message}</p>}

        <button onClick={handleVerify} disabled={loading} className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <p className="mt-6 text-sm text-slate-500">
          Didn&apos;t receive the code?{" "}
          <button onClick={handleResend} className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer text-sm">Resend Code</button>
        </p>
      </div>
    </div>
  );
}
