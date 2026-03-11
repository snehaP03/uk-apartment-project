import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AddProperty() {
  const { token } = useAuth();
  const [form, setForm] = useState({ addressLine1: "", city: "", postcode: "", price: "", type: "", bedrooms: "", bathrooms: "", size: "", yearBuilt: "", imageKey: "" });
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [postcodeError, setPostcodeError] = useState("");
  const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

  const handleChange = (e) => {
    if (e.target.name === "postcode") setPostcodeError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fileName = Date.now() + "_" + file.name;
    setForm({ ...form, imageKey: fileName }); setPreview(URL.createObjectURL(file)); setUploading(true);
    const formData = new FormData(); formData.append("image", file); formData.append("fileName", fileName);
    try {
      const response = await fetch("http://localhost:5002/properties/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await response.json(); if (!response.ok) { alert(data.message); return; }
      setUploading(false); alert("Image uploaded successfully!");
    } catch (error) { console.error(error); alert("Failed to upload image"); setUploading(false); }
  };

  const handleSubmit = async () => {
    if (form.postcode && !ukPostcodeRegex.test(form.postcode.trim())) {
      setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }
    try {
      const response = await fetch("http://localhost:5002/properties/add", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok) { alert(data.message); return; }
      alert("Property added successfully!"); window.location.href = "/";
    } catch (error) { console.error(error); alert("Failed to submit property"); }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition placeholder:text-slate-400 bg-white";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">Add a New Property</h1>
        <p className="mt-1 text-sm text-slate-500 mb-8">Provide details about the property you want to list.</p>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Address Line 1</label><input type="text" name="addressLine1" onChange={handleChange} className={inputClass} /></div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
            <select name="city" onChange={handleChange} className={inputClass}>
              <option value="">Select City</option>
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
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">UK Postcode</label>
            <input type="text" name="postcode" placeholder="e.g. SW1A 1AA" onChange={handleChange}
              className={`${inputClass} ${postcodeError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`} />
            {postcodeError && <p className="text-xs text-red-500 mt-1">{postcodeError}</p>}
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (&pound;)</label><input type="number" name="price" onChange={handleChange} className={inputClass} /></div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property Type</label>
            <select name="type" onChange={handleChange} className={inputClass}>
              <option>Choose type</option><option>Apartment</option><option>House</option><option>Studio</option><option>Shared Flat</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Bedrooms</label><input type="number" name="bedrooms" onChange={handleChange} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Bathrooms</label><input type="number" name="bathrooms" onChange={handleChange} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Size (sq ft)</label><input type="number" name="size" onChange={handleChange} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Year Built</label><input type="number" name="yearBuilt" onChange={handleChange} className={inputClass} /></div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Upload Property Image</label>
            <div className="relative">
              <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 font-medium hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                {uploading ? "Uploading..." : "Choose Image"}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {preview && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Preview</p>
            <img src={preview} alt="Preview" className="w-64 mx-auto rounded-xl shadow-md" />
          </div>
        )}

        <button onClick={handleSubmit} className="mt-8 w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer">
          Submit Property
        </button>
      </div>
    </div>
  );
}
