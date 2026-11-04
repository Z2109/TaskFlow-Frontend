
"use client";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useState } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Sparkles,
  Mail,
  Lock,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("Acme Technologies");
  const [workspaceUrl, setWorkspaceUrl] = useState("acme");
  const [companySize, setCompanySize] = useState("11-50");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    password.length >= 8,
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const strength = passwordChecks.filter(Boolean).length;

  const generateSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCompanyName = (value) => {
    setCompanyName(value);
    setWorkspaceUrl(generateSlug(value));
  };

  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!acceptedTerms) {
    toast.error("Please accept the Terms and Privacy Policy.");
    return;
  }

  if (strength < 3) {
    toast.error(
      "Password must contain at least 8 characters, a number and a symbol."
    );
    return;
  }

  if (!companyName.trim()) {
    toast.error("Company name is required.");
    return;
  }

  try {
    setLoading(true);

    // STEP 1: Register user
    const response = await api.post("/user/register", {
      name: name.trim(),
      email: email.trim(),
      password,
    });

    const token = response.data.token;

    if (!token) {
      throw new Error("Registration token was not received.");
    }

    // STEP 2: Save JWT
    localStorage.setItem("token", token);

    toast.success("Account created successfully!");

    // STEP 3: Create organization
    const organizationResponse = await api.post(
      "/organizations/create",
      {
        name: companyName.trim(),
      },
      {
        headers: {
          token: token,
        },
      }
    );

    // STEP 4: Extract organization ID
    const organizationId =
      organizationResponse.data?.data?.organization?._id;

    if (!organizationId) {
      throw new Error("Organization ID was not returned by the server.");
    }

    // STEP 5: Save organization ID
    localStorage.setItem("organizationId", organizationId);

    // Save organization name as well
    localStorage.setItem("organizationName", companyName.trim());

    console.log("Organization created:", organizationId);

    toast.success("Your company workspace is ready!");

    // STEP 6: Navigate to Invite Team
    router.push("/invite-team");

  } catch (error) {
    console.error(
      "Registration error:",
      error.response?.data || error
    );

    toast.error(
      error.response?.data?.message ||
      error.message ||
      "Registration failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="min-h-screen bg-white md:grid md:grid-cols-2">

      {/* LEFT PROMOTIONAL PANEL */}

      <section className="hidden min-h-screen flex-col justify-between bg-[#171b48] p-12 text-white md:flex lg:p-16">

        <Link href="/login" className="flex items-center gap-3 text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600">
            T
          </span>
          TaskFlow
        </Link>

        <div className="max-w-lg">

          <h1 className="mb-5 text-5xl font-bold leading-tight">
            Set up your company in minutes.
          </h1>

          <p className="mb-8 text-sm leading-6 text-indigo-200">
            Create a workspace, become its Owner, then invite your team
            and assign roles.
          </p>

          {/* PROJECT PROGRESS CARD */}

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

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-indigo-200">
                12 of 20 tasks done
              </p>

              <div className="flex -space-x-2">
                {["A", "Z", "S", "R"].map((item, index) => (
                  <span
                    key={index}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#252956] bg-indigo-200 text-xs font-bold text-indigo-900"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* BENEFITS */}

          <div className="mt-8 space-y-5 text-sm text-indigo-100">

            <p className="flex items-center gap-3">
              <User size={18} />
              Invite your team with role-based access
            </p>

            <p className="flex items-center gap-3">
              <Shield size={18} />
              Owners control who can view, create, edit or delete
            </p>

            <p className="flex items-center gap-3">
              <Sparkles size={18} />
              Ask the built-in AI assistant about any project
            </p>

          </div>
        </div>

        <p className="text-sm text-indigo-300">
          TaskFlow · Plan better · Work smarter.
        </p>

      </section>

      {/* RIGHT REGISTRATION FORM */}

      <section className="flex min-h-screen items-center justify-center px-6 py-10 md:px-10 lg:px-16">

        <div className="w-full max-w-md">

          {/* TOP NAVIGATION */}

          <div className="mb-7 flex items-center gap-4">

            <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Register company
            </span>

            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              Sign in
            </Link>

          </div>

          {/* TEAM MEMBER REGISTRATION OPTION */}
<div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
  <div className="flex items-start gap-3">
    <div className="rounded-lg bg-white p-2 text-indigo-600">
      <User size={20} />
    </div>

    <div>
      <h3 className="text-sm font-semibold text-slate-900">
        Joining an existing company?
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        You don't need to create another company. Use the
        invitation link sent to your email to register as a
        team member.
      </p>

      <Link
        href="/accept-invitation"
        className="mt-3 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        Accept invitation and join team →
      </Link>
    </div>
  </div>
</div>

          {/* PROGRESS STEPS */}

          <div className="mb-6 flex items-center gap-5 text-xs font-medium">

            <div className="flex items-center gap-2 text-slate-900">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white">
                1
              </span>
              Company
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100">
                2
              </span>
              Invite team
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100">
                3
              </span>
              Done
            </div>

          </div>

          <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900">
            Create your company workspace
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* COMPANY NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Company name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(e) => handleCompanyName(e.target.value)}
                placeholder="Acme Technologies"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* WORKSPACE URL */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Workspace URL <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 focus-within:border-indigo-500">
                <input
                  type="text"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(generateSlug(e.target.value))}
                  required
                  className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                />

                <span className="whitespace-nowrap px-3 text-xs text-slate-500">
                  .taskflow.app
                </span>
              </div>

              <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                <Check size={13} />
                Workspace URL preview: {workspaceUrl || "your-company"}.taskflow.app
              </p>
            </div>

            {/* COMPANY SIZE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Company size
              </label>

              <div className="flex flex-wrap gap-2">
                {["1-10", "11-50", "51-200", "200+"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setCompanySize(size)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      companySize === size
                        ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* NAME AND EMAIL */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Your name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Zaid Zafar"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Work email <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-indigo-500">
                  <Mail size={15} className="text-slate-500" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="zaid@acme.com"
                    required
                    className="min-w-0 w-full py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Password <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-indigo-500">
                <Lock size={15} className="text-slate-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="min-w-0 w-full py-2.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* PASSWORD STRENGTH */}

              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={`h-1.5 flex-1 rounded-full ${
                      strength >= item
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                ))}

                <span className="ml-2 text-xs font-semibold text-emerald-700">
                  {strength === 3 ? "Strong" : strength === 2 ? "Medium" : strength === 1 ? "Weak" : ""}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                12+ characters, a number and a symbol
              </p>
            </div>

            {/* TERMS */}

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />

              I agree to the Terms and Privacy Policy
            </label>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {loading ? "Creating your workspace...": "Create company account"}
            </button>

          </form>

          {/* SOCIAL SIGNUP PLACEHOLDERS */}

          <p className="my-3 text-center text-xs text-slate-400">
            or continue with
          </p>

          <div className="grid grid-cols-3 gap-3">

            {["Google", "GitHub", "Microsoft"].map((provider) => (
              <button
                key={provider}
                type="button"
                disabled
                className="rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-600"
              >
                {provider}
              </button>
            ))}

          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            You become the company Owner and can assign roles after sign-up.
          </p>

        </div>
      </section>
    </main>
  );
}
