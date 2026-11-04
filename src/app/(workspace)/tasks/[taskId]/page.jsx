
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Edit,
  FileText,
  MessageCircle,
  Paperclip,
  Send,
  UserRound,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const statusOptions = ["Todo", "In Progress", "Review", "Completed"];
const priorityOptions = ["Low", "Medium", "High"];

function TaskDetailsContent() {
  const { taskId } = useParams();
  const router = useRouter();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    dueDate: "",
    estimatedHours: "",
    labels: [],
  });

  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchComments();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/task/${taskId}`);
      const taskData =
        response.data?.data?.task ||
        response.data?.task ||
        response.data?.data;

      if (!taskData) {
        toast.error("Task not found");
        return;
      }

      setTask(taskData);

      setForm({
        title: taskData.title || "",
        description: taskData.description || "",
        status: taskData.status || "Todo",
        priority: taskData.priority || "Medium",
        dueDate: taskData.dueDate
          ? new Date(taskData.dueDate).toISOString().split("T")[0]
          : "",
        estimatedHours: taskData.estimatedHours ?? "",
        labels: taskData.tags || taskData.labels || [],
      });

      setSubtasks(taskData.subtasks || taskData.checklist || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load task"
      );
    } finally {
      setLoading(false);
    }
  };
const fetchComments = async () => {
  try {
    const response = await API.get(`/comments/task/${taskId}`);

    const data =
      response.data?.data?.comments ||
      response.data?.comments ||
      response.data?.data ||
      [];

    setComments(Array.isArray(data) ? data : []);
  } catch (error) {
    setComments([]);

    // Comments are temporarily unavailable.
    // Do not log console.error here.
  }
};

  const updateTask = async (updatedFields) => {
    try {
      setSaving(true);

      await API.put(`/task/${taskId}`, updatedFields);

      toast.success("Task updated successfully");
      setEditing(false);
      await fetchTask();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update task"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await API.patch(`/task/${taskId}/status`, {
      status: "Completed",
    });

      toast.success("Task marked as completed");
      fetchTask();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update task"
      );
    }
  };

  const handleSubtaskToggle = (index) => {
    setSubtasks((previous) =>
      previous.map((item, i) =>
        i === index
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.warning("Please write a comment");
      return;
    }

    try {
      await API.post("/comments/create", {
        taskId,
        content: commentText.trim(),
        text: commentText.trim(),
      });

      setCommentText("");
      toast.success("Comment added");
      fetchComments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to add comment"
      );
    }
  };

  const completedSubtasks = subtasks.filter(
    (item) => item.completed
  ).length;

  const subtaskProgress = subtasks.length
    ? Math.round((completedSubtasks / subtasks.length) * 100)
    : 0;

  const assignee =
    typeof task?.assignedTo === "object"
      ? task.assignedTo
      : null;

  const project =
    typeof task?.project === "object" ? task.project : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Task not found
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-600"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Projects
          </button>
          <span>/</span>
          <span>{project?.name || "Project"}</span>
          <span>/</span>
          <span className="font-medium text-indigo-600">
            Tasks
          </span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {task.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Created by{" "}
              {task.createdBy?.name || "User"}
              {task.createdAt &&
                ` · ${new Date(task.createdAt).toLocaleDateString()}`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Edit size={16} />
              {editing ? "Cancel edit" : "Edit"}
            </button>

            {task.status !== "Completed" && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Check size={16} />
                Mark complete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">

          {/* Main content */}
          <div className="space-y-5">

            {/* Description */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-900">
                  Description
                </h2>
              </div>

              {editing ? (
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {task.description || "No description added."}
                </p>
              )}
            </section>

            {/* Subtasks */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Subtasks
                </h2>
                <span className="text-xs text-slate-500">
                  {completedSubtasks} of {subtasks.length} done
                </span>
              </div>

              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              {subtasks.length > 0 ? (
                <div className="space-y-4">
                  {subtasks.map((item, index) => (
                    <button
                      key={item._id || index}
                      onClick={() => handleSubtaskToggle(index)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      {item.completed ? (
                        <CheckCircle2
                          size={19}
                          className="shrink-0 text-indigo-600"
                        />
                      ) : (
                        <Circle
                          size={19}
                          className="shrink-0 text-slate-300"
                        />
                      )}

                      <span
                        className={`text-sm ${
                          item.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {item.title || item.text || item.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No subtasks added to this task.
                </p>
              )}
            </section>

            {/* Comments */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <MessageCircle size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-900">
                  Comments · {comments.length}
                </h2>
              </div>

              <div className="mb-6 space-y-5">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div
                      key={comment._id || index}
                      className="flex gap-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {(comment.user?.name ||
                          comment.createdBy?.name ||
                          "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {comment.user?.name ||
                              comment.createdBy?.name ||
                              "User"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleString()
                              : ""}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {comment.content || comment.text || comment.message}
                        </p>

                        {comment.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map((file, i) => (
                              <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                              >
                                <Paperclip size={12} />
                                {file.name || "Attachment"}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No comments yet. Start the conversation.
                  </p>
                )}
              </div>

              <form
                onSubmit={handleAddComment}
                className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 p-2.5 text-white hover:bg-indigo-700"
                >
                  <Send size={16} />
                </button>
              </form>
            </section>
          </div>

          {/* Details sidebar */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-900">
              Details
            </h2>

            <div className="space-y-4 text-sm">

              {/* Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Status</span>
                {editing ? (
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                    {task.status}
                  </span>
                )}
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Priority</span>
                {editing ? (
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    task.priority === "High"
                      ? "bg-red-50 text-red-600"
                      : task.priority === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {task.priority}
                  </span>
                )}
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Assignee</span>
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-700">
                    {(assignee?.name || "U").charAt(0).toUpperCase()}
                  </span>
                  {assignee?.name || "Unassigned"}
                </span>
              </div>

              {/* Due date */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Due date</span>
                {editing ? (
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="w-36 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                ) : (
                  <span className="flex items-center gap-2 text-slate-700">
                    <CalendarDays size={15} />
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "Not set"}
                  </span>
                )}
              </div>

              {/* Estimate */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Estimate</span>
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    value={form.estimatedHours}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedHours: e.target.value,
                      })
                    }
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                ) : (
                  <span className="flex items-center gap-2 text-slate-700">
                    <Clock3 size={15} />
                    {task.estimatedHours
                      ? `${task.estimatedHours} h`
                      : "Not set"}
                  </span>
                )}
              </div>

              {/* Labels */}
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Labels</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {(task.tags || task.labels || []).length > 0 ? (
                    (task.tags || task.labels || []).map((label, index) => (
                      <span
                        key={index}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                      >
                        {typeof label === "string" ? label : label.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">
                      No labels
                    </span>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <button
                disabled={saving}
                onClick={() => updateTask({
                  title: form.title,
                  description: form.description,
                  status: form.status,
                  priority: form.priority,
                  dueDate: form.dueDate || null,
                  estimatedHours: Number(form.estimatedHours) || 0,
                })}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            )}

            <p className="mt-5 text-xs leading-5 text-slate-400">
              You can edit this task based on your assigned permissions.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Keep useParams() inside a Suspense boundary for Next.js prerendering.
export default function TaskDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <TaskDetailsContent />
    </Suspense>
  );
}
