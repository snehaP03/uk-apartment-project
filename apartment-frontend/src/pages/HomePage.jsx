import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PROPERTY_URL } from "../config/api";

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [postcode, setPostcode] = useState("");
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch(`${PROPERTY_URL}/properties`)
      .then((res) => res.json())
      .then((data) => setFeatured(data.slice(0, 6)))
      .catch(console.error);
  }, []);
  const [postcodeError, setPostcodeError] = useState("");
  const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

  const handlePostcodeSearch = () => {
    if (postcode.trim() && !ukPostcodeRegex.test(postcode.trim())) {
      setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }
    setPostcodeError("");
    navigate(`/search?postcode=${postcode}`);
  };

  return (
    <div>
      {/* HERO */}
      <div className="relative w-full h-[520px] bg-cover bg-center" style={{ backgroundImage: `url('/property-images/hero.jpg')` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-900/80" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white/80 text-xs font-medium">Trusted by thousands of UK residents</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Find Your Next
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Home</span>
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-lg">
            Search UK properties, view past residents, and connect with former tenants — all in one place.
          </p>

          {/* Search Bar */}
          <div className="mt-8 w-full max-w-md">
            <div className="flex rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              <input
                type="text"
                placeholder="Enter UK postcode (e.g. SW1A 1AA)"
                value={postcode}
                onChange={(e) => { setPostcode(e.target.value); setPostcodeError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handlePostcodeSearch()}
                className="flex-1 px-5 py-4 text-sm bg-white text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={handlePostcodeSearch}
                className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer"
              >
                Search
              </button>
            </div>
            {postcodeError && (
              <p className="mt-2 text-sm text-red-300 bg-red-900/30 backdrop-blur-sm rounded-lg px-4 py-2">{postcodeError}</p>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/add")}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/25 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all cursor-pointer"
            >
              List a Property
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3 bg-white text-slate-800 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="mt-3 text-slate-500 max-w-lg mx-auto">Three simple steps to find your perfect home or share your living experience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Search Properties", desc: "Browse UK listings by postcode, city, price, and more. Filter to find exactly what you need.", icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
            { step: "02", title: "View Resident History", desc: "See who lived there before. Read verified reviews and experiences from past tenants.", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
            { step: "03", title: "Connect & Decide", desc: "Send contact requests to former residents. Get real insights before making your move.", icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" },
          ].map((item) => (
            <div key={item.step} className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step {item.step}</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED PROPERTIES */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Featured Properties</h2>
              <p className="mt-2 text-slate-500">Browse available apartments or add your own listing.</p>
            </div>
            <button onClick={() => navigate("/search")} className="hidden sm:block px-5 py-2.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition cursor-pointer">
              View All
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.length > 0 ? featured.map((property) => (
              <div key={property._id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer" onClick={() => navigate(`/property/${property._id}`)}>
                <div className="relative overflow-hidden">
                  <img src={`${PROPERTY_URL}/uploads/${property.imageKey}`} alt={property.addressLine1}
                    onError={(e) => { e.target.src = "/property-images/1.jpg"; }}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                  {property.type && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-indigo-600">{property.type}</div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="text-base font-bold text-slate-900 truncate">{property.addressLine1}</h4>
                  <p className="text-sm text-slate-400 mt-1">{property.city} &mdash; {property.postcode}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{property.bedrooms ? `${property.bedrooms} bed` : ""}{property.bathrooms ? ` | ${property.bathrooms} bath` : ""}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">{property.price ? `£${property.price.toLocaleString()}` : "Price N/A"}</span>
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-100 transition">View &rarr;</span>
                  </div>
                </div>
              </div>
            )) : [1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="w-full h-52 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-400">UK Apartments &mdash; Find your next home with confidence.</p>
        </div>
      </footer>
    </div>
  );
}
