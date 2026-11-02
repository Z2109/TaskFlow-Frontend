
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import API from "@/services/api";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await API.post(
                "/user/forgot-password",
                { email: email.trim() }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                router.push("/login");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to send reset link"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Mail size={24} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900">
                    Forgot password?
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                    Enter your registered email address.
                    We will send you a password reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>

                </form>

                <Link
                    href="/login"
                    className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                    <ArrowLeft size={16} />
                    Back to login
                </Link>

            </div>
        </main>
    );
}
