
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/services/api";
import { toast } from "react-toastify";

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  RefreshCw,
  Users,
  ListTodo,
  TrendingUp,
  CircleAlert,
  LoaderCircle,
  UserRound,
  CalendarClock,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const STATUS_COLORS = {
  Todo: "#94A3B8",
  "In Progress": "#6366F1",
  Review: "#F59E0B",
  Completed: "#10B981",
};

const PRIORITY_COLORS = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#EF4444",
};

const formatDate = (date) => {
  if (!date) return "No deadline";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const formatStatus = (status = "") => {
  return status || "Unknown";
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackground,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-[#171B49]">
            {value}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBackground}`}
        >
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, subtitle, children, action }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#171B49]">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex h-[240px] flex-col items-center justify-center text-center">
    <Activity size={30} className="text-slate-300" />

    <p className="mt-3 text-xs text-slate-400">
      {message}
    </p>
  </div>
);

export default function ProjectOverview({ projectId }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.get(
        `/analytics/project/${projectId}/overview`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load project overview."
        );
      }

      setOverview(response.data.data);
    } catch (err) {
      console.error(
        "Project overview error:",
        err.response?.data || err
      );

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load project overview.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const statistics = overview?.statistics || {};
  const priority = overview?.priority || {};

  const tasks = overview?.recentTasks || [];
  const teamMembers = overview?.teamMembers || [];
  const upcomingDeadlines = overview?.upcomingDeadlines || [];

  // Task status chart
  const statusData = useMemo(
    () => [
      {
        name: "Todo",
        value: statistics.todoTasks || 0,
        color: STATUS_COLORS.Todo,
      },
      {
        name: "In Progress",
        value: statistics.inProgressTasks || 0,
        color: STATUS_COLORS["In Progress"],
      },
      {
        name: "Review",
        value: statistics.reviewTasks || 0,
        color: STATUS_COLORS.Review,
      },
      {
        name: "Completed",
        value: statistics.completedTasks || 0,
        color: STATUS_COLORS.Completed,
      },
    ],
    [statistics]
  );

  // Priority chart
  const priorityData = useMemo(
    () => [
      {
        name: "Low",
        tasks: priority.low || 0,
        fill: PRIORITY_COLORS.Low,
      },
      {
        name: "Medium",
        tasks: priority.medium || 0,
        fill: PRIORITY_COLORS.Medium,
      },
      {
        name: "High",
        tasks: priority.high || 0,
        fill: PRIORITY_COLORS.High,
      },
    ],
    [priority]
  );

  const totalTasks = statistics.totalTasks || 0;
  const completedTasks = statistics.completedTasks || 0;
  const progress = statistics.completionPercentage || 0;

  const pendingTasks =
    totalTasks - completedTasks;

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-indigo-600"
          />

          <p className="mt-3 text-xs text-slate-500">
            Loading project overview...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
        <AlertCircle size={38} className="text-red-400" />

        <h3 className="mt-4 text-base font-bold text-[#171B49]">
          Unable to load overview
        </h3>

        <p className="mt-2 max-w-sm text-xs text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={loadOverview}
          className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-[#171B49]">
            Project overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Track project performance, tasks and team activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh overview
        </button>
      </div>

      {/* PROJECT INFORMATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{
                backgroundColor: overview?.project?.color || "#6366F1",
              }}
            >
              {overview?.project?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <h3 className="text-base font-bold text-[#171B49]">
                {overview?.project?.name || "Project"}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {overview?.project?.category || "Project workspace"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-600">
              {overview?.project?.status || "Active"}
            </span>

            {overview?.project?.dueDate && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={14} />
                Due {formatDate(overview.project.dueDate)}
              </span>
            )}
          </div>

        </div>

        {overview?.project?.description && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">
            {overview.project.description}
          </p>
        )}
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total tasks"
          value={totalTasks}
          subtitle="Tasks in this project"
          icon={ListTodo}
          iconColor="text-indigo-600"
          iconBackground="bg-indigo-50"
        />

        <StatCard
          title="Completed tasks"
          value={completedTasks}
          subtitle={`${progress}% completion rate`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBackground="bg-emerald-50"
        />

        <StatCard
          title="Pending tasks"
          value={pendingTasks}
          subtitle="Tasks not completed"
          icon={Clock3}
          iconColor="text-amber-600"
          iconBackground="bg-amber-50"
        />

        <StatCard
          title="Overdue tasks"
          value={overview?.overdueTasks || 0}
          subtitle="Past their due date"
          icon={CircleAlert}
          iconColor="text-red-600"
          iconBackground="bg-red-50"
        />

      </div>

      {/* PROGRESS AND STATUS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* PROJECT PROGRESS */}
        <SectionCard
          title="Project progress"
          subtitle="Overall task completion"
        >
          <div className="flex flex-col items-center justify-center gap-6 py-4 sm:flex-row">

            <div
              className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#5145EC ${progress}%, #E8EAF2 ${progress}% 100%)`,
              }}
            >
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold text-[#171B49]">
                  {progress}%
                </span>

                <span className="mt-1 text-[11px] text-slate-400">
                  Completed
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">
                    Completed tasks
                  </span>

                  <span className="font-bold text-emerald-600">
                    {completedTasks}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400">
                    Total tasks
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#171B49]">
                    {totalTasks}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400">
                    Remaining
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#171B49]">
                    {pendingTasks}
                  </p>
                </div>

              </div>

            </div>

          </div>
        </SectionCard>

        {/* TASK STATUS */}
        <SectionCard
          title="Task status"
          subtitle="Distribution of tasks by status"
        >
          {totalTasks > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      value,
                      "Tasks",
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No tasks available for this project." />
          )}
        </SectionCard>

      </div>

      {/* PRIORITY AND TEAM */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* PRIORITY */}
        <SectionCard
          title="Task priority"
          subtitle="Tasks grouped by priority"
        >
          {totalTasks > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: "#F8FAFC",
                    }}
                  />

                  <Bar
                    dataKey="tasks"
                    name="Tasks"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  >
                    {priorityData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No priority data available." />
          )}
        </SectionCard>

        {/* TEAM MEMBERS */}
        <SectionCard
          title="Project team"
          subtitle={`${teamMembers.length} project members`}
          action={
            <Users size={18} className="text-indigo-500" />
          }
        >
          {teamMembers.length > 0 ? (
            <div className="max-h-[260px] space-y-3 overflow-y-auto">

              {teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">

                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name || "Team member"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                        {getInitials(member.name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#171B49]">
                        {member.name || "Unknown member"}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {member.email || "No email"}
                      </p>
                    </div>

                  </div>

                  {member._id ===
                  (overview?.project?.owner?._id ||
                    overview?.project?.owner) ? (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                      Owner
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                      Member
                    </span>
                  )}

                </div>
              ))}

            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center">
              <UserRound size={32} className="text-slate-300" />

              <p className="mt-3 text-xs text-slate-400">
                No team members available.
              </p>
            </div>
          )}
        </SectionCard>

      </div>

      {/* DEADLINES AND RECENT TASKS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* UPCOMING DEADLINES */}
        <SectionCard
          title="Upcoming deadlines"
          subtitle="Your next five pending task deadlines"
          action={
            <CalendarClock
              size={18}
              className="text-indigo-500"
            />
          }
        >
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">

              {upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <CalendarDays size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#171B49]">
                        {task.title}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {task.assignedTo?.name
                          ? `Assigned to ${task.assignedTo.name}`
                          : "Unassigned"}
                      </p>
                    </div>

                  </div>

                  <span className="shrink-0 text-[10px] font-semibold text-amber-600">
                    {formatDate(task.dueDate)}
                  </span>

                </div>
              ))}

            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center">
              <CheckCircle2
                size={32}
                className="text-emerald-400"
              />

              <p className="mt-3 text-xs text-slate-400">
                No upcoming deadlines.
              </p>
            </div>
          )}
        </SectionCard>

        {/* RECENT TASKS */}
        <SectionCard
          title="Recent tasks"
          subtitle="Latest tasks added to this project"
        >
          {tasks.length > 0 ? (
            <div className="space-y-3">

              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FolderKanban size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#171B49]">
                        {task.title}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {task.assignedTo?.name ||
                          "Unassigned"}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      task.status === "Completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : task.status === "In Progress"
                          ? "bg-indigo-50 text-indigo-600"
                          : task.status === "Review"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {formatStatus(task.status)}
                  </span>

                </div>
              ))}

            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center">
              <ListTodo size={32} className="text-slate-300" />

              <p className="mt-3 text-xs text-slate-400">
                No recent tasks available.
              </p>
            </div>
          )}
        </SectionCard>

      </div>

    </section>
  );
}
