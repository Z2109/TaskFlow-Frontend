
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Mail,
  Users,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";

import API from "@/services/api";
import { toast } from "react-toastify";

export default function AcceptInvitationPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

  // Read invitation token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitationToken = params.get("token");

    if (!invitationToken) {
      setError("Invitation token is missing. Please use the link from your email.");
      setLoading(false);
      return;
    }

    setToken(invitationToken);
  }, []);

  // Validate invitation
  useEffect(() => {
    if (!token) return;

    const validate = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/invitations/validate/${encodeURIComponent(token)}`
        );

        if (!response.data?.success || !response.data?.invitation) {
          throw new Error(
            response.data?.message || "Unable to validate invitation."
          );
        }

        setInvitation(response.data.invitation);

      } catch (err) {
        console.error(
          "Invitation validation error:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
          err.message ||
          "This invitation is invalid or has expired."
        );

      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  // Get the currently stored authentication token
  const getAuthToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // Accept invitation
  const handleAcceptInvitation = async () => {
    const authToken = getAuthToken();

    let storedUser = null;
    try {
      const rawUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      storedUser = rawUser ? JSON.parse(rawUser) : null;
    } catch (storageError) {
      console.error("Unable to read stored user:", storageError);
    }

    const signedInEmail = storedUser?.email?.trim().toLowerCase();
    const invitedEmail = invitation?.email?.trim().toLowerCase();

    if (!authToken || !signedInEmail) {
      toast.info("Please sign in with the email address shown in this invitation.");
      router.push(
        `/login?type=team&token=${encodeURIComponent(token)}`
      );
      return;
    }

    if (invitedEmail && signedInEmail !== invitedEmail) {
      toast.error(`This invitation was sent to ${invitation.email}. Please sign in with that email address.`);
      router.push(
        `/login?type=team&token=${encodeURIComponent(token)}`
      );
      return;
    }

    try {
      setAccepting(true);

      const response = await API.post(
        `/invitations/accept/${encodeURIComponent(token)}`,
        {},
        {
          headers: {
            token: authToken,
          },
        }
      );

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to accept invitation."
        );
      }

      // Save the joined organization
      if (result.organization?.id) {
        localStorage.setItem(
          "organizationId",
          result.organization.id
        );
      }

      if (result.organization?.name) {
        localStorage.setItem(
          "organizationName",
          result.organization.name
        );
      }

      setWelcomeEmailSent(Boolean(result.welcomeEmailSent));
      setAccepted(true);

      toast.success("Welcome to the team!");

    } catch (err) {
      console.error(
        "Accept invitation error:",
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Unable to accept invitation."
      );

    } finally {
      setAccepting(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-indigo-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying your invitation...
          </p>
        </div>
      </main>
    );
  }

  // Invalid invitation
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle size={32} className="text-red-500" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-[#171b48]">
            Invitation unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Please ask your organization administrator to send you a new invitation.
          </p>

          <Link
            href={token ? `/login?type=team&token=${encodeURIComponent(token)}` : "/login?type=team"}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to login
            <ArrowRight size={16} />
          </Link>

        </div>
      </main>
    );
  }

  // Successful acceptance
  if (accepted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4 py-10">

        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Invitation accepted
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#171b48]">
            Welcome to TaskFlow!
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            You are now officially part of{" "}
            <strong className="text-slate-800">
              {invitation?.organization?.name}
            </strong>.
          </p>

          <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left">

            <div className="flex items-center gap-3">
              <Building2 size={19} className="text-indigo-600" />

              <div>
                <p className="text-xs text-slate-400">
                  Organization
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  {invitation?.organization?.name}
                </p>
              </div>
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="flex items-center gap-3">
              <ShieldCheck size={19} className="text-indigo-600" />

              <div>
                <p className="text-xs text-slate-400">
                  Your role
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  {invitation?.role?.name}
                </p>
              </div>
            </div>

          </div>

          <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <p className="font-semibold">
              You're officially a team member!
            </p>

            <p className="mt-1 text-xs">
              You can now collaborate with your organization on TaskFlow.
            </p>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            {welcomeEmailSent
              ? "A welcome email has also been sent to your inbox."
              : "Your membership is active. The welcome email could not be sent, but you can continue to TaskFlow."}
          </p>

          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            Go to TaskFlow dashboard
            <ArrowRight size={17} />
          </button>

        </div>
      </main>
    );
  }

  // Invitation details
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] px-4 py-10">

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">

        {/* Logo */}
        <Link
          href={token ? `/login?type=team&token=${encodeURIComponent(token)}` : "/login?type=team"}
          className="flex items-center justify-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            T
          </span>

          <span className="text-xl font-bold tracking-tight text-[#171b48]">
            TaskFlow
          </span>
        </Link>

        {/* Invitation heading */}
        <div className="mt-9 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Users size={30} className="text-indigo-600" />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-indigo-600">
            Team invitation
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#171b48]">
            You're invited!
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            You've been invited to join an organization on TaskFlow.
            Accept the invitation to become a team member.
          </p>

        </div>

        {/* Invitation information */}
        <div className="mt-8 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">

          <div className="flex items-start gap-3">
            <Building2 size={19} className="mt-0.5 text-indigo-600" />

            <div>
              <p className="text-xs text-slate-400">
                Organization
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {invitation?.organization?.name || "TaskFlow organization"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail size={19} className="mt-0.5 text-indigo-600" />

            <div>
              <p className="text-xs text-slate-400">
                Invited email
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                {invitation?.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck size={19} className="mt-0.5 text-indigo-600" />

            <div>
              <p className="text-xs text-slate-400">
                Assigned role
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {invitation?.role?.name || "Team member"}
              </p>

              {invitation?.role?.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {invitation.role.description}
                </p>
              )}
            </div>
          </div>

          {invitation?.invitedBy?.name && (
            <div className="flex items-start gap-3">
              <Users size={19} className="mt-0.5 text-indigo-600" />

              <div>
                <p className="text-xs text-slate-400">
                  Invited by
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {invitation.invitedBy.name}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <Clock size={15} />

            Invitation expires in 7 days from its creation.
          </div>

        </div>

        {/* SIGN-IN GUIDANCE */}
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
          <p className="text-xs leading-5 text-indigo-800">
            Sign in using <strong>{invitation?.email}</strong>. If another TaskFlow account is currently signed in, the sign-in link below will let you switch accounts without losing this invitation.
          </p>
        </div>

        {/* Accept invitation */}
        <button
          type="button"
          onClick={handleAcceptInvitation}
          disabled={accepting}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accepting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Accepting invitation...
            </>
          ) : (
            <>
              Accept Invitation
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          You must be signed in with the invited email address to accept this invitation.
        </p>

        <div className="mt-5 border-t border-slate-100 pt-5 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?
          </p>

          <Link
            href={token ? `/login?type=team&token=${encodeURIComponent(token)}` : "/login?type=team"}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in to TaskFlow
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </main>
  );
}
