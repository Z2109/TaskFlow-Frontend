
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import API from "@/services/api";
import { toast } from "react-toastify";

import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  FileUp,
  Download,
  Trash2,
  Search,
  LoaderCircle,
  FolderOpen,
  RefreshCw,
  Eye,
  X,
  Check,
  Filter,
} from "lucide-react";

// Extract files from API response
const getFiles = (response) => {
  const data = response?.data;

  if (Array.isArray(data?.files)) return data.files;
  if (Array.isArray(data?.data?.files)) return data.data.files;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

// Format file size
const formatSize = (bytes = 0) => {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format date
const formatDate = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Determine file category using MIME type and extension
const getFileCategory = (file) => {
  const mime = (file.mimeType || "").toLowerCase();
  const name = (
    file.originalName ||
    file.name ||
    ""
  ).toLowerCase();

  if (
    mime.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif|svg)$/.test(name)
  ) {
    return "Images";
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("csv") ||
    /\.(xls|xlsx|csv)$/.test(name)
  ) {
    return "Spreadsheets";
  }

  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("word") ||
    mime.includes("text") ||
    mime.includes("presentation") ||
    /\.(pdf|doc|docx|ppt|pptx|txt)$/.test(name)
  ) {
    return "Documents";
  }

  return "Other";
};

// Get file icon
const getFileIcon = (mimeType = "", fileName = "") => {
  const category = getFileCategory({
    mimeType,
    originalName: fileName,
  });

  if (category === "Images") return FileImage;
  if (category === "Spreadsheets") return FileSpreadsheet;
  if (category === "Documents") return FileText;

  return File;
};

