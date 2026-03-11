import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PropertySearch() {
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const initialPostcode = query.get("postcode") || "";

  const [filters, setFilters] = useState({
    postcode: initialPostcode, city: "", type: "", minPrice: "", maxPrice: "", bedrooms: "",
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postcodeError, setPostcodeError] = useState("");
  const hasFetched = useRef(false);

  const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

  const buildQueryString = useCallback((currentFilters) => {
    const params = new URLSearchParams();
    if (currentFilters.postcode) params.set("postcode", currentFilters.postcode);
    if (currentFilters.city) params.set("city", currentFilters.city);
    if (currentFilters.type) params.set("type", currentFilters.type);
    if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
    if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
    if (currentFilters.bedrooms) params.set("bedrooms", currentFilters.bedrooms);
    return params.toString();
  }, []);

  const fetchProperties = useCallback((currentFilters) => {
    setLoading(true);
    const qs = buildQueryString(currentFilters || filters);
    fetch(`http://localhost:5002/properties?${qs}`)
      .then((res) => res.json())
      .then((data) => { setProperties(data); setLoading(false); })
      .catch((err) => { console.error("Error:", err); setLoading(false); });
  }, [filters, buildQueryString]);

  // Initial fetch on first render
  if (!hasFetched.current) {
    hasFetched.current = true;
    const qs = buildQueryString(filters);
    fetch(`http://localhost:5002/properties?${qs}`)
      .then((res) => res.json())
      .then((data) => { setProperties(data); setLoading(false); })
      .catch((err) => { console.error("Error:", err); setLoading(false); });
  }

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const validatePostcode = (value) => {
    if (value && !ukPostcodeRegex.test(value.trim())) {
      setPostcodeError("Enter a valid UK postcode (e.g. SW1A 1AA)");
      return false;
    }
    setPostcodeError("");
    return true;
  };

  const handleSearch = () => {
    if (!validatePostcode(filters.postcode)) return;
    fetchProperties(filters);
  };

  const handleClear = () => {
    const cleared = { postcode: "", city: "", type: "", minPrice: "", maxPrice: "", bedrooms: "" };
    setFilters(cleared);
    fetchProperties(cleared);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition bg-white placeholder:text-slate-400";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Search Properties</h1>

      {/* Filters */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <input type="text" name="postcode" placeholder="UK Postcode (e.g. SW1A 1AA)" value={filters.postcode}
              onChange={(e) => { handleChange(e); setPostcodeError(""); }}
              className={`${inputClass} ${postcodeError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`} />
            {postcodeError && <p className="text-xs text-red-500 mt-1">{postcodeError}</p>}
          </div>
          <select name="city" value={filters.city} onChange={handleChange} className={inputClass}>
            <option value="">All Cities</option>
            <option value="London">London</option>
            <option value="Manchester">Manchester</option>
            <option value="Birmingham">Birmingham</option>
            <option value="Leeds">Leeds</option>
            <option value="Liverpool">Liverpool</option>
            <option value="Bristol">Bristol</option>
            <option value="Sheffield">Sheffield</option>
            <option value="Newcastle">Newcastle</option>
            <option value="Nottingham">Nottingham</option>
            <option value="Leicester">Leicester</option>
            <option value="Coventry">Coventry</option>
            <option value="Cardiff">Cardiff</option>
            <option value="Edinburgh">Edinburgh</option>
            <option value="Glasgow">Glasgow</option>
            <option value="Belfast">Belfast</option>
            <option value="Brighton">Brighton</option>
            <option value="Oxford">Oxford</option>
            <option value="Cambridge">Cambridge</option>
            <option value="Southampton">Southampton</option>
            <option value="Plymouth">Plymouth</option>
            <option value="Reading">Reading</option>
            <option value="Aberdeen">Aberdeen</option>
            <option value="Swansea">Swansea</option>
            <option value="Bath">Bath</option>
            <option value="York">York</option>
          </select>
          <select name="type" value={filters.type} onChange={handleChange} className={inputClass}>
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
            <option value="Shared Flat">Shared Flat</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <select name="minPrice" value={filters.minPrice} onChange={handleChange} className={inputClass}>
            <option value="">Min Price (£)</option>
            <option value="200">£200</option>
            <option value="400">£400</option>
            <option value="600">£600</option>
            <option value="800">£800</option>
            <option value="1000">£1,000</option>
            <option value="1250">£1,250</option>
            <option value="1500">£1,500</option>
            <option value="2000">£2,000</option>
            <option value="2500">£2,500</option>
            <option value="3000">£3,000</option>
            <option value="4000">£4,000</option>
            <option value="5000">£5,000</option>
          </select>
          <select name="maxPrice" value={filters.maxPrice} onChange={handleChange} className={inputClass}>
            <option value="">Max Price (£)</option>
            <option value="500">£500</option>
            <option value="750">£750</option>
            <option value="1000">£1,000</option>
            <option value="1250">£1,250</option>
            <option value="1500">£1,500</option>
            <option value="2000">£2,000</option>
            <option value="2500">£2,500</option>
            <option value="3000">£3,000</option>
            <option value="4000">£4,000</option>
            <option value="5000">£5,000</option>
            <option value="7500">£7,500</option>
            <option value="10000">£10,000</option>
          </select>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleChange} className={inputClass}>
            <option value="">Any Bedrooms</option>
            <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option>
          </select>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSearch} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer">Search</button>
          <button onClick={handleClear} className="px-6 py-2.5 text-sm font-medium text-slate-500 border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">Clear</button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold text-slate-500">{properties.length} Properties Found</h2>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-slate-400">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No properties found matching your filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property._id} onClick={() => navigate(`/property/${property._id}`)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer">
              <div className="relative overflow-hidden">
                <img src={`http://localhost:5002/uploads/${property.imageKey}`} alt="Property"
                  onError={(e) => { e.target.src = "/property-images/1.jpg"; }}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                {property.type && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-indigo-600">{property.type}</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 truncate">{property.addressLine1}</h3>
                <p className="text-sm text-slate-400 mt-1">{property.city} &mdash; {property.postcode}</p>
                <p className="text-xs text-slate-400 mt-0.5">{property.bedrooms ? `${property.bedrooms} bed` : ""}{property.bathrooms ? ` | ${property.bathrooms} bath` : ""}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-indigo-600">{property.price ? `\u00A3${property.price}` : "Price N/A"}</span>
                  <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-100 transition">View &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
