"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.name) {
          setUserName(user.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.error("Logout API request failed:", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cookies via client redirection
    document.cookie = "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Interviews", href: "/setup" },
  ];

  return (
    <nav className="w-full top-0 sticky z-50 bg-slate-950/80 dark:bg-black/85 backdrop-blur-md border-b border-slate-850/80 dark:border-slate-800/80 shadow-[0px_0px_15px_rgba(255,255,255,0.02)] transition-colors duration-300">
      <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-sans text-xl font-bold tracking-tighter text-slate-100 hover:opacity-90 select-none">
            AI Interview Bot
          </Link>
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href === "/setup" && pathname === "/interview");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-sans text-sm font-medium transition-all duration-200 py-1 ${
                    isActive
                      ? "text-slate-100 border-b-2 border-slate-100"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <span className="font-sans text-sm font-medium text-slate-500 cursor-not-allowed py-1 select-none">
              Resources
            </span>
          </div>
        </div>

        {/* Profile and Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            title="Notifications"
            className="text-slate-400 hover:text-slate-100 transition-colors p-1.5 rounded-lg hover:bg-slate-900/60"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* User profile image / initial placeholder */}
          <div className="relative flex items-center">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden cursor-pointer hover:border-slate-100 transition-colors focus:outline-none"
            >
              {userName.substring(0, 2).toUpperCase()}
            </button>
            
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-800 mb-1 select-none">
                    Account: <span className="text-slate-200 block truncate normal-case font-normal mt-0.5">{userName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
