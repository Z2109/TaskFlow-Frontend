
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Folder,
  CalendarDays,
  MoreVertical,
  ArrowUpDown,
  X,
  Loader2,
  CheckCircle2,
  Archive,
  Trash2,
  RotateCcw,
} from "lucide-react";

import API from "@/services/api";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { usePermissions } from "@/context/PermissionContext";

const FILTERS = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Completed", value: "Completed" },
  { label: "Archived", value: "Archived" },
];

const COLORS = [
  { bg: "#FFE0B8", text: "#A65B00" },
  { bg: "#DDD6FE", text: "#5145EC" },
  { bg: "#BAE6FD", text: "#0369A1" },
  { bg: "#FBCFE8", text: "#BE185D" },
  { bg: "#BBF7D0", text: "#15803D" },
  { bg: "#FECACA", text: "#B91C1C" },
];

function getData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function formatDate(date, status) {
  if (!date) return "No due date";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "No due date";

  const prefix = status === "Completed" ? "Done" : "Due";

  return `${prefix} ${value.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  })}`;
}

function getProjectProgress(project) {
  if (typeof project.progress === "number") {
    return Math.min(100, Math.max(0, project.progress));
  }

  if (typeof project.completionPercentage === "number") {
    return Math.min(100, Math.max(0, project.completionPercentage));
  }

  const total =
    project.totalTasks ??
    project.taskCount ??
    project.tasks?.length ??
    0;

  const completed = project.completedTasks ?? 0;

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function getProjectMembers(project) {
  return project.teamMembers || project.members || [];
}

function ProjectCard({
  project,
  index,
  onClick,
  onProjectAction,
  openMenuId,
  setOpenMenuId,
  processingProjectId,
  canUpdateProject,
  canDeleteProject,
}) {
  const color = COLORS[index % COLORS.length];
  const progress = getProjectProgress(project);
  const members = getProjectMembers(project);
  const totalTasks =
    project.totalTasks ?? project.taskCount ?? project.tasks?.length ?? 0;
  const completedTasks = project.completedTasks ?? 0;
  const menuOpen = openMenuId === project._id;
  const isProcessing = processingProjectId === project._id;

  return (
    <article
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="group min-w-0 cursor-pointer rounded-xl border border-[#E1E3EF] bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-[#C9C5FF] hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {project.name?.charAt(0)?.toUpperCase() || "P"}
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-medium ${
              project.status === "Completed"
                ? "bg-[#D9F5E4] text-[#16834B]"
                : project.status === "Archived"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-[#E9EAF2] text-[#555B78]"
            }`}
          >
            {project.status || "Active"}
          </span>

          {(canUpdateProject || canDeleteProject) && (
            <div className="relative">
              <button
                type="button"
                disabled={isProcessing}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId(menuOpen ? null : project._id);
                }}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#171B49] disabled:opacity-50"
                aria-label="Project options"
                aria-expanded={menuOpen}
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MoreVertical size={16} />
                )}
              </button>

              {menuOpen && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl"
                >
                  {canUpdateProject && (
                    <>
                      {project.status !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => onProjectAction(project, "Completed")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-green-50 hover:text-green-700"
                        >
                          <CheckCircle2 size={15} />
                          Mark as Done
                        </button>
                      )}

                      {project.status !== "Active" && (
                        <button
                          type="button"
                          onClick={() => onProjectAction(project, "Active")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <RotateCcw size={15} />
                          {project.status === "Archived" ? "Restore Project" : "Mark as Active"}
                        </button>
                      )}

                      {project.status !== "Archived" && (
                        <button
                          type="button"
                          onClick={() => onProjectAction(project, "Archived")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Archive size={15} />
                          Archive Project
                        </button>
                      )}
                    </>
                  )}

                  {canDeleteProject && (
                    <>
                      {canUpdateProject && (
                        <div className="my-1 border-t border-gray-100" />
                      )}
                      <button
                        type="button"
                        onClick={() => onProjectAction(project, "Delete")}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Delete Project
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#171B49]">
        {project.name}
      </h3>

      <p className="mt-0.5 text-xs text-[#606789]">
        {completedTasks}/{totalTasks} tasks
      </p>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E7F0]">
          <div
            className={`h-full rounded-full transition-all ${
              project.status === "Completed"
                ? "bg-[#16B978]"
                : "bg-[#5145EC]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[10px] font-bold text-[#171B49]">
          {progress}%
        </span>
      </div>

      <div className="mt-4 flex min-h-7 items-center justify-between gap-2">
        <div className="flex items-center">
          {members.slice(0, 3).map((member, memberIndex) => (
            <div
              key={member._id || member.id || memberIndex}
              title={member.name || "Team member"}
              className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[9px] font-bold text-indigo-700 first:ml-0"
            >
              {member.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          ))}

          {members.length > 3 && (
            <span className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E9EAF2] text-[9px] font-bold text-[#555B78]">
              +{members.length - 3}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 whitespace-nowrap text-[10px] text-[#606789]">
          <CalendarDays size={12} />
          {formatDate(project.dueDate, project.status)}
        </span>
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const {
    loading: permissionsLoading,
    hasPermission,
  } = usePermissions();

  const canViewProjects = hasPermission("project:read");
  const canCreateProject = hasPermission("project:create");
  const canUpdateProject = hasPermission("project:update");
  const canDeleteProject = hasPermission("project:delete");
  const canReadTasks = hasPermission("task:read");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Organization members available for project assignment
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [processingProjectId, setProcessingProjectId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Fetch active organization members, excluding the organization owner.
  const loadOrganizationMembers = useCallback(async () => {
    try {
      setMembersLoading(true);

      const response = await API.get("/team/organization/members");
      const result = getData(response);

      const organizationMembers = Array.isArray(result)
        ? result
        : Array.isArray(result.members)
          ? result.members
          : Array.isArray(result.data)
            ? result.data
            : [];

      // Read the authenticated user ID from the same storage used by login.
      // Support common response shapes: user, data.user, and nested profile.
      const getId = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value !== "object") return "";

        const directId = value._id || value.id || value.userId;
        if (directId) return String(directId);

        return getId(value.user) || getId(value.data) || getId(value.profile);
      };

      let currentUserId = "";
      try {
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        if (storedUser) currentUserId = getId(JSON.parse(storedUser));
      } catch (storageError) {
        console.warn("Could not read the logged-in user:", storageError);
      }

      const getMemberUser = (member) =>
        member?.user || member?.member || member?.employee || member;

      const activeAssignableMembers = organizationMembers.filter((member) => {
        if (member?.status && member.status !== "active") return false;

        const memberUser = getMemberUser(member);
        const memberUserId = getId(memberUser) || getId(member?.userId);

        // The logged-in organization owner must not be offered as an assignee.
        if (currentUserId && memberUserId === currentUserId) return false;

        const roleValue = member?.role || memberUser?.role;
        const roleName = String(
          roleValue?.name ||
            roleValue?.title ||
            member?.roleName ||
            memberUser?.roleName ||
            (typeof roleValue === "string" && !/^[a-f0-9]{24}$/i.test(roleValue)
              ? roleValue
              : "")
        ).trim().toLowerCase();

        // Exclude owners even when the owner is not the current session user.
        if (
          member?.isOwner === true ||
          member?.isOrganizationOwner === true ||
          memberUser?.isOwner === true ||
          ["owner", "organization owner", "org owner"].includes(roleName)
        ) {
          return false;
        }

        return true;
      });

      console.log("Project assignee filtering:", {
        currentUserId,
        organizationMemberCount: organizationMembers.length,
        assignableMemberCount: activeAssignableMembers.length,
        members: organizationMembers.map((member) => ({
          id: getId(getMemberUser(member)) || getId(member?.userId),
          name: getMemberUser(member)?.name,
          role: member?.role?.name || member?.roleName || getMemberUser(member)?.role?.name,
          isOwner: member?.isOwner || member?.isOrganizationOwner,
        })),
      });
      setMembers(activeAssignableMembers);
    } catch (err) {
      console.error("Organization members loading error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      setMembers([]);
      toast.error(
        err.response?.data?.message ||
          "Unable to load organization members."
      );
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/projects/list");
      const result = getData(response);

      const list = Array.isArray(result)
        ? result
        : result.projects || result.data || [];

      let tasks = [];

      // Task counts are optional. Do not call the tasks API when the
      // current user does not have task:read permission.
      if (canReadTasks) {
        try {
          const taskResponse = await API.get("/tasks/list");
          const taskResult = getData(taskResponse);
          tasks = Array.isArray(taskResult)
            ? taskResult
            : taskResult.tasks || taskResult.data || [];
        } catch (taskError) {
          console.warn("Project task counts could not be loaded:", taskError);
        }
      }

      const taskCounts = new Map();

      tasks.forEach((task) => {
        const projectId =
          typeof task.project === "object"
            ? task.project?._id
            : task.project;

        if (!projectId) return;

        const current = taskCounts.get(String(projectId)) || {
          totalTasks: 0,
          completedTasks: 0,
        };

        current.totalTasks += 1;
        if (task.status === "Completed") current.completedTasks += 1;

        taskCounts.set(String(projectId), current);
      });

      const projectsWithProgress = (Array.isArray(list) ? list : []).map(
        (project) => {
          const counts = taskCounts.get(String(project._id)) || {
            totalTasks: 0,
            completedTasks: 0,
          };

          return {
            ...project,
            ...counts,
            progress:
              counts.totalTasks > 0
                ? Math.round((counts.completedTasks / counts.totalTasks) * 100)
                : 0,
          };
        }
      );

      setProjects(projectsWithProgress);
    } catch (err) {
      console.error("Projects loading error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      setError(
        err.response?.data?.message || "Unable to load your projects."
      );
    } finally {
      setLoading(false);
    }
  }, [canReadTasks]);

  useEffect(() => {
    if (!permissionsLoading && canViewProjects) {
      loadProjects();
    } else if (!permissionsLoading && !canViewProjects) {
      setLoading(false);
      setProjects([]);
    }
  }, [permissionsLoading, canViewProjects, loadProjects]);

  // Load organization members when the create-project modal is opened.
  useEffect(() => {
    if (showCreateModal) {
      loadOrganizationMembers();
    }
  }, [showCreateModal, loadOrganizationMembers]);

  const counts = useMemo(() => {
    return {
      All: projects.length,
      Active: projects.filter((p) => p.status === "Active").length,
      Completed: projects.filter((p) => p.status === "Completed").length,
      Archived: projects.filter((p) => p.status === "Archived").length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (activeFilter !== "All") {
      result = result.filter(
        (project) => project.status === activeFilter
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((project) =>
        [project.name, project.description, project.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      );
    }

    if (sortBy === "Name: A to Z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Due date") {
      result.sort(
        (a, b) =>
          new Date(a.dueDate || "9999-12-31") -
          new Date(b.dueDate || "9999-12-31")
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
    }

    return result;
  }, [projects, activeFilter, search, sortBy]);

  const handleCreateProject = async (projectData) => {
  if (!canCreateProject) {
    toast.error("You don't have permission to create projects.");
    return;
  }

  try {
    setCreating(true);

    console.log("Creating project:", projectData);

    const response = await API.post(
      "/projects/create",
      projectData
    );

    if (response.data?.success === false) {
      throw new Error(
        response.data?.message || "Project creation failed."
      );
    }

    toast.success(
      response.data?.message || "Project created successfully!"
    );

    setShowCreateModal(false);
    await loadProjects();

  } catch (err) {
    console.error("Create project error:", err);

    toast.error(
      err.response?.data?.message ||
      err.message ||
      "Unable to create project."
    );
  } finally {
    setCreating(false);
  }
};

  const handleProjectAction = (project, action) => {
    setOpenMenuId(null);

    if (action === "Delete" && !canDeleteProject) {
      toast.error("You don't have permission to delete projects.");
      return;
    }

    if (action !== "Delete" && !canUpdateProject) {
      toast.error("You don't have permission to update projects.");
      return;
    }

    if (action === "Delete") {
      setConfirmation({
        project,
        action,
        title: "Delete this project?",
        message: `“${project.name}” and all its tasks will be permanently deleted. This action cannot be undone.`,
        confirmLabel: "Delete project",
      });
      return;
    }

    const actionLabels = {
      Completed: "mark this project as completed",
      Active: "move this project back to active",
      Archived: "archive this project",
    };

    setConfirmation({
      project,
      action,
      title:
        action === "Completed"
          ? "Mark project as done?"
          : action === "Archived"
            ? "Archive this project?"
            : "Restore this project?",
      message: `Are you sure you want to ${actionLabels[action]}?`,
      confirmLabel:
        action === "Completed"
          ? "Mark as done"
          : action === "Archived"
            ? "Archive project"
            : "Mark as active",
    });
  };

  const confirmProjectAction = async () => {
    if (!confirmation?.project) return;

    const { project, action } = confirmation;

    if (action === "Delete" && !canDeleteProject) {
      setConfirmation(null);
      toast.error("You don't have permission to delete projects.");
      return;
    }

    if (action !== "Delete" && !canUpdateProject) {
      setConfirmation(null);
      toast.error("You don't have permission to update projects.");
      return;
    }

    try {
      setProcessingProjectId(project._id);
      setConfirmation(null);

      if (action === "Delete") {
        const response = await API.delete(`/projects/${project._id}`);

        if (response.data?.success === false) {
          throw new Error(response.data?.message || "Project deletion failed.");
        }

        toast.success(response.data?.message || "Project and its tasks deleted.");
      } else {
        const response = await API.patch(`/projects/${project._id}/status`, {
          status: action,
        });

        if (response.data?.success === false) {
          throw new Error(response.data?.message || "Project status update failed.");
        }

        const messages = {
          Completed: "Project marked as completed.",
          Active: "Project moved to active.",
          Archived: "Project archived successfully.",
        };

        toast.success(response.data?.message || messages[action]);
      }

      await loadProjects();
    } catch (err) {
      console.error("Project action error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to update this project."
      );
    } finally {
      setProcessingProjectId(null);
    }
  };

  const openCreateProject = () => {
    if (!canCreateProject) {
      toast.error("You don't have permission to create projects.");
      return;
    }
    setShowCreateModal(true);
  };

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#5145EC]" size={30} />
      </div>
    );
  }

  if (!canViewProjects) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Folder className="mb-4 text-gray-400" size={42} />
        <h2 className="text-xl font-bold text-[#171B49]">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-[#606789]">
          You don't have permission to view projects. Please contact your
          organization administrator.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[1600px] space-y-6"
      onClick={() => {
        if (openMenuId) setOpenMenuId(null);
      }}
    >

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171B49]">
            Projects
          </h1>

          <p className="mt-1 text-sm text-[#606789]">
            Create, track and organize every project in your workspace.
          </p>
        </div>

        {canCreateProject && (
          <button
            type="button"
            onClick={openCreateProject}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5145EC] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4035D5]"
          >
            <Plus size={17} />
            New project
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E1E3EF] pb-3">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeFilter === filter.value
                ? "bg-[#5145EC] text-white"
                : "text-[#606789] hover:bg-white hover:text-[#171B49]"
            }`}
          >
            {filter.label} {counts[filter.value]}
          </button>
        ))}
      </div>

      {/* Search and controls */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-[300px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8790B0]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              className="h-10 w-full rounded-lg border border-[#DDE0EB] bg-white pl-9 pr-9 text-sm text-[#171B49] outline-none placeholder:text-[#8790B0] focus:border-[#5145EC] focus:ring-2 focus:ring-[#5145EC]/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE0EB] bg-white px-3 text-xs font-medium text-[#171B49] hover:bg-gray-50"
            >
              <ArrowUpDown size={14} />
              Sort: {sortBy}
            </button>

            {showFilters && (
              <div className="absolute left-0 top-12 z-20 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {[
                  "Recently updated",
                  "Name: A to Z",
                  "Due date",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSortBy(option);
                      setShowFilters(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-indigo-50 ${
                      sortBy === option
                        ? "font-semibold text-[#5145EC]"
                        : "text-gray-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("All");
              setSearch("");
              setSortBy("Recently updated");
            }}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE0EB] bg-white px-3 text-xs font-medium text-[#171B49] hover:bg-gray-50"
          >
            <SlidersHorizontal size={14} />
            Reset
          </button>
        </div>

        <p className="text-xs text-[#606789]">
          {filteredProjects.length} projects
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadProjects}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-xl bg-white"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDE0EB] bg-white px-5 py-16 text-center">
          <Folder className="mx-auto mb-3 text-[#A5A9BF]" size={35} />

          <h3 className="text-base font-bold text-[#171B49]">
            {search ? "No matching projects" : "No projects found"}
          </h3>

          <p className="mt-1 text-sm text-[#606789]">
            {search
              ? "Try another search term."
              : "Create your first project to get started."}
          </p>

          {!search && canCreateProject && (
            <button
              type="button"
              onClick={openCreateProject}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#5145EC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4035D5]"
            >
              <Plus size={16} />
              Create project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
              onClick={() =>
                router.push(`/projects/${project._id}`)
              }
              onProjectAction={handleProjectAction}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              processingProjectId={processingProjectId}
              canUpdateProject={canUpdateProject}
              canDeleteProject={canDeleteProject}
            />
          ))}

          {/* Create project card */}
          {canCreateProject && (
          <button
            type="button"
            onClick={openCreateProject}
            className="flex min-h-[155px] flex-col items-center justify-center rounded-xl border border-dashed border-[#BFC4D8] bg-transparent p-5 text-center transition hover:border-[#5145EC] hover:bg-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7E7FF] text-[#5145EC]">
              <Plus size={20} />
            </div>

            <span className="mt-3 text-xs font-bold text-[#171B49]">
              Create new project
            </span>

            <span className="mt-1 text-[10px] text-[#606789]">
              Start from scratch or a template
            </span>
          </button>
          )}
        </div>
      )}

      {/* Project action confirmation */}
      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setConfirmation(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-confirmation-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                confirmation.action === "Delete"
                  ? "bg-red-50 text-red-600"
                  : confirmation.action === "Archived"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {confirmation.action === "Delete" ? (
                <Trash2 size={20} />
              ) : confirmation.action === "Archived" ? (
                <Archive size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </div>

            <h2
              id="project-confirmation-title"
              className="text-lg font-bold text-[#171B49]"
            >
              {confirmation.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#606789]">
              {confirmation.message}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-[#DDE0EB] px-4 py-2.5 text-sm font-semibold text-[#606789] hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmProjectAction}
                disabled={Boolean(processingProjectId)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmation.action === "Delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#5145EC] hover:bg-[#4035D5]"
                }`}
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {canCreateProject && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          members={members}
          membersLoading={membersLoading}
          loading={creating}
          onCreate={handleCreateProject}
          onSaveDraft={() => {
            toast.info("Draft functionality will be added next.");
          }}
        />
      )}
    </div>
  );
}