export default function ProjectFiles({ projectId }) {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [previewFile, setPreviewFile] = useState(null);

  // Load files
  const loadFiles = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await API.get(
        `/files/project/${projectId}`
      );

      setFiles(getFiles(response));
    } catch (error) {
      console.error(
        "Load files error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load project files."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Upload file
  const handleUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10 MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      await API.post(
        `/files/project/${projectId}/upload`,
        formData
      );

      toast.success("File uploaded successfully.");

      await loadFiles();
    } catch (error) {
      console.error(
        "Upload error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to upload file."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Delete file
  const handleDelete = async (fileId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this file?"
    );

    if (!confirmed) return;

    try {
      await API.delete(
        `/files/project/${projectId}/${fileId}`
      );

      setFiles((previous) =>
        previous.filter((file) => file._id !== fileId)
      );

      if (previewFile?._id === fileId) {
        setPreviewFile(null);
      }

      toast.success("File deleted successfully.");
    } catch (error) {
      console.error(
        "Delete file error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to delete file."
      );
    }
  };

  // Search and filter
  const filteredFiles = files.filter((file) => {
    const fileName = (
      file.originalName ||
      file.name ||
      ""
    ).toLowerCase();

    const matchesSearch = fileName.includes(
      search.toLowerCase()
    );

    const category = getFileCategory(file);

    const matchesFilter =
      activeFilter === "All" ||
      category === activeFilter;

    return matchesSearch && matchesFilter;
  });

  // Filter counts
  const filterOptions = [
    { label: "All", count: files.length },
    {
      label: "Documents",
      count: files.filter(
        (file) => getFileCategory(file) === "Documents"
      ).length,
    },
    {
      label: "Images",
      count: files.filter(
        (file) => getFileCategory(file) === "Images"
      ).length,
    },
    {
      label: "Spreadsheets",
      count: files.filter(
        (file) => getFileCategory(file) === "Spreadsheets"
      ).length,
    },
  ];

  const totalStorage = files.reduce(
    (total, file) => total + (Number(file.size) || 0),
    0
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoaderCircle
          size={32}
          className="animate-spin text-indigo-600"
        />
      </div>
    );
  }

  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h2 className="text-lg font-bold text-[#171B49]">
            Project files
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Store and manage all your project documents in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-[#5145EC] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <FileUp size={16} />
            )}

            {uploading ? "Uploading..." : "Upload file"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
            onChange={handleUpload}
          />

        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FolderOpen size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total files
              </p>

              <h3 className="text-xl font-bold text-[#171B49]">
                {files.length}
              </h3>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileUp size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Storage
              </p>

              <h3 className="text-xl font-bold text-[#171B49]">
                {formatSize(totalStorage)}
              </h3>
            </div>

          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">

        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search files..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-indigo-400"
        />

      </div>

      {/* FILE TYPE FILTERS */}
      <div className="flex flex-wrap items-center gap-2">

        <div className="mr-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Filter size={15} />
          Filter:
        </div>

        {filterOptions.map((option) => {
          const isActive = activeFilter === option.label;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setActiveFilter(option.label)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              {option.label}

              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {option.count}
              </span>

              {isActive && <Check size={13} />}
            </button>
          );
        })}

      </div>

      {/* FILE TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <h3 className="text-sm font-bold text-[#171B49]">
            {activeFilter === "All"
              ? "All files"
              : activeFilter}
          </h3>

          <span className="text-xs text-slate-400">
            {filteredFiles.length} files
          </span>

        </div>

        {filteredFiles.length > 0 ? (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left">

              <thead className="bg-slate-50">

                <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">File name</th>
                  <th className="px-5 py-4">Uploaded by</th>
                  <th className="px-5 py-4">Size</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(
                    file.mimeType,
                    file.originalName || file.name
                  );

                  return (
                    <tr
                      key={file._id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* FILE NAME */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Icon size={19} />
                          </div>

                          <div className="min-w-0">

                            <p className="max-w-[230px] truncate text-xs font-semibold text-[#171B49]">
                              {file.originalName || file.name}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {file.format?.toUpperCase() || "FILE"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* UPLOADER */}
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {file.uploadedBy?.name || "Unknown"}
                      </td>

                      {/* SIZE */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatSize(file.size)}
                      </td>

                      {/* DATE */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(file.createdAt)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">

                        <div className="flex items-center justify-end gap-2">

                          {/* PREVIEW */}
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            title="Preview file"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Eye size={16} />
                          </button>

                          {/* DOWNLOAD */}
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open or download file"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Download size={16} />
                            </a>
                          )}

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => handleDelete(file._id)}
                            title="Delete file"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        ) : (

          /* EMPTY STATE */
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
              <FolderOpen size={28} />
            </div>

            <h3 className="mt-4 text-sm font-bold text-[#171B49]">
              {search
                ? "No files found"
                : activeFilter !== "All"
                  ? `No ${activeFilter.toLowerCase()} found`
                  : "No files uploaded yet"}
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
              {search
                ? "Try searching with a different file name."
                : activeFilter !== "All"
                  ? "Try another file category or upload a new file."
                  : "Upload documents, images, and spreadsheets to keep your project organized."}
            </p>

            {!search && activeFilter === "All" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <FileUp size={15} />
                Upload your first file
              </button>
            )}

          </div>

        )}

      </div>

      {/* SUPPORTED FORMATS */}
      <p className="text-[11px] text-slate-400">
        Supported formats: PDF, Word, Excel, PowerPoint, TXT, CSV and images.
        Maximum file size: 10 MB.
      </p>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (

        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-[#171B49]/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >

          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">

              <div className="min-w-0">

                <h2 className="truncate text-sm font-bold text-[#171B49]">
                  {previewFile.originalName || previewFile.name}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {formatSize(previewFile.size)} · File preview
                </p>

              </div>

              <div className="flex shrink-0 items-center gap-2">

                {previewFile.url && (
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                  >
                    <Download size={15} />
                    Open file
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close preview"
                >
                  <X size={19} />
                </button>

              </div>

            </div>

            {/* PREVIEW CONTENT */}
            <div className="flex min-h-[400px] flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">

              {previewFile.mimeType?.startsWith("image/") ? (

                <img
                  src={previewFile.url}
                  alt={previewFile.originalName || previewFile.name}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                />

              ) : previewFile.mimeType === "application/pdf" ? (

                <iframe
                  src={previewFile.url}
                  title={previewFile.originalName || previewFile.name}
                  className="h-[70vh] w-full rounded-lg bg-white"
                />

              ) : (

                <div className="text-center">

                  <FileText
                    size={48}
                    className="mx-auto text-indigo-400"
                  />

                  <h3 className="mt-4 text-sm font-bold text-slate-700">
                    Preview not available
                  </h3>

                  <p className="mt-2 text-xs text-slate-500">
                    This file type cannot be previewed here.
                    Use Open file to access it.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </section>
  );
}
