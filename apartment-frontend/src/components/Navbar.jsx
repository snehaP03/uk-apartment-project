import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-indigo-50 text-indigo-600"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline" onClick={closeMenu}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200">
            UK
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">
            Apartments
          </span>
        </Link>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className={`block w-5 h-0.5 bg-slate-600 rounded transition-transform duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}></span>
          <span className={`block w-5 h-0.5 bg-slate-600 rounded transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`}></span>
          <span className={`block w-5 h-0.5 bg-slate-600 rounded transition-transform duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}></span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            <Link to="/search" className={linkClass("/search")} onClick={closeMenu}>Search</Link>
            {isLoggedIn && (
              <>
                <Link to="/add" className={linkClass("/add")} onClick={closeMenu}>Add Property</Link>
                <Link to="/profile" className={linkClass("/profile")} onClick={closeMenu}>Profile</Link>
                {user.role === "admin" && (
                  <Link to="/admin" className={`${linkClass("/admin")} !text-amber-600 ${isActive("/admin") ? "!bg-amber-50" : "hover:!bg-amber-50"}`} onClick={closeMenu}>Admin</Link>
                )}
              </>
            )}
            {!isLoggedIn && (
              <Link to="/login" className={linkClass("/login")} onClick={closeMenu}>Login</Link>
            )}
          </div>

          <div className="ml-3 pl-3 border-l border-slate-200 flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all no-underline hover:no-underline" onClick={closeMenu}>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={closeMenu}></div>
          <div className="fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-white shadow-2xl z-50 md:hidden flex flex-col p-5 gap-1 overflow-y-auto animate-slide-in">
            <Link to="/search" className={`${linkClass("/search")} !py-3 !text-base`} onClick={closeMenu}>Search</Link>
            {isLoggedIn ? (
              <>
                <Link to="/add" className={`${linkClass("/add")} !py-3 !text-base`} onClick={closeMenu}>Add Property</Link>
                <Link to="/profile" className={`${linkClass("/profile")} !py-3 !text-base`} onClick={closeMenu}>Profile</Link>
                {user.role === "admin" && (
                  <Link to="/admin" className={`${linkClass("/admin")} !py-3 !text-base !text-amber-600`} onClick={closeMenu}>Admin</Link>
                )}
                <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full text-center py-2.5 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition cursor-pointer">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`${linkClass("/login")} !py-3 !text-base`} onClick={closeMenu}>Login</Link>
                <div className="mt-auto pt-5 border-t border-slate-100">
                  <Link to="/register" className="block text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl no-underline hover:no-underline hover:shadow-lg transition-all" onClick={closeMenu}>
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
