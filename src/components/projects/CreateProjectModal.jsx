
"use client";

import { useMemo, useState } from "react";
import {
  X,
  Folder,
  Search,
  CalendarDays,
  Tag,
  Upload,
  Plus,
  Check,
  ChevronDown,
  Users,
} from "lucide-react";

const colors = [
  "#FFCA91",
  "#8B70F5",
  "#63C9F4",
  "#F58AB8",
  "#6EE7A0",
];

const categories = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Marketing",
  "Business",
  "Other",
];

const priorities = ["Low", "Medium", "High"];

const filters = ["All", "Frontend", "Backend", "Design", "QA"];

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  onSaveDraft,
  members = [],
  loading = false,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [color, setColor] = useState("#8B70F5");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState(["E-commerce", "Web App"]);
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [createFromTemplate, setCreateFromTemplate] = useState(false);
  const [coverImage, setCoverImage] = useState(null);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const memberName = member.name || "";
      const jobTitle = member.jobTitle || member.role?.name || "";
      const department = member.department || "";

      const matchesSearch =
        memberName.toLowerCase().includes(search.toLowerCase()) ||
        jobTitle.toLowerCase().includes(search.toLowerCase());

      const filter = activeFilter.toLowerCase();

      const matchesFilter =
        activeFilter === "All" ||
        department.toLowerCase().includes(filter) ||
        jobTitle.toLowerCase().includes(filter);

      return matchesSearch && matchesFilter;
    });
  }, [members, search, activeFilter]);

  if (!isOpen) return null;

  const toggleMember = (member) => {
    setSelectedMembers((previous) =>
      previous.some((item) => item._id === member._id)
        ? previous.filter((item) => item._id !== member._id)
        : [...previous, member]
    );
  };

  const addTag = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const value = tagInput.trim();

    if (value && !tags.includes(value)) {
      setTags((previous) => [...previous, value]);
    }

    setTagInput("");
  };

  const removeTag = (tag) => {
    setTags((previous) => previous.filter((item) => item !== tag));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("Web Development");
    setColor("#8B70F5");
    setPriority("Medium");
    setDueDate("");
    setTags([]);
    setTagInput("");
    setSearch("");
    setActiveFilter("All");
    setSelectedMembers([]);
    setIsPrivate(false);
    setReminderEnabled(false);
    setCreateFromTemplate(false);
    setCoverImage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !dueDate) return;

    const projectData = {
  name: name.trim(),
  description: description.trim(),
  category,
  color,
  priority,
  dueDate: dueDate || null,
  tags,
  isPrivate,
  reminderEnabled,
};

    await onCreate?.(projectData);
  };

  const handleSaveDraft = () => {
    const draftData = {
      name: name.trim(),
      description,
      category,
      color,
      priority,
      dueDate,
      tags,
      isPrivate,
      reminderEnabled,
      teamMembers: selectedMembers.map((member) => member._id),
    };

    if (onSaveDraft) {
      onSaveDraft(draftData);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-4.5 w-9 rounded-full transition ${
        checked ? "bg-[#5145EC]" : "bg-[#C8CBD8]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171B49]/60 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="relative flex max-h-[94vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-3 pt-5 sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-[#171B49]">
              Create New Project
            </h2>
            <p className="mt-0.5 text-xs text-[#606789]">
              Set up a project, then assign members and distribute tasks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 text-xs text-[#606789] hover:text-[#171B49]"
          >
            Esc
            <X size={15} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7"
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-3.5">
              {/* Project name */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#171B49]">
                  Project name <span className="text-red-500">*</span>
                </label>

                <div className="flex h-9 items-center gap-2 rounded-lg border border-[#DDE0EC] px-3 focus-within:border-[#5145EC]">
                  <Folder size={14} className="text-[#606789]" />
                  <input
                    required
                    maxLength={60}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full bg-transparent text-xs text-[#171B49] outline-none placeholder:text-[#8A90AA]"
                  />
                  <span className="whitespace-nowrap text-[10px] text-[#8A90AA]">
                    {name.length}/60
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-[#777F9E]">
                  Choose a clear, descriptive name.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#171B49]">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the goals and scope of this project..."
                  className="w-full resize-none rounded-lg border border-[#DDE0EC] px-3 py-2.5 text-xs text-[#171B49] outline-none placeholder:text-[#8A90AA] focus:border-[#5145EC]"
                />

                <p className="mt-1 text-[10px] text-[#777F9E]">
                  Describe goals and scope.
                </p>
              </div>

              {/* Category and color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#171B49]">
                    Category
                  </label>

                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 w-full appearance-none rounded-lg border border-[#DDE0EC] bg-white px-3 pr-7 text-xs text-[#171B49] outline-none focus:border-[#5145EC]"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-3 text-[#606789]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold text-[#171B49]">
                    Color
                  </label>

                  <div className="flex h-9 items-center gap-2">
                    {colors.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setColor(item)}
                        style={{ backgroundColor: item }}
                        className={`h-5 w-5 rounded-full border-2 ${
                          color === item
                            ? "border-[#171B49] ring-2 ring-[#C7C2FF]"
                            : "border-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority and date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[#171B49]">
                    Priority
                  </label>

                  <div className="flex overflow-hidden rounded-lg border border-[#DDE0EC]">
                    {priorities.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setPriority(item)}
                        className={`flex-1 py-2 text-[10px] transition ${
                          priority === item
                            ? "bg-[#5145EC] font-bold text-white"
                            : "bg-white text-[#606789] hover:bg-[#F5F5FF]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[#171B49]">
                    Due date <span className="text-red-500">*</span>
                  </label>

                  <div className="flex h-9 items-center gap-2 rounded-lg border border-[#DDE0EC] px-2">
                    <CalendarDays
                      size={13}
                      className="shrink-0 text-[#606789]"
                    />
                    <input
                      required
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="min-w-0 w-full bg-transparent text-[10px] text-[#171B49] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#171B49]">
                  Tags
                </label>

                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-[#DDE0EC] px-2 py-1.5 focus-within:border-[#5145EC]">
                  <Tag size={13} className="text-[#606789]" />

                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full border border-[#DDE0EC] px-2 py-1 text-[10px] text-[#454B6B]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#777F9E] hover:text-red-500"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}

                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Add tag..."
                    className="min-w-20 flex-1 bg-transparent text-[10px] outline-none"
                  />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#171B49]">
                  Cover image (optional)
                </label>

                <label className="flex h-[58px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#C9CDE0] bg-[#FAFAFE] text-center transition hover:border-[#5145EC]">
                  <Upload size={15} className="text-[#171B49]" />
                  <span className="mt-1 text-[10px] font-semibold text-[#171B49]">
                    {coverImage ? coverImage.name : "Upload project cover"}
                  </span>
                  <span className="text-[9px] text-[#777F9E]">
                    1280 × 720 recommended · PNG or JPG
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) =>
                      setCoverImage(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="rounded-xl bg-[#F6F7FC] p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#171B49]">
                  Assign team members
                </h3>

                <span className="rounded-full bg-[#E6E7FF] px-2 py-1 text-[9px] font-semibold text-[#5145EC]">
                  {selectedMembers.length} selected
                </span>
              </div>

              <p className="mt-1 text-[10px] leading-relaxed text-[#606789]">
                Pick who works on this project. Members keep the permissions
                of their company role.
              </p>

              {/* Search */}
              <div className="mt-2 flex h-8 items-center gap-2 rounded-lg border border-[#DDE0EC] bg-white px-2.5">
                <Search size={13} className="text-[#777F9E]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or role"
                  className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#8A90AA]"
                />
              </div>

              {/* Filters */}
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full border px-2.5 py-1 text-[9px] ${
                      activeFilter === filter
                        ? "border-[#5145EC] bg-[#E8E8FF] font-semibold text-[#5145EC]"
                        : "border-[#DDE0EC] bg-white text-[#606789]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Members list */}
              <div className="mt-2 max-h-[225px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users
                      size={20}
                      className="mx-auto mb-2 text-[#A5A9BD]"
                    />
                    <p className="text-[10px] text-[#777F9E]">
                      No team members found.
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const selected = selectedMembers.some(
                      (item) => item._id === member._id
                    );

                    return (
                      <div
                        key={member._id}
                        className="flex items-center gap-2 border-b border-[#E4E6F0] py-2 last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMember(member)}
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? "border-[#5145EC] bg-[#5145EC] text-white"
                              : "border-[#C8CBD8] bg-white"
                          }`}
                        >
                          {selected && <Check size={10} />}
                        </button>

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D9DFFF] text-[10px] font-bold text-[#5145EC]">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            (member.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold text-[#171B49]">
                            {member.name}
                          </p>
                          <p className="truncate text-[9px] text-[#777F9E]">
                            {member.jobTitle || member.role?.name || member.role || "Team member"}
                          </p>
                        </div>

                        <span className="max-w-20 truncate rounded-full border border-[#DDE0EC] bg-white px-2 py-1 text-[9px] text-[#606789]">
                          {member.role?.name || member.role || "Member"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Assigned chips */}
              <div className="mt-2 border-t border-[#E1E3ED] pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#171B49]">
                    Assigned ({selectedMembers.length})
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedMembers([])}
                    className="text-[9px] font-medium text-[#5145EC]"
                  >
                    Clear all
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedMembers.map((member) => (
                    <span
                      key={member._id}
                      className="flex items-center gap-1 rounded-full border border-[#DDE0EC] bg-white px-2 py-1 text-[9px] text-[#454B6B]"
                    >
                      {member.name}
                      <button
                        type="button"
                        onClick={() => toggleMember(member)}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  {selectedMembers.length === 0 && (
                    <span className="text-[9px] text-[#8A90AA]">
                      No members assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="mt-3 space-y-2 border-t border-[#E1E3ED] pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#171B49]">
                      Make private
                    </p>
                    <p className="text-[9px] text-[#777F9E]">
                      Only invited members can view
                    </p>
                  </div>
                  <Toggle checked={isPrivate} onChange={setIsPrivate} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#171B49]">
                      Set reminder
                    </p>
                    <p className="text-[9px] text-[#777F9E]">
                      Weekly progress digest
                    </p>
                  </div>
                  <Toggle
                    checked={reminderEnabled}
                    onChange={setReminderEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#171B49]">
                      Create from template
                    </p>
                    <p className="text-[9px] text-[#777F9E]">
                      Start with a predefined setup
                    </p>
                  </div>
                  <Toggle
                    checked={createFromTemplate}
                    onChange={setCreateFromTemplate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex flex-col-reverse items-start justify-between gap-3 border-t border-[#ECEEF5] pt-4 sm:flex-row sm:items-center">
            <p className="text-[9px] text-[#777F9E]">
              Only roles with Create on Projects can see this.
            </p>

            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="rounded-lg border border-[#DDE0EC] bg-white px-3 py-2 text-[10px] font-medium text-[#454B6B] hover:bg-gray-50"
              >
                Save as draft
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#DDE0EC] bg-white px-3 py-2 text-[10px] font-medium text-[#454B6B] hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !name.trim() || !dueDate}
                className="flex items-center gap-2 rounded-lg bg-[#5145EC] px-4 py-2 text-[10px] font-semibold text-white transition hover:bg-[#4035D5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create project"}
                {!loading && <Plus size={13} />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
