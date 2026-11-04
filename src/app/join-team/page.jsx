"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Mail,
    ShieldCheck,
    Users,
    UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";

import API from "@/services/api";
import { setCredentials } from "@/features/auth/authSlice";

export default function JoinTeamPage() {
    const router = useRouter();
    const dispatch = useDispatch();

    const [token, setToken] = useState("");
    const [invitation, setInvitation] = useState(null);

    const [mode, setMode] = useState("register");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState("");

    // =================================
    // 1. READ AND VALIDATE INVITATION
    // =================================

    useEffect(() => {
        const validateInvite = async () => {
            try {
                const params = new URLSearchParams(
                    window.location.search
                );

                const invitationToken = params.get("token");

                if (!invitationToken) {
                    throw new Error(
                        "Invitation token is missing."
                    );
                }

                setToken(invitationToken);

                const response = await API.get(
                    `/invitations/validate/${invitationToken}`
                );

                if (!response.data?.success) {
                    throw new Error(
                        response.data?.message ||
                        "Invalid invitation."
                    );
                }

                const invite = response.data.invitation;

                setInvitation(invite);
                setEmail(invite.email || "");

                // Check whether the invited email already has
                // a TaskFlow account.
                const savedUser = localStorage.getItem("user");

                if (savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);

                        if (
                            parsedUser.email?.toLowerCase() ===
                            invite.email?.toLowerCase()
                        ) {
                            setMode("existing");
                        }
                    } catch {
                        localStorage.removeItem("user");
                    }
                }

            } catch (err) {
                console.error(
                    "Invitation validation error:",
                    err
                );

                const message =
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to validate invitation.";

                setError(message);
                toast.error(message);

            } finally {
                setValidating(false);
            }
        };

        validateInvite();
    }, []);

    // =================================
    // 2. SAVE AUTHENTICATION
    // =================================

    const saveAuthentication = (authToken, user) => {
        localStorage.setItem("token", authToken);
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        // This invitation flow uses localStorage.
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        // Remove any previously selected organization.
        localStorage.removeItem("organizationId");
        localStorage.removeItem("organizationName");

        dispatch(
            setCredentials({
                token: authToken,
                user,
            })
        );
    };

    // =================================
    // 3. ACCEPT INVITATION
    // =================================

    const acceptTeamInvitation = async (authToken) => {
        const response = await API.post(
            `/invitations/accept/${token}`,
            {},
            {
                headers: {
                    token: authToken,
                },
            }
        );

        if (!response.data?.success) {
            throw new Error(
                response.data?.message ||
                "Unable to accept invitation."
            );
        }

        const organization = response.data.organization;

        if (!organization?.id) {
            throw new Error(
                "Organization information is missing."
            );
        }

        // Save the newly joined organization.
        localStorage.setItem(
            "organizationId",
            organization.id
        );

        localStorage.setItem(
            "organizationName",
            organization.name
        );

        toast.success(
            "Welcome to " + organization.name + "!"
        );

        router.replace("/dashboard");
    };

    // =================================
    // 4. NEW EMPLOYEE REGISTRATION
    // =================================

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        if (!name.trim()) {
            toast.error("Please enter your name.");
            return;
        }

        if (password.length < 8) {
            toast.error(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            // Register using the invitation token.
            // Backend obtains the email from the invitation.
            const response = await API.post(
                `/user/register-invited/${token}`,
                {
                    name: name.trim(),
                    password,
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Registration failed."
                );
            }

            const { token: authToken, user } = response.data;

            if (!authToken || !user?.id) {
                throw new Error(
                    "Authentication information is missing."
                );
            }

            // Save user login.
            saveAuthentication(authToken, user);

            toast.success("Account created successfully!");

            // Activate membership and assign invited role.
            await acceptTeamInvitation(authToken);

        } catch (err) {
            console.error(
                "Invited registration error:",
                err.response?.data || err
            );

            const message =
                err.response?.data?.message ||
                err.message ||
                "Unable to complete registration.";

            setError(message);
            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // =================================
    // 5. EXISTING EMPLOYEE LOGIN
    // =================================

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.trim() || !password) {
            toast.error(
                "Please enter your email and password."
            );
            return;
        }

        // Do not allow a different account to accept this invite.
        if (
            email.trim().toLowerCase() !==
            invitation.email.trim().toLowerCase()
        ) {
            toast.error(
                "Please sign in using the invited email address."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await API.post(
                "/user/login",
                {
                    email: email.trim(),
                    password,
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Login failed."
                );
            }

            const {
                token: authToken,
                user,
            } = response.data;

            if (!authToken || !user?.id) {
                throw new Error(
                    "Authentication information is missing."
                );
            }

            // Verify the account returned by the backend.
            if (
                user.email?.toLowerCase() !==
                invitation.email.toLowerCase()
            ) {
                throw new Error(
                    "Please sign in with the invited email address."
                );
            }

            saveAuthentication(authToken, user);

            toast.success("Login successful!");

            // Activate organization membership.
            await acceptTeamInvitation(authToken);

        } catch (err) {
            console.error(
                "Team login error:",
                err.response?.data || err
            );

            const message =
                err.response?.data?.message ||
                err.message ||
                "Unable to sign in.";

            setError(message);
            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // =================================
    // LOADING SCREEN
    // =================================

    if (validating) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-600" />

                    <p className="font-medium text-slate-600">
                        Verifying your invitation...
                    </p>
                </div>
            </main>
        );
    }

    // =================================
    // INVALID INVITATION
    // =================================

    if (!invitation) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                        <ShieldCheck className="h-8 w-8 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Invitation unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        {error ||
                            "This invitation may have expired or already been used."}
                    </p>

                    <Link
                        href="/login"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Go to Login
                        <ArrowRight size={17} />
                    </Link>

                </div>
            </main>
        );
    }

    // =================================
    // JOIN TEAM PAGE
    // =================================

    return (
        <main className="min-h-screen bg-[#f7f8fc] lg:grid lg:grid-cols-2">

            {/* LEFT BRANDING SECTION */}

            <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#171b48] p-12 text-white lg:flex xl:p-16">

                <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

                <Link
                    href="/"
                    className="relative z-10 flex items-center gap-3"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold">
                        T
                    </span>

                    <span className="text-2xl font-bold tracking-tight">
                        TaskFlow
                    </span>
                </Link>

                <div className="relative z-10 max-w-lg">

                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/10 px-4 py-2 text-sm text-indigo-100">
                        <Users size={16} />
                        Team collaboration starts here
                    </div>

                    <h1 className="text-5xl font-bold leading-tight xl:text-6xl">
                        Great work happens together.
                    </h1>

                    <p className="mt-6 max-w-md text-lg leading-8 text-indigo-200">
                        Join your team on TaskFlow. Organize
                        projects, manage tasks and collaborate
                        with everyone in one workspace.
                    </p>

                    <div className="mt-10 space-y-5">

                        {[
                            "Collaborate with your team",
                            "Manage tasks and projects",
                            "Track your team's progress",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3"
                            >
                                <CheckCircle2
                                    size={20}
                                    className="text-indigo-300"
                                />

                                <span className="text-indigo-100">
                                    {item}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                <p className="relative z-10 text-sm text-indigo-300">
                    © {new Date().getFullYear()} TaskFlow. All rights reserved.
                </p>

            </section>

            {/* RIGHT FORM SECTION */}

            <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">

                <div className="w-full max-w-lg">

                    {/* MOBILE BRAND */}

                    <Link
                        href="/"
                        className="mb-9 flex items-center gap-3 lg:hidden"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                            T
                        </span>

                        <span className="text-xl font-bold text-slate-900">
                            TaskFlow
                        </span>
                    </Link>

                    {/* INVITATION CARD */}

                    <div className="mb-7 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">

                        <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                <UserPlus size={23} />
                            </div>

                            <div className="min-w-0">

                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    You're invited
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Join {invitation.organization?.name || "your team"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-600">
                                    You've been invited to collaborate on TaskFlow.
                                </p>

                            </div>

                        </div>

                        <div className="mt-5 grid gap-3 border-t border-indigo-100 pt-4 sm:grid-cols-2">

                            <div>
                                <p className="text-xs text-slate-500">
                                    Invited email
                                </p>

                                <p className="mt-1 flex items-center gap-2 break-all text-sm font-semibold text-slate-800">
                                    <Mail size={15} />
                                    {invitation.email}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Assigned role
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {invitation.role?.name || "Team Member"}
                                </p>
                            </div>

                        </div>

                        {invitation.invitedBy?.name && (
                            <p className="mt-3 text-xs text-slate-500">
                                Invited by {invitation.invitedBy.name}
                            </p>
                        )}

                    </div>

                    {/* FORM HEADING */}

                    <div className="mb-6">

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {mode === "register"
                                ? "Create your account"
                                : "Welcome back"}
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {mode === "register"
                                ? "Set up your account to join your organization."
                                : "Sign in with your existing TaskFlow account to accept this invitation."}
                        </p>

                    </div>

                    {/* MODE SWITCH */}

                    <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">

                        <button
                            type="button"
                            onClick={() => {
                                setMode("register");
                                setError("");
                                setPassword("");
                            }}
                            className={`rounded-lg py-3 text-sm font-semibold transition ${
                                mode === "register"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Create Account
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode("existing");
                                setError("");
                                setPassword("");
                            }}
                            className={`rounded-lg py-3 text-sm font-semibold transition ${
                                mode === "existing"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Sign In
                        </button>

                    </div>

                    {/* FORM */}

                    <form
                        onSubmit={
                            mode === "register"
                                ? handleRegister
                                : handleLogin
                        }
                        className="space-y-5"
                    >

                        {/* NAME */}

                        {mode === "register" && (
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Full name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                            </div>
                        )}

                        {/* EMAIL */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Email address
                            </label>

                            <div className="relative">

                                <Mail
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    required
                                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3.5 pl-11 pr-4 text-sm text-slate-600 outline-none"
                                />

                            </div>

                            <p className="mt-2 text-xs text-slate-400">
                                This email is locked to your invitation.
                            </p>

                        </div>

                        {/* PASSWORD */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Password
                            </label>

                            <div className="relative">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    autoComplete={
                                        mode === "register"
                                            ? "new-password"
                                            : "current-password"
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    {showPassword
                                        ? <EyeOff size={18} />
                                        : <Eye size={18} />
                                    }
                                </button>

                            </div>

                            {mode === "register" && (
                                <p className="mt-2 text-xs text-slate-400">
                                    Use at least 8 characters.
                                </p>
                            )}

                        </div>

                        {/* CONFIRM PASSWORD */}

                        {mode === "register" && (
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Confirm password
                                </label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />

                            </div>
                        )}

                        {/* ERROR */}

                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {loading ? (
                                <>
                                    <Loader2
                                        size={19}
                                        className="animate-spin"
                                    />

                                    Processing...
                                </>
                            ) : (
                                <>
                                    {mode === "register"
                                        ? "Create Account & Join Team"
                                        : "Sign In & Join Team"}

                                    <ArrowRight size={18} />
                                </>
                            )}

                        </button>

                    </form>

                    <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <ShieldCheck size={15} />
                        Secure invitation-based onboarding
                    </div>

                    <p className="mt-5 text-center text-sm text-slate-500">
                        Having trouble?
                        {" "}
                        <Link
                            href="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Contact your administrator
                        </Link>
                    </p>

                </div>

            </section>

        </main>
    );
}