"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const statusStyles = {
  Todo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  Review: "bg-violet-100 text-violet-700 border-violet-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusDotStyles = {
  Todo: "bg-indigo-500",
  "In Progress": "bg-amber-500",
  Review: "bg-violet-500",
  Completed: "bg-emerald-500",
};

const getTasksFromResponse = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.data?.tasks)) return data.data.tasks;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

// Use local calendar dates so tasks do not shift to the previous day because of UTC.
const toDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonth = (date) =>
  date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const formatShortDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(`${toDateKey(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  // Use a deterministic initial date during prerendering. Set the real
  // current month after the component mounts in the browser.
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2000, 0, 1));
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setTodayKey(toDateKey(today));
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get("/task/my-tasks");
      setTasks(getTasksFromResponse(response));
    } catch (error) {
      console.error("Calendar tasks API error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Unable to load calendar tasks."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(year, month, index - firstDayOffset + 1);
      return {
        date,
        dateKey: toDateKey(date),
        currentMonth: date.getMonth() === month,
      };
    });
  }, [currentMonth]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) =>
      selectedStatus === "All" ? true : task.status === selectedStatus
    );
  }, [tasks, selectedStatus]);

  const tasksByDate = useMemo(() => {
    const grouped = {};
    visibleTasks.forEach((task) => {
      const key = toDateKey(task.dueDate);
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => {
        const priority = { High: 1, Medium: 2, Low: 3 };
        return (priority[a.priority] || 4) - (priority[b.priority] || 4);
      });
    });
    return grouped;
  }, [visibleTasks]);

  const monthTasks = useMemo(() => {
    const prefix = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}`;
    return visibleTasks.filter((task) => toDateKey(task.dueDate).startsWith(prefix));
  }, [visibleTasks, currentMonth]);

  const todayCount = visibleTasks.filter(
    (task) => toDateKey(task.dueDate) === todayKey
  ).length;
  const overdueCount = visibleTasks.filter((task) => {
    const key = toDateKey(task.dueDate);
    return key && key < todayKey && task.status !== "Completed";
  }).length;

  const changeMonth = (amount) => {
    setCurrentMonth(
      (previous) => new Date(previous.getFullYear(), previous.getMonth() + amount, 1)
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#f5f6fc] p-4 sm:p-6 lg:p-8">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171B49]">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your tasks and upcoming deadlines in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTasks}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <div>
            <p className="text-sm text-slate-600">Tasks this month</p>
            <p className="mt-1 text-3xl font-bold text-[#171B49]">{monthTasks.length}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <CalendarDays size={22} />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-5">
          <div>
            <p className="text-sm text-slate-600">Due today</p>
            <p className="mt-1 text-3xl font-bold text-[#171B49]">{todayCount}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Clock3 size={22} />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-5">
          <div>
            <p className="text-sm text-slate-600">Overdue tasks</p>
            <p className="mt-1 text-3xl font-bold text-[#171B49]">{overdueCount}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <ListTodo size={22} />
          </span>
        </div>
      </div>

      {/* CALENDAR PANEL */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="min-w-[175px] text-center text-lg font-bold text-[#171B49]">
              {formatMonth(currentMonth)}
            </h2>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
              className="ml-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
            >
              Today
            </button>
          </div>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-indigo-400"
          >
            <option value="All">All statuses</option>
            <option value="Todo">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-slate-400">
            <LoaderCircle className="animate-spin text-indigo-600" size={24} />
            Loading calendar...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, dateKey, currentMonth: isCurrentMonth }, index) => {
              const dayTasks = tasksByDate[dateKey] || [];
              const isToday = dateKey === todayKey;

              return (
                <div
                  key={`${dateKey}-${index}`}
                  className={`min-h-[112px] border-b border-r border-slate-100 p-1.5 sm:min-h-[145px] sm:p-2 ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-medium text-slate-400">
                        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task._id}
                        type="button"
                        title={`${task.title} · ${task.status || "Todo"} · ${task.priority || "Medium"}`}
                        onClick={() => router.push(`/tasks/${task._id}`)}
                        className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-[9px] font-semibold transition hover:brightness-95 sm:text-[10px] ${
                          statusStyles[task.status] || statusStyles.Todo
                        }`}
                      >
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle opacity-70" />
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="px-1 text-[9px] font-medium text-slate-400">
                        +{dayTasks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Task status</span>
          {[
            ["Todo", "To Do"],
            ["In Progress", "In Progress"],
            ["Review", "Review"],
            ["Completed", "Completed"],
          ].map(([status, label]) => (
            <span key={status} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`h-2 w-2 rounded-full ${statusDotStyles[status]}`} />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* TASKS WITHOUT A DUE DATE */}
      {!loading && visibleTasks.filter((task) => !task.dueDate).length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#171B49]">Tasks without a due date</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleTasks.filter((task) => !task.dueDate).map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => router.push(`/tasks/${task._id}`)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                {task.title}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
