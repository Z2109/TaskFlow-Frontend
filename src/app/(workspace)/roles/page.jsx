"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Copy,
  Save,
  LoaderCircle,
  LockKeyhole,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  scope: "organization",
  permissions: [],
};

const ACTION_ORDER = ["create", "read", "update", "delete"];
const ACTION_LABELS = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
};

const getId = (value) =>
  typeof value === "object" && value !== null ? value._id : value;

const getPermissionKey = (permission) =>
  permission.key || `${permission.resource}:${permission.action}`;

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        API.get("/roles/list"),
        API.get("/permissions/list"),
      ]);

      const rolesPayload = rolesResponse.data?.data;
      const permissionsPayload = permissionsResponse.data?.data;

      const rolesData = Array.isArray(rolesPayload)
        ? rolesPayload
        : rolesPayload?.roles ?? rolesResponse.data?.roles ?? [];
      const permissionsData = Array.isArray(permissionsPayload)
        ? permissionsPayload
        : permissionsPayload?.permissions ?? permissionsResponse.data?.permissions ?? [];

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);

      setSelectedRoleId((current) => {
        if (current && rolesData.some((role) => role._id === current)) return current;
        return rolesData[0]?._id ?? null;
      });
    } catch (error) {
      console.error("Fetch roles and permissions error:", error);
      toast.error(error.response?.data?.message || "Unable to load roles and permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) =>
      `${role.name || ""} ${role.description || ""}`.toLowerCase().includes(term)
    );
  }, [roles, search]);

  const selectedRole = useMemo(
    () => roles.find((role) => role._id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const permissionMatrix = useMemo(() => {
    const matrix = {};
    permissions.forEach((permission) => {
      const resource = permission.resource || permission.key?.split(":")[0] || "other";
      const action = (permission.action || permission.key?.split(":")[1] || "").toLowerCase();
      if (!matrix[resource]) matrix[resource] = {};
      if (action) matrix[resource][action] = permission;
    });
    return matrix;
  }, [permissions]);

  const actions = useMemo(() => {
    const found = new Set(permissions.map((permission) =>
      (permission.action || permission.key?.split(":")[1] || "").toLowerCase()
    ).filter(Boolean));
    return [
      ...ACTION_ORDER.filter((action) => found.has(action)),
      ...[...found].filter((action) => !ACTION_ORDER.includes(action)).sort(),
    ];
  }, [permissions]);

  const selectedPermissionIds = useMemo(
    () => new Set((selectedRole?.permissions || []).map(getId).filter(Boolean).map(String)),
    [selectedRole]
  );

  const openCreateModal = () => {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    setOpenMenu(null);
  };

  const openEditModal = (role) => {
    if (role.isSystem) {
      toast.info("System roles cannot be modified");
      return;
    }
    setEditingRole(role);
    setForm({
      name: role.name || "",
      description: role.description || "",
      scope: role.scope || "organization",
      permissions: (role.permissions || []).map(getId).filter(Boolean).map(String),
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const toggleFormPermission = (permissionId) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(String(permissionId))
        ? current.permissions.filter((id) => id !== String(permissionId))
        : [...current.permissions, String(permissionId)],
    }));
  };

  const toggleMatrixPermission = async (permission) => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      toast.info("System role permissions cannot be changed here");
      return;
    }

    const currentIds = [...selectedPermissionIds];
    const id = String(permission._id);
    const nextIds = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id];

    try {
      setSaving(true);
      await API.put(`/roles/${selectedRole._id}`, { permissions: nextIds });
      toast.success("Permission updated");
      await fetchData();
    } catch (error) {
      console.error("Update permission error:", error);
      toast.error(error.response?.data?.message || "Unable to update permission");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter a role name");
    if (!form.permissions.length) return toast.error("Select at least one permission");

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        scope: form.scope,
        permissions: form.permissions,
      };

      let response;
      if (editingRole) {
        response = await API.put(`/roles/${editingRole._id}`, payload);
        toast.success("Role updated successfully");
      } else {
        response = await API.post("/roles/create", payload);
        toast.success("Role created successfully");
      }

      const createdRole = response.data?.data;
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingRole(null);
      await fetchData();
      if (createdRole?._id) setSelectedRoleId(createdRole._id);
    } catch (error) {
      console.error("Save role error:", error);
      toast.error(error.response?.data?.message || "Unable to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateRole = async (role) => {
    try {
      setSaving(true);
      const permissionIds = (role.permissions || []).map(getId).filter(Boolean).map(String);
      const response = await API.post("/roles/create", {
        name: `${role.name} Copy`,
        description: role.description || "",
        scope: role.scope || "organization",
        permissions: permissionIds,
      });
      toast.success("Role duplicated successfully");
      setOpenMenu(null);
      await fetchData();
      if (response.data?.data?._id) setSelectedRoleId(response.data.data._id);
    } catch (error) {
      console.error("Duplicate role error:", error);
      toast.error(error.response?.data?.message || "Unable to duplicate role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) return toast.error("System roles cannot be deleted");
    if (!window.confirm(`Delete the ${role.name} role?`)) return;
    try {
      setSaving(true);
      await API.delete(`/roles/${role._id}`);
      toast.success("Role deleted successfully");
      setOpenMenu(null);
      setSelectedRoleId(null);
      await fetchData();
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error(error.response?.data?.message || "Unable to delete role");
    } finally {
      setSaving(false);
    }
  };

  const getPermission = (resource, action) => permissionMatrix[resource]?.[action];

  return (
    <div className="min-h-screen bg-[#f5f6fc] px-4 py-6 md:px-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#151b42]">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">Define organization roles and control what each role can access.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 rounded-xl bg-[#5145ed] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4035d5]">
          <Plus size={18} /> Create role
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total roles" value={roles.length} icon={<ShieldCheck size={21} />} tone="purple" />
        <StatCard title="Custom roles" value={roles.filter((role) => !role.isSystem).length} icon={<Users size={21} />} tone="green" />
        <StatCard title="Available permissions" value={permissions.length} icon={<LockKeyhole size={21} />} tone="orange" />
      </div>

      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 md:p-6">
          <h2 className="text-lg font-bold text-[#151b42]">Access management</h2>
          <p className="mt-1 text-sm text-slate-500">Select a role and configure its permissions.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoaderCircle className="animate-spin text-[#5145ed]" size={30} /></div>
        ) : (
          <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* ROLE LIST */}
            <aside className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[#151b42]">Organization roles</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{roles.length}</span>
              </div>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5145ed]" />
              </div>
              <div className="space-y-1">
                {filteredRoles.map((role) => (
                  <div key={role._id} className={`group flex items-center gap-1 rounded-xl ${selectedRoleId === role._id ? "bg-[#eeecff]" : "hover:bg-slate-50"}`}>
                    <button onClick={() => setSelectedRoleId(role._id)} className="min-w-0 flex-1 px-3 py-3 text-left">
                      <span className={`block truncate text-sm font-semibold ${selectedRoleId === role._id ? "text-[#5145ed]" : "text-slate-700"}`}>{role.name}</span>
                      <span className="mt-1 block truncate text-xs text-slate-400">{role.description || (role.isSystem ? "System role" : "Custom organization role")}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{role.permissions?.length || 0} permissions</span>
                    </button>
                    <div className="relative pr-2">
                      <button onClick={() => setOpenMenu(openMenu === role._id ? null : role._id)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"><MoreHorizontal size={18} /></button>
                      {openMenu === role._id && (
                        <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <button onClick={() => openEditModal(role)} disabled={role.isSystem} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={14} /> Edit details</button>
                          <button onClick={() => handleDuplicateRole(role)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Copy size={14} /> Duplicate role</button>
                          {!role.isSystem && <button onClick={() => handleDeleteRole(role)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete role</button>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredRoles.length === 0 && <p className="px-2 py-8 text-center text-sm text-slate-400">No roles found.</p>}
              </div>
              <button onClick={openCreateModal} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#bcb6ff] px-3 py-3 text-sm font-semibold text-[#5145ed] hover:bg-[#f8f7ff]"><Plus size={16} /> Create new role</button>
            </aside>

            {/* PERMISSION MATRIX */}
            <div className="min-w-0 p-4 md:p-6">
              {selectedRole ? (
                <>
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[#151b42]">{selectedRole.name}</h3>
                        {selectedRole.isSystem && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600">System role</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{selectedRole.description || "Configure what members with this role are allowed to do."}</p>
                      <p className="mt-1 text-xs text-slate-400">Scope: {selectedRole.scope || "organization"} · {selectedPermissionIds.size} permissions enabled</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDuplicateRole(selectedRole)} disabled={saving} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Copy size={15} /> Duplicate</button>
                      {!selectedRole.isSystem && <button onClick={() => openEditModal(selectedRole)} className="flex items-center gap-2 rounded-lg bg-[#5145ed] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4035d5]"><Pencil size={15} /> Edit role</button>}
                    </div>
                  </div>

                  {permissions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                      <LockKeyhole className="mx-auto mb-3 text-slate-300" size={32} />
                      <p className="font-semibold text-slate-700">No permissions available</p>
                      <p className="mt-1 text-sm text-slate-400">Run your permission seed script and check the permissions API.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[650px] border-collapse text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Resource</th>
                            {actions.map((action) => <th key={action} className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">{ACTION_LABELS[action] || action}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(permissionMatrix).map(([resource, resourceActions]) => (
                            <tr key={resource} className="hover:bg-slate-50/70">
                              <td className="px-4 py-4">
                                <p className="text-sm font-semibold capitalize text-[#151b42]">{resource.replace(/[-_]/g, " ")}</p>
                                <p className="mt-0.5 text-xs text-slate-400">{Object.keys(resourceActions).length} available actions</p>
                              </td>
                              {actions.map((action) => {
                                const permission = getPermission(resource, action);
                                const checked = permission ? selectedPermissionIds.has(String(permission._id)) : false;
                                return (
                                  <td key={action} className="px-3 py-4 text-center">
                                    {permission ? (
                                      <input type="checkbox" aria-label={`${resource} ${action}`} checked={checked} disabled={saving || selectedRole.isSystem} onChange={() => toggleMatrixPermission(permission)} className="h-4 w-4 cursor-pointer accent-[#5145ed] disabled:cursor-not-allowed" />
                                    ) : <span className="text-slate-200">—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">Changes to custom roles are saved immediately. System role permissions are read-only here.</p>
                </>
              ) : (
                <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
                  <ShieldCheck size={40} className="mb-3 text-slate-300" />
                  <h3 className="font-semibold text-slate-700">Select a role</h3>
                  <p className="mt-1 text-sm text-slate-400">Choose a role from the left panel to configure its permissions.</p>
                  <button onClick={openCreateModal} className="mt-4 rounded-lg bg-[#5145ed] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={15} className="mr-1 inline" /> Create role</button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* CREATE / EDIT ROLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <h2 className="text-xl font-bold text-[#151b42]">{editingRole ? "Edit role" : "Create new role"}</h2>
                <p className="mt-1 text-sm text-slate-500">Define the job role and select its access permissions.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={21} /></button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Role name *</label>
                <input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Senior Backend Developer" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5145ed]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the responsibilities of this role..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5145ed]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Scope</label>
                <select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5145ed]">
                  <option value="organization">Organization</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><h3 className="font-bold text-[#151b42]">Permissions</h3><p className="mt-1 text-xs text-slate-500">Choose what members assigned to this role can do.</p></div>
                  <span className="rounded-full bg-[#eeecff] px-3 py-1 text-xs font-bold text-[#5145ed]">{form.permissions.length} selected</span>
                </div>
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-4">
                  {Object.entries(permissionMatrix).map(([resource, resourceActions]) => (
                    <div key={resource}>
                      <h4 className="mb-2 text-sm font-bold capitalize text-slate-700">{resource.replace(/[-_]/g, " ")}</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.values(resourceActions).map((permission) => {
                          const checked = form.permissions.includes(String(permission._id));
                          return (
                            <label key={permission._id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${checked ? "border-[#aaa3ff] bg-[#f5f4ff]" : "border-slate-100 hover:bg-slate-50"}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleFormPermission(permission._id)} className="h-4 w-4 accent-[#5145ed]" />
                              <span className="min-w-0 flex-1 truncate text-slate-700">{permission.description || getPermissionKey(permission)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {permissions.length === 0 && <p className="py-5 text-center text-sm text-slate-500">No permissions available. Seed permissions first.</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving || !permissions.length} className="flex items-center gap-2 rounded-xl bg-[#5145ed] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4035d5] disabled:opacity-60">
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingRole ? "Save changes" : "Create role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, tone }) {
  const tones = {
    purple: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><p className="text-sm text-slate-500">{title}</p><h3 className="mt-2 text-3xl font-bold text-[#151b42]">{value}</h3></div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
    </div>
  );
}
