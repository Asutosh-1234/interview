"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Role } from "@/generated/prisma/enums";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token and user details in localStorage
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to profile setup
      router.push("/profile-setup");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Ambient background element */}
      <div className="ambient-glow" />

      <div className="w-full max-w-md glass-panel rounded-xl p-8 z-10 flex flex-col gap-6 animate-slide-in">
        {/* Title and Subtitle */}
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tighter text-slate-100">
            Create Account
          </h1>
          <p className="text-xs text-slate-400">
            Sign up to start practicing your AI interview
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-4 pr-12 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 placeholder-slate-600 transition-all duration-200 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 text-xs font-semibold cursor-pointer select-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Account Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-3 bg-slate-950/60 dark:bg-black/40 border border-slate-850 dark:border-slate-800/80 rounded-lg focus:outline-none focus:border-slate-100 text-slate-100 transition-all duration-200 cursor-pointer appearance-none text-sm"
              >
                <option value={Role.USER} className="bg-slate-950 text-slate-100">
                  User / Candidate
                </option>
                <option value={Role.ADMIN} className="bg-slate-950 text-slate-100">
                  Admin
                </option>
                <option value={Role.SUPERADMIN} className="bg-slate-950 text-slate-100">
                  Super Admin
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold rounded-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.2)] dark:hover:shadow-[0px_0px_15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Login redirection link */}
        <div className="text-center text-xs text-slate-450 mt-1">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-slate-200 hover:text-slate-100 underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
