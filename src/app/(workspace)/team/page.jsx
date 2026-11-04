
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    UserPlus,
    Search,
    RefreshCw,
    Mail,
    ShieldCheck,
    Clock3,
    UserCheck,
    UserX,
    MoreHorizontal,
    BriefcaseBusiness,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const FILTERS = ["All", "Active", "Invited", "Suspended"];

const getInitials = (name = "") => {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
};

const formatDate = (date) => {
    if (!date) return "Not joined";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "Not joined";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const statusStyles = {
    active: "bg-emerald-50 text-emerald-700",
    invited: "bg-amber-50 text-amber-700",
    suspended: "bg-red-50 text-red-700",
};

export default function TeamPage() {
    const router = useRouter();

    const [members, setMembers] = useState([]);
    const [statistics, setStatistics] = useState({
        total: 0,
        active: 0,
        invited: 0,
        suspended: 0,
    });

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [removingId, setRemovingId] = useState(null);

    const fetchTeamMembers = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const response = await API.get(
                "/team/organization/members"
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Unable to fetch team members"
                );
            }

            setMembers(response.data.members || []);

            setStatistics(
                response.data.statistics || {
                    total: 0,
                    active: 0,
                    invited: 0,
                    suspended: 0,
                }
            );
        } catch (error) {
            console.error("Team members error:", error);

            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Failed to load team members"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleRemoveMember = async (member) => {
        const confirmed = window.confirm(
            `Are you sure you want to remove ${member.name} from this organization?`
        );

        if (!confirmed) return;

        try {
            setRemovingId(member._id);

            const response = await API.delete(
                `/team/organization/members/${member._id}`
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Failed to remove team member"
                );
            }

            toast.success(response.data?.message || `${member.name} removed successfully`);
            setOpenMenu(null);

            // Refresh the list and statistics after successful removal.
            await fetchTeamMembers(false);
        } catch (error) {
            console.error("Remove team member error:", error);

            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Failed to remove team member"
            );
        } finally {
            setRemovingId(null);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const searchValue = search.toLowerCase();

            const matchesSearch =
                (member.name || "").toLowerCase().includes(searchValue) ||
                (member.email || "").toLowerCase().includes(searchValue) ||
                (member.department || "").toLowerCase().includes(searchValue) ||
                (member.jobTitle || "").toLowerCase().includes(searchValue) ||
                (member.roles || []).some((role) =>
                    role.toLowerCase().includes(searchValue)
                );

            const matchesStatus =
                activeFilter === "All" ||
                member.status?.toLowerCase() === activeFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [members, search, activeFilter]);

    const statCards = [
        {
            label: "Total members",
            value: statistics.total,
            icon: Users,
            color: "bg-indigo-50 text-indigo-600",
        },
        {
            label: "Active members",
            value: statistics.active,
            icon: UserCheck,
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            label: "Pending invitations",
            value: statistics.invited,
            icon: Clock3,
            color: "bg-amber-50 text-amber-600",
        },
        {
            label: "Suspended",
            value: statistics.suspended,
            icon: UserX,
            color: "bg-red-50 text-red-600",
        },
    ];

    return (
        <main className="min-h-screen bg-[#f6f7fc] px-5 py-7 md:px-8">
            {/* PAGE HEADER */}
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                        <span>Workspace</span>
                        <span>/</span>
                        <span className="text-indigo-600">Team</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-[#171b3b] md:text-3xl">
                        Team Members
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your organization members, roles and access.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchTeamMembers(false)}
                        disabled={refreshing}
                        className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() => router.push("/invite-team")}
                        className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                    >
                        <UserPlus size={17} />
                        Invite members
                    </button>
                </div>
            </div>

            {/* STATISTICS */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {card.label}
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-[#171b3b]">
                                        {loading ? "—" : card.value}
                                    </h2>
                                </div>

                                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${card.color}`}>
                                    <Icon size={22} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* TEAM TABLE */}
            <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* TABLE HEADER */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-[#171b3b]">
                            All members
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View and manage people in your organization.
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, role..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                        />
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                activeFilter === filter
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {filter}
                            {filter === "All" && (
                                <span className="ml-2">
                                    {statistics.total}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* TABLE */}
                <div className="overflow-visible">
                    <table className="w-full min-w-[850px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-16 text-center text-sm text-slate-500"
                                    >
                                        <RefreshCw
                                            size={22}
                                            className="mx-auto mb-3 animate-spin text-indigo-500"
                                        />
                                        Loading team members...
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
                                                <Users size={25} />
                                            </div>

                                            <h3 className="font-semibold text-slate-800">
                                                {members.length === 0
                                                    ? "No team members yet"
                                                    : "No members found"}
                                            </h3>

                                            <p className="mt-2 max-w-sm text-sm text-slate-500">
                                                {members.length === 0
                                                    ? "Invite people to your organization to start collaborating."
                                                    : "Try changing your search or status filter."}
                                            </p>

                                            {members.length === 0 && (
                                                <button
                                                    onClick={() => router.push("/invite-team")}
                                                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    Invite your first member
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr
                                        key={member._id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        {/* MEMBER */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="h-11 w-11 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                                                        {getInitials(member.name)}
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {member.name}
                                                    </p>

                                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Mail size={12} />
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* DEPARTMENT */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <BriefcaseBusiness
                                                    size={15}
                                                    className="text-slate-400"
                                                />
                                                {member.department || "General"}
                                            </div>
                                        </td>

                                        {/* ROLE */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {member.roles?.length > 0 ? (
                                                    member.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700"
                                                        >
                                                            <ShieldCheck size={13} />
                                                            {role}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        No role assigned
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* JOINED DATE */}
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDate(member.joinedAt)}
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                                                    statusStyles[member.status] ||
                                                    "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                                                {member.status}
                                            </span>
                                        </td>

                                        {/* ACTION */}
                                        <td className="relative px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                aria-label={`Actions for ${member.name}`}
                                                aria-expanded={openMenu === member._id}
                                                onClick={() =>
                                                    setOpenMenu((current) =>
                                                        current === member._id ? null : member._id
                                                    )
                                                }
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <MoreHorizontal size={19} />
                                            </button>

                                            {openMenu === member._id && (
                                                <>
                                                    <button
                                                        type="button"
                                                        aria-label="Close member actions"
                                                        onClick={() => setOpenMenu(null)}
                                                        className="fixed inset-0 z-40 cursor-default"
                                                    />

                                                    <div className="absolute right-10 top-14 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-xl">
                                                        <button
                                                            type="button"
                                                            disabled={removingId === member._id}
                                                            onClick={() => handleRemoveMember(member)}
                                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <UserX size={17} />
                                                            {removingId === member._id
                                                                ? "Removing..."
                                                                : "Remove team member"}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}
                {!loading && filteredMembers.length > 0 && (
                    <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center">
                        <p>
                            Showing {filteredMembers.length} of {members.length} members
                        </p>

                        <p className="text-xs">
                            Organization team
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
