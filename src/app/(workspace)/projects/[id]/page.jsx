"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/services/api";
import { toast } from "react-toastify";

import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Files,
  ChartNoAxesColumn,
  X,
  LoaderCircle,
  Trash2,
  UserRound,
  GripVertical,
} from "lucide-react";

// Task statuses supported by the backend
const columns = [
  { id: "Todo", label: "To Do", color: "bg-indigo-500" },
  { id: "In Progress", label: "In Progress", color: "bg-orange-500" },
  { id: "Review", label: "Review", color: "bg-purple-500" },
  { id: "Completed", label: "Done", color: "bg-emerald-500" },
];

const priorityStyles = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-600",
};

// Extract tasks from different possible API response structures
const getTaskList = (response) => {
  const data = response?.data;

  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.data?.tasks)) return data.data.tasks;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
};

// Extract project from API response
const getProjectData = (response) => {
  const data = response?.data;

  return (
    data?.project ||
    data?.data?.project ||
    data?.data ||
    data
  );
};

function ProjectBoardContent() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Board");
  const [selectedPriority, setSelectedPriority] = useState("All");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeColumn, setActiveColumn] = useState("Todo");

  const [draggedTask, setDraggedTask] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });

  // Get logged-in user's ID
 useEffect(() => {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (!storedUser) {
      toast.error("User information not found. Please log in again.");
      return;
    }

    const user = JSON.parse(storedUser);

    const userId = user._id || user.id || user.userId;

    if (userId) {
      setCurrentUserId(userId);
    } else {
      toast.error("User ID is missing from your account.");
    }
  } catch (error) {
    console.error("Unable to read current user:", error);
  }
}, []);

  // Load project and its tasks
  const loadBoard = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);

    try {
      const [projectResponse, taskResponse] = await Promise.all([
        API.get(`/projects/${projectId}`),
        API.get(`/task/project/${projectId}`),
      ]);

      setProject(getProjectData(projectResponse));
      setTasks(getTaskList(taskResponse));
    } catch (error) {
      console.error("PROJECT BOARD API ERROR:", error.message);
      console.error("STATUS:", error.response?.status);
      console.error("RESPONSE DATA:", error.response?.data);
      console.error("REQUEST URL:", error.config?.url);
      console.error("REQUEST HEADERS:", error.config?.headers);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load project."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Open create task modal
  const openCreateModal = (status = "Todo") => {
    setActiveColumn(status);

    setForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
    });

    setShowCreateModal(true);
  };

  // Create task
  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    if (!form.dueDate) {
      toast.error("Please select a due date.");
      return;
    }

    if (!currentUserId) {
      toast.error(
        "User ID not found. Please check the user object stored in localStorage."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        project: projectId,
        assignedTo: currentUserId,
        status: activeColumn,
        priority: form.priority,
        dueDate: form.dueDate,
      };

      const response = await API.post("/task/create", payload);

      const newTask =
        response.data?.task ||
        response.data?.data?.task;

      if (newTask) {
        setTasks((previous) => [newTask, ...previous]);
      } else {
        await loadBoard();
      }

      toast.success("Task created successfully!");
      setShowCreateModal(false);
    } catch (error) {
      console.error(
        "Task creation error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to create task."
      );
    } finally {
      setSaving(false);
    }
  };

  // Update task status using drag and drop
  const handleDrop = async (newStatus) => {
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const taskId = draggedTask._id;
    const previousTasks = [...tasks];

    // Optimistic UI update
    setTasks((previous) =>
      previous.map((task) =>
        task._id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );

    setDraggedTask(null);

    try {
      await API.patch(`/task/${taskId}/status`, {
        status: newStatus,
      });

      toast.success("Task status updated.");
    } catch (error) {
      setTasks(previousTasks);

      console.error(
        "Status update error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to update task status."
      );
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/task/${taskId}`);

      setTasks((previous) =>
        previous.filter((task) => task._id !== taskId)
      );

      toast.success("Task deleted successfully.");
    } catch (error) {
      console.error(
        "Delete task error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to delete task."
      );
    }
  };

  // Search and priority filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      selectedPriority === "All" ||
      task.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  // Format dates
  const formatDate = (date) => {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-indigo-600"
          size={35}
        />
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">
          Project could not be loaded
        </h2>

        <button
          onClick={() => router.push("/projects")}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-white"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PROJECT HEADER */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </button>

        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{
                backgroundColor: project.color || "#5145EC",
              }}
            >
              {project.name?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#171B49]">
                  {project.name}
                </h1>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                  {project.status || "Active"}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Due {formatDate(project.dueDate)}
                {" · "}
                {tasks.length} tasks
              </p>
            </div>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5145EC] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-6 border-b border-slate-200">
        {[
          { name: "Board", icon: LayoutGrid },
          { name: "List", icon: List },
          { name: "Calendar", icon: Calendar },
          { name: "Files", icon: Files },
          { name: "Overview", icon: ChartNoAxesColumn },
        ].map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
                activeTab === tab.name
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Icon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* BOARD FILTERS */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks..."
              className="h-9 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(event) =>
              setSelectedPriority(event.target.value)
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
          >
            <option value="All">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      </div>

      {/* KANBAN BOARD */}
      {activeTab === "Board" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.id
            );

            return (
              <div
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.id)}
                className="flex min-h-[400px] flex-col rounded-xl bg-[#EAECF6] p-3"
              >
                {/* COLUMN HEADER */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${column.color}`}
                    />

                    <h3 className="text-sm font-bold text-[#171B49]">
                      {column.label}
                    </h3>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => openCreateModal(column.id)}
                    className="rounded-lg p-1 text-slate-500 transition hover:bg-white hover:text-indigo-600"
                    title="Add task"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {/* TASK CARDS */}
                <div className="flex flex-1 flex-col gap-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => setDraggedTask(null)}
                      className="group cursor-grab rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                    >
                      {/* LABELS */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {(task.tags || [])
                            .slice(0, 2)
                            .map((tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="rounded-full bg-purple-50 px-2 py-1 text-[9px] font-medium text-purple-600"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                          <GripVertical
                            size={15}
                            className="text-slate-300"
                          />

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteTask(task._id);
                            }}
                            className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* TASK TITLE */}
                      <h4 className="text-sm font-bold leading-5 text-[#171B49]">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                          {task.description}
                        </p>
                      )}

                      {/* PRIORITY */}
                      <div className="mt-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                            priorityStyles[task.priority] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.priority || "Medium"}
                        </span>
                      </div>

                      {/* TASK FOOTER */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <CalendarDays size={12} />
                          {formatDate(task.dueDate)}
                        </div>

                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700"
                          title={task.assignedTo?.name || "Unassigned"}
                        >
                          {task.assignedTo?.name
                            ?.charAt(0)
                            ?.toUpperCase() || (
                            <UserRound size={13} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* EMPTY COLUMN */}
                  {columnTasks.length === 0 && (
                    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-center">
                      <p className="text-xs text-slate-400">
                        No tasks here
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Drag tasks into this column
                      </p>
                    </div>
                  )}

                  {/* ADD TASK */}
                  <button
                    onClick={() => openCreateModal(column.id)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-500 transition hover:bg-white hover:text-indigo-600"
                  >
                    <Plus size={14} />
                    Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OTHER TABS */}
      {activeTab !== "Board" && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <LayoutGrid
            size={35}
            className="text-indigo-300"
          />

          <h3 className="mt-4 text-base font-bold text-slate-700">
            {activeTab} view
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            We'll build this view next.
          </p>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171B49]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#171B49]">
                  Create New Task
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Add a task to {project.name}
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {/* TASK FORM */}
            <form
              onSubmit={handleCreateTask}
              className="space-y-5 p-6"
            >
              {/* TITLE */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Task title *
                </label>

                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter task title"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe this task..."
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* PRIORITY AND STATUS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={activeColumn}
                    onChange={(event) =>
                      setActiveColumn(event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                  >
                    {columns.map((column) => (
                      <option
                        key={column.id}
                        value={column.id}
                      >
                        {column.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DUE DATE */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Due date *
                </label>

                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      dueDate: event.target.value,
                    })
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
                This task will initially be assigned to your logged-in account.
              </div>

              {/* MODAL BUTTONS */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#5145EC] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {saving ? "Creating..." : "Create Task"}

                  {!saving && <Plus size={15} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Suspense wrapper for the dynamic project route
export default function ProjectBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[65vh] items-center justify-center">
          <LoaderCircle
            className="animate-spin text-indigo-600"
            size={35}
          />
        </div>
      }
    >
      <ProjectBoardContent />
    </Suspense>
  );
}