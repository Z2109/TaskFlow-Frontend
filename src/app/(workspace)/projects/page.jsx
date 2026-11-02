
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
  FolderPlus,
  Loader2,
} from "lucide-react";

import API from "@/services/api";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

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

function ProjectCard({ project, index, onClick }) {
  const color = COLORS[index % COLORS.length];
  const progress = getProjectProgress(project);
  const members = getProjectMembers(project);
  const totalTasks =
    project.totalTasks ?? project.taskCount ?? project.tasks?.length ?? 0;
  const completedTasks = project.completedTasks ?? 0;

  return (
    <article
      onClick={onClick}
      onKeyDown={(event) => {
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

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="rounded p-1 text-gray-400 opacity-0 transition hover:bg-gray-100 group-hover:opacity-100"
            aria-label="Project options"
          >
            <MoreVertical size={15} />
          </button>
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

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/projects/list");
      const result = getData(response);

      const list = Array.isArray(result)
        ? result
        : result.projects || result.data || [];

      setProjects(Array.isArray(list) ? list : []);
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
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
    try {
      setCreating(true);

      const response = await API.post("/projects/create", projectData);

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
      console.error("Create project error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to create project."
      );
    } finally {
      setCreating(false);
    }
  };

  const openCreateProject = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

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

        <button
          type="button"
          onClick={openCreateProject}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#5145EC] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4035D5]"
        >
          <Plus size={17} />
          New project
        </button>
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

          {!search && (
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
            />
          ))}

          {/* Create project card */}
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
        </div>
      )}

      {/* Existing Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        members={[]}
        loading={creating}
        onCreate={handleCreateProject}
        onSaveDraft={() => {
          toast.info("Draft functionality will be added next.");
        }}
      />
    </div>
  );
}
