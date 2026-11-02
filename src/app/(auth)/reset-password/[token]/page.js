
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Lock, Eye, EyeOff } from "lucide-react";
import API from "@/services/api";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post(
                `/user/reset-password/${token}`,
                { password }
            );

            if (response.data.success) {
                toast.success("Password reset successful!");
                router.push("/login");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to reset password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Lock size={24} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900">
                    Reset password
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                    Create a new password for your TaskFlow account.
                </p>

                <form onSubmit={handleReset} className="mt-8 space-y-5">

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            New password
                        </label>

                        <div className="flex items-center rounded-xl border border-slate-200 pr-3 focus-within:border-indigo-500">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full rounded-xl px-4 py-3 outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Confirm password
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? "Resetting..." : "Reset password"}
                    </button>

                </form>

                <Link
                    href="/login"
                    className="mt-6 block text-center text-sm font-semibold text-indigo-600"
                >
                    Back to login
                </Link>

            </div>
        </main>
    );
}
