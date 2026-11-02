
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { toast } from "react-toastify";
import { Shield, Sparkles, User } from "lucide-react";

import API from "@/services/api";
import { setCredentials } from "@/features/auth/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // 1. Authenticate user
      const response = await API.post("/user/login", {
        email: email.trim(),
        password,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Login failed!"
        );
      }

      const { token, user } = response.data;

      // 2. Validate backend response
      if (!token || !user?.id) {
        throw new Error(
          "User ID or authentication token is missing."
        );
      }

      // 3. Persist authentication details
      const storage = keepSignedIn
        ? localStorage
        : sessionStorage;

      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));

      // Remove stale authentication from the other storage
      const otherStorage = keepSignedIn
        ? sessionStorage
        : localStorage;

      otherStorage.removeItem("token");
      otherStorage.removeItem("user");

      // 4. Clear previous organization selection
      localStorage.removeItem("organizationId");
      localStorage.removeItem("organizationName");

      // 5. Update Redux authentication state
      dispatch(setCredentials({ token, user }));

      // 6. Fetch the user's organization
      const organizationResponse = await API.get(
        "/organizations/my-organization",
        {
          headers: {
            token,
          },
        }
      );

      const organization =
        organizationResponse.data?.data?.organization;

      if (!organization?._id) {
        throw new Error(
          "Organization information not found."
        );
      }

      // 7. Save organization information
      localStorage.setItem(
        "organizationId",
        organization._id
      );

      localStorage.setItem(
        "organizationName",
        organization.name
      );

      // 8. Login successful
      toast.success("Login successful!");

      router.replace("/dashboard");

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error.response?.data || error
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed!";

      setError(message);
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white md:grid md:grid-cols-2">

      {/* LEFT PROMOTIONAL PANEL */}
      <section className="hidden min-h-screen flex-col justify-between bg-[#171b48] p-12 text-white md:flex lg:p-16">

        <Link
          href="/login"
          className="flex items-center gap-3 text-xl font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600">
            T
          </span>
          TaskFlow
        </Link>

        <div className="max-w-lg">
          <h1 className="mb-5 text-5xl font-bold leading-tight">
            Turn ideas into progress
          </h1>

          <p className="mb-8 text-indigo-200">
            Plan work, assign people and track every project
            across your company.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                E-Commerce Platform
              </h3>

              <span className="rounded-full bg-indigo-500/30 px-3 py-1 text-xs">
                60%
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/5 rounded-full bg-indigo-400" />
            </div>

            <p className="mt-3 text-sm text-indigo-200">
              12 of 20 tasks done
            </p>
          </div>

          <div className="mt-8 space-y-5 text-sm text-indigo-100">
            <p className="flex items-center gap-3">
              <User size={18} />
              Invite your team with role-based access
            </p>

            <p className="flex items-center gap-3">
              <Shield size={18} />
              Control who can view, create, edit or delete
            </p>

            <p className="flex items-center gap-3">
              <Sparkles size={18} />
              Manage projects and track team progress
            </p>
          </div>
        </div>

        <p className="text-sm text-indigo-300">
          TaskFlow · Plan better · Work smarter.
        </p>
      </section>

      {/* LOGIN FORM */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-bold text-white">
              T
            </span>

            <span className="text-xl font-bold text-slate-900">
              TaskFlow
            </span>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-indigo-600">
              YOUR WORKPLACE
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to your company workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* KEEP SIGNED IN */}
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />

              Keep me signed in
            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Register your company
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">
            Secure workplace · Terms · Privacy
          </p>

        </div>
      </section>
    </main>
  );
}
