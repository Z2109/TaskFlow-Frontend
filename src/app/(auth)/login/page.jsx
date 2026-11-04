"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Shield,
  Sparkles,
  User,
  Building2,
  Users,
} from "lucide-react";

import API from "@/services/api";
import { setCredentials } from "@/features/auth/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [loginType, setLoginType] = useState("owner");
  const [invitationToken, setInvitationToken] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // An invitation token may preselect Team Member, but it is not
  // required for an existing member to sign in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";

    if (token) {
      setInvitationToken(token);
      setLoginType("team");
    } else if (params.get("type") === "team") {
      setLoginType("team");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      const message = "Please enter your email and password.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      // Owners and existing team members use the same login API.
      const response = await API.post("/user/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Login failed.");
      }

      const { token, user } = response.data;

      if (!token || !user?.id) {
        throw new Error("User ID or authentication token is missing.");
      }

      // Save authentication before requesting organization data.
      const storage = keepSignedIn ? localStorage : sessionStorage;
      const otherStorage = keepSignedIn ? sessionStorage : localStorage;

      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));
      otherStorage.removeItem("token");
      otherStorage.removeItem("user");

      // Clear the previous workspace selection; resolve it for this user.
      localStorage.removeItem("organizationId");
      localStorage.removeItem("organizationName");

      dispatch(setCredentials({ token, user }));

      // This endpoint must return the organization associated with the
      // authenticated user (owner OR active organization member).
      const organizationResponse = await API.get(
        "/organizations/my-organization",
        {
          headers: { token },
        }
      );

      const organization =
        organizationResponse.data?.data?.organization ||
        organizationResponse.data?.organization ||
        organizationResponse.data?.data;

      const organizationId = organization?._id || organization?.id;

      if (!organizationId) {
        throw new Error(
          loginType === "team"
            ? "No active organization was found for this team member. Ask your organization owner to check your membership."
            : "Organization information not found."
        );
      }

      localStorage.setItem("organizationId", organizationId);
      localStorage.setItem(
        "organizationName",
        organization.name || "My Organization"
      );

      toast.success(
        loginType === "team"
          ? "Welcome back to your team!"
          : "Welcome back!"
      );

      router.replace("/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error.response?.data || error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed.";

      // Avoid leaving an authenticated session behind if workspace lookup fails.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("organizationId");
      localStorage.removeItem("organizationName");

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
            Turn ideas into progress.
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

          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-bold text-white">
              T
            </span>

            <span className="text-xl font-bold text-slate-900">
              TaskFlow
            </span>
          </div>

          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold text-indigo-600">
              YOUR WORKPLACE
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* LOGIN TYPE SELECTOR */}
          <div className="mb-7 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setLoginType("owner");
                setError("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                loginType === "owner"
                  ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <Building2
                size={22}
                className={
                  loginType === "owner"
                    ? "text-indigo-600"
                    : "text-slate-500"
                }
              />

              <p className="mt-3 text-sm font-semibold text-slate-900">
                Owner Login
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Manage your company
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType("team");
                setError("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                loginType === "team"
                  ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <Users
                size={22}
                className={
                  loginType === "team"
                    ? "text-indigo-600"
                    : "text-slate-500"
                }
              />

              <p className="mt-3 text-sm font-semibold text-slate-900">
                Team Member
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Access your team
              </p>
            </button>

          </div>

          {/* TEAM MEMBER INFORMATION */}
          {loginType === "team" && (
            <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-900">
                Team member sign in
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-700">
                Sign in with the email address and password you used
                when you accepted your organization invitation.
                You only need an invitation link when joining for the
                first time.
              </p>
            </div>
          )}

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
              {loading
                ? "Signing in..."
                : loginType === "owner"
                  ? "Sign in as Owner"
                  : "Sign in as Team Member"}
            </button>

          </form>

          {/* REGISTRATION LINKS */}
          <div className="mt-8 space-y-4 text-center">

            <p className="text-sm text-slate-500">
              New to TaskFlow?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Create a company account
              </Link>
            </p>

            <p className="text-sm text-slate-500">
              Invited by a company?{" "}
              <Link
                href={
                  invitationToken
                    ? `/accept-invitation?token=${encodeURIComponent(invitationToken)}`
                    : "/accept-invitation"
                }
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Join your team
              </Link>
            </p>

          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Secure workplace · Terms · Privacy
          </p>

        </div>
      </section>
    </main>
  );
}