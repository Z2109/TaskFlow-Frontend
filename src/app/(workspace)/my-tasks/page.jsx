
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ListTodo,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const tabs = [
  "All tasks",
  "Today",
  "This week",
  "Overdue",
  "Completed",
];

const statusStyles = {
  Todo: "bg-indigo-100 text-indigo-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Review: "bg-violet-100 text-violet-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

const priorityStyles = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

const getLocalDate = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatDate = (date) => {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

const isOverdue = (task) => {
  if (!task.dueDate || task.status === "Completed") return false;

  return getLocalDate(task.dueDate) < getLocalDate(new Date());
};

const isToday = (task) => {
  return task.dueDate &&
    getLocalDate(task.dueDate) === getLocalDate(new Date());
};

const isThisWeek = (task) => {
  if (!task.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  return due >= start && due < end;
};

export default function MyTasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 6;

  // Fetch tasks assigned to the logged-in user
  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await API.get("/task/my-tasks");

      const data =
        response.data?.tasks ||
        response.data?.data?.tasks ||
        response.data?.data ||
        [];

      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("My Tasks API:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load your tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(
        (task) => task.status === "Completed"
      ).length,
      inProgress: tasks.filter(
        (task) => task.status === "In Progress"
      ).length,
      overdue: tasks.filter(isOverdue).length,
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (activeTab === "Today") {
      result = result.filter(isToday);
    }

    if (activeTab === "This week") {
      result = result.filter(isThisWeek);
    }

    if (activeTab === "Overdue") {
      result = result.filter(isOverdue);
    }

    if (activeTab === "Completed") {
      result = result.filter(
        (task) => task.status === "Completed"
      );
    }

    if (selectedPriority !== "All") {
      result = result.filter(
        (task) => task.priority === selectedPriority
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((task) => {
        const projectName =
          typeof task.project === "object"
            ? task.project?.name
            : "";

        return (
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          projectName?.toLowerCase().includes(query)
        );
      });
    }

    result.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        return (
          (priorityOrder[a.priority] || 4) -
          (priorityOrder[b.priority] || 4)
        );
      }

      if (sortBy === "createdAt") {
        return new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0);
      }

      return (
        new Date(a.dueDate || "9999-12-31") -
        new Date(b.dueDate || "9999-12-31")
      );
    });

    return result;
  }, [tasks, activeTab, selectedPriority, search, sortBy]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / pageSize)
  );

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, selectedPriority, sortBy]);

  // Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    const previousTasks = [...tasks];

    setTasks((previous) =>
      previous.map((task) =>
        task._id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );

    try {
      await API.patch(`/task/${taskId}/status`, {
        status: newStatus,
      });

      toast.success("Task status updated");
    } catch (error) {
      setTasks(previousTasks);

      toast.error(
        error.response?.data?.message ||
        "Unable to update task status"
      );
    }
  };

  const statCards = [
    {
      title: "Total tasks",
      value: statistics.total,
      icon: ListTodo,
      color: "bg-indigo-100 text-indigo-600",
      background: "bg-indigo-100/70",
    },
    {
      title: "Completed",
      value: statistics.completed,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-600",
      background: "bg-emerald-100/70",
    },
    {
      title: "In progress",
      value: statistics.inProgress,
      icon: Clock3,
      color: "bg-amber-100 text-amber-600",
      background: "bg-amber-100/70",
    },
    {
      title: "Overdue",
      value: statistics.overdue,
      icon: AlertCircle,
      color: "bg-red-100 text-red-600",
      background: "bg-red-100/70",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-[#f5f6fc] p-4 sm:p-6 lg:p-8">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171B49]">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track your personal tasks.
          </p>
        </div>

        <button
          onClick={() => {
  const firstTask = tasks[0];

  const projectId =
    typeof firstTask?.project === "object"
      ? firstTask.project?._id
      : firstTask?.project;

  if (!projectId) {
    toast.warning("Open a project to select where to create the task.");
    return;
  }

  router.push(`/projects/${projectId}?createTask=true`);
}}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={17} />
          Add task
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`flex items-center justify-between rounded-xl p-5 ${stat.background}`}
            >
              <div>
                <h3 className="text-3xl font-bold text-[#171B49]">
                  {stat.value}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {stat.title}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER TOOLBAR */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center">

          {/* TABS */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-indigo-500 sm:w-48"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Filter size={14} />
                Filter
              </button>

              {showFilters && (
                <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Priority
                  </label>

                  <select
                    value={selectedPriority}
                    onChange={(e) =>
                      setSelectedPriority(e.target.value)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none"
                  >
                    <option value="All">All priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none"
              >
                <option value="dueDate">Due date</option>
                <option value="priority">Priority</option>
                <option value="createdAt">Recently added</option>
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* TASK TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold text-slate-500">
                <th className="w-12 px-5 py-4"></th>
                <th className="px-4 py-4">Task</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Priority</th>
                <th className="px-4 py-4">Due date</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="mt-3 text-sm text-slate-400">
                      Loading your tasks...
                    </p>
                  </td>
                </tr>
              ) : paginatedTasks.length > 0 ? (
                paginatedTasks.map((task) => {
                  const project =
                    typeof task.project === "object"
                      ? task.project
                      : null;

                  return (
                    <tr
                      key={task._id}
                      onClick={() =>
                        router.push(`/tasks/${task._id}`)
                      }
                      className="cursor-pointer transition hover:bg-indigo-50/40"
                    >
                      {/* COMPLETE CHECKBOX */}
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            if (task.status === "Completed") {
                              handleStatusChange(task._id, "Todo");
                            } else {
                              handleStatusChange(task._id, "Completed");
                            }
                          }}
                          title="Toggle task completion"
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-white transition hover:border-indigo-500"
                        >
                          {task.status === "Completed" && (
                            <CheckCircle2
                              size={18}
                              className="fill-indigo-600 text-white"
                            />
                          )}
                        </button>
                      </td>

                      {/* TASK */}
                      <td className="px-4 py-4">
                        <p className={`text-sm font-semibold ${
                          task.status === "Completed"
                            ? "text-slate-400 line-through"
                            : "text-[#171B49]"
                        }`}>
                          {task.title}
                        </p>

                        <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                          {task.description || "No description"}
                        </p>
                      </td>

                      {/* PROJECT */}
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-500">
                          {project?.name || "—"}
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                          priorityStyles[task.priority] ||
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {task.priority || "Medium"}
                        </span>
                      </td>

                      {/* DUE DATE */}
                      <td className="px-4 py-4">
                        <span className={`text-xs ${
                          isOverdue(task)
                            ? "font-semibold text-red-600"
                            : "text-slate-500"
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4">
                        <select
                          value={task.status || "Todo"}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(
                              task._id,
                              e.target.value
                            )
                          }
                          className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${
                            statusStyles[task.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <option value="Todo">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <ListTodo
                      size={38}
                      className="mx-auto text-indigo-200"
                    />

                    <h3 className="mt-3 text-sm font-semibold text-slate-700">
                      No tasks found
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your filters or create a new task.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && (
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Showing{" "}
              {filteredTasks.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {" "}to{" "}
              {Math.min(currentPage * pageSize, filteredTasks.length)}
              {" "}of {filteredTasks.length} tasks
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                    currentPage === page
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
