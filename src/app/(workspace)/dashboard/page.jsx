
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import CreateProjectModal from "@/components/projects/CreateProjectModal";
import API from "@/services/api";

import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Users,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--color-chart-1)",
  },
  remaining: {
    label: "Remaining",
    color: "var(--color-chart-2)",
  },
};

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? {};

const getArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (date) => {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const getProgress = (project) => {
  if (typeof project?.progress === "number") return project.progress;

  if (typeof project?.completionPercentage === "number") {
    return project.completionPercentage;
  }

  const total = project?.totalTasks ?? project?.taskCount ?? 0;
  const completed = project?.completedTasks ?? 0;

  return total ? Math.round((completed / total) * 100) : 0;
};

const getStatusStyle = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized.includes("progress")) return "bg-blue-50 text-blue-700";
  if (normalized.includes("review")) return "bg-purple-50 text-purple-700";
  if (normalized.includes("complete")) return "bg-emerald-50 text-emerald-700";

  return "bg-gray-100 text-gray-600";
};

const getPriorityStyle = (priority = "") => {
  const normalized = priority.toLowerCase();

  if (normalized === "high") return "bg-red-50 text-red-600";
  if (normalized === "medium") return "bg-amber-50 text-amber-700";

  return "bg-green-50 text-green-700";
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#171B49]">
            {value}
          </h2>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon size={21} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-[#171B49]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#5145EC] transition hover:text-[#392dcc]"
        >
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 text-center">
      <FolderKanban size={27} className="mb-2 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Dashboard state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create project modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [dashboard, setDashboard] = useState({
    overview: {},
    projects: [],
    tasks: [],
    overdueTasks: [],
    projectProgress: [],
    productivity: {},
    taskStatistics: {},
  });

  // User and organization
  const [userName, setUserName] = useState("there");
  const [organizationName, setOrganizationName] = useState("Your workspace");
  const [greeting, setGreeting] = useState("Good morning");
  const [today, setToday] = useState("");

  // Load dashboard APIs
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        API.get("/dashboard/overview"),
        API.get("/dashboard/recent-projects"),
        API.get("/dashboard/my-tasks"),
        API.get("/dashboard/overdue-tasks"),
        API.get("/dashboard/project-progress"),
        API.get("/dashboard/productivity"),
        API.get("/dashboard/task-statistics"),
      ]);

      const readResult = (index) => {
        if (results[index].status !== "fulfilled") return null;
        return getResponseData(results[index].value);
      };

      const overview = readResult(0);
      const recentProjects = readResult(1);
      const myTasks = readResult(2);
      const overdueTasks = readResult(3);
      const projectProgress = readResult(4);
      const productivity = readResult(5);
      const taskStatistics = readResult(6);

      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      setDashboard({
        overview: overview ?? {},
        projects: getArray(recentProjects?.data ?? recentProjects),
        tasks: getArray(myTasks?.data ?? myTasks),
        overdueTasks: getArray(overdueTasks?.data ?? overdueTasks),
        projectProgress: getArray(
          projectProgress?.data ?? projectProgress
        ),
        productivity: productivity ?? {},
        taskStatistics: taskStatistics ?? {},
      });

      if (failedCount === results.length) {
        setError(
          "Unable to load dashboard data. Please check your API connection."
        );
      } else if (failedCount > 0) {
        setError("Some dashboard information could not be loaded.");
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load dashboard information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load user details and greeting
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      setUserName(
        storedUser.name ||
          localStorage.getItem("userName") ||
          localStorage.getItem("name") ||
          "there"
      );

      setOrganizationName(
        localStorage.getItem("organizationName") || "Your workspace"
      );
    } catch {
      setUserName(localStorage.getItem("userName") || "there");
    }

    const hour = new Date().getHours();

    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setToday(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  // CREATE PROJECT API INTEGRATION
  const handleCreateProject = async (projectData) => {
    try {
      setIsCreatingProject(true);

      const response = await API.post("/projects/create", projectData);

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || "Project creation failed."
        );
      }

      toast.success(
        response.data?.message || "Project created successfully!"
      );

      setIsCreateModalOpen(false);

      await loadDashboard();
    } catch (err) {
  const errorDetails = {
    message: err.message,
    status: err.response?.status,
    responseData: err.response?.data,
    requestURL: err.config?.url,
    method: err.config?.method,
  };

  console.log("CREATE PROJECT ERROR DETAILS:", errorDetails);

  toast.error(
    err.response?.data?.message ||
    err.message ||
    "Project creation failed."
  );
}finally {
      setIsCreatingProject(false);
    }
  };

  // Dashboard data
  const projects = dashboard.overview?.projects ?? {};
  const tasksOverview = dashboard.overview?.tasks ?? {};
  const productivityOverview = dashboard.overview?.productivity ?? {};

  const projectProgressMap = useMemo(() => {
    const map = {};

    dashboard.projectProgress.forEach((item) => {
      const projectId =
        item?.project?._id ?? item?.projectId ?? item?._id;

      if (projectId) map[String(projectId)] = item;
    });

    return map;
  }, [dashboard.projectProgress]);

  const recentProjects = useMemo(
    () =>
      dashboard.projects.map((project) => {
        const progressData = projectProgressMap[String(project?._id)];

        return {
          ...project,
          progress: getProgress({
            ...project,
            ...progressData,
          }),
        };
      }),
    [dashboard.projects, projectProgressMap]
  );

  const dueThisWeek = dashboard.tasks.filter((task) => {
    if (!task.dueDate || task.status === "Completed") return false;

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const nextWeek = new Date();

    nextWeek.setDate(now.getDate() + 7);

    return dueDate >= now && dueDate <= nextWeek;
  }).length;

  const overdueCount =
    dashboard.overdueTasks.length ||
    Number(tasksOverview.overdue ?? 0);

  const completionRate = Number(
    productivityOverview.completionRate ??
      dashboard.productivity?.completionRate ??
      0
  );

  const chartData = useMemo(() => {
    const total = Number(
      dashboard.productivity?.totalTasks ??
        dashboard.productivity?.total ??
        tasksOverview.total ??
        0
    );

    const completed = Number(
      dashboard.productivity?.completedTasks ??
        dashboard.productivity?.completed ??
        tasksOverview.completed ??
        0
    );

    return [
      {
        name: "Tasks",
        completed,
        remaining: Math.max(total - completed, 0),
      },
    ];
  }, [dashboard.productivity, tasksOverview]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">

      {/* Dashboard heading */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{today}</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B49] sm:text-3xl">
            {greeting}, {userName}!
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here's what's happening in {organizationName} today.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/invite-team")}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#171B49] shadow-sm transition hover:bg-gray-50"
          >
            <Users size={17} />
            Invite Team
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5145EC] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4035d5]"
          >
            <Plus size={18} />
            Create Project
          </button>
        </div>
      </div>

      {/* API error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} />
            {error}
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="flex shrink-0 items-center gap-1 font-semibold"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={loading ? "—" : projects.total ?? 0}
          subtitle="Projects in your workspace"
          icon={FolderKanban}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Total Tasks"
          value={loading ? "—" : tasksOverview.total ?? 0}
          subtitle={`${dueThisWeek} due in the next 7 days`}
          icon={ListTodo}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Completed Tasks"
          value={loading ? "—" : tasksOverview.completed ?? 0}
          subtitle={`${completionRate}% overall completion`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Overdue Tasks"
          value={loading ? "—" : overdueCount}
          subtitle="Tasks that need attention"
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Recent Projects */}
      <section>
        <SectionHeader
          title="Recent Projects"
          action="View all"
          onAction={() => router.push("/projects")}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <EmptyState message="No projects found. Create your first project to get started." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentProjects.slice(0, 3).map((project) => {
              const members = project.teamMembers || project.members || [];

              return (
                <div
                key={project._id}
                onClick={() => router.push(`/projects/${project._id}`)}
                className="cursor-pointer rounded-2xl border border-[#E5E7F0] bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                      style={{
                        backgroundColor: `${project.color || "#5145EC"}25`,
                        color: project.color || "#5145EC",
                      }}
                    >
                      {project.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>

                    <span className="rounded-full bg-[#E9EAF2] px-3 py-1 text-xs font-medium text-[#555B78]">
                      {project.status || "Active"}
                    </span>
                  </div>

                  <h3 className="mt-3 truncate text-base font-bold text-[#171B49]">
                    {project.name}
                  </h3>

                  <p className="mt-0.5 text-sm text-[#606789]">
                    {project.completedTasks ?? 0}/
                    {project.totalTasks ?? 0} tasks
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E6E7F0]">
                      <div
                        className="h-full rounded-full bg-[#5145EC]"
                        style={{
                          width: `${Math.min(project.progress, 100)}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-bold text-[#171B49]">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center">
                      {members.slice(0, 3).map((member, index) => (
                        <div
                          key={member._id || index}
                          className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-bold text-indigo-700 first:ml-0"
                          title={member.name || "Team member"}
                        >
                          {(member.name || "U").charAt(0).toUpperCase()}
                        </div>
                      ))}

                      {members.length > 3 && (
                        <span className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#E8E9F1] text-[10px] font-bold text-[#555B78]">
                          +{members.length - 3}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 whitespace-nowrap text-xs text-[#606789]">
                      <CalendarDays size={13} />
                      Due {formatDate(project.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Tasks and Productivity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">

        {/* My Tasks */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            title="My Tasks"
            action="View all"
            onAction={() => router.push("/tasks")}
          />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : dashboard.tasks.length === 0 ? (
            <EmptyState message="You don't have any assigned tasks right now." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400">
                    <th className="px-3 py-3">Task</th>
                    <th className="px-3 py-3">Project</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Due date</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.tasks.slice(0, 6).map((task) => (
                    <tr
                      key={task._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold text-[#171B49]">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="mt-1 max-w-[200px] truncate text-xs text-gray-400">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm text-gray-500">
                        {task.project?.name || "—"}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority || "Low"}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            task.status
                          )}`}
                        >
                          {task.status || "Todo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Productivity */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Productivity"
            subtitle="Your task completion overview"
          />

          <div className="mt-3">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-[#171B49]">
                  {loading ? "—" : `${completionRate}%`}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Completion rate
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3">
                <CheckCircle2 size={22} className="text-[#5145EC]" />
              </div>
            </div>

            <ChartContainer
              config={chartConfig}
              className="h-[210px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 12, bottom: 12 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                <Bar
                  dataKey="completed"
                  stackId="tasks"
                  fill="var(--color-completed)"
                  radius={[6, 0, 0, 6]}
                  barSize={34}
                />

                <Bar
                  dataKey="remaining"
                  stackId="tasks"
                  fill="var(--color-remaining)"
                  radius={[0, 6, 6, 0]}
                  barSize={34}
                />
              </BarChart>
            </ChartContainer>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-chart-1)]" />
                Completed
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-chart-2)]" />
                Remaining
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="mt-1 text-lg font-bold text-[#171B49]">
                  {loading ? "—" : tasksOverview.completed ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">In progress</p>
                <p className="mt-1 text-lg font-bold text-[#171B49]">
                  {loading ? "—" : tasksOverview.inProgress ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={[]}
        loading={isCreatingProject}
        onCreate={handleCreateProject}
        onSaveDraft={() => {
          toast.info("Draft functionality will be added next.");
        }}
      />
    </div>
  );
}
