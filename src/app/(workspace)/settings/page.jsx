"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/utils/logout";
import {
  UserRound, Building2, Bell, Shield, Palette, Save, Camera,
  Eye, EyeOff, Moon, Sun, Monitor, Trash2, LogOut,
  LockKeyhole, Check, Settings2,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const sections = [
  { id: "profile", label: "My profile", icon: UserRound },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const defaultPreferences = {
  theme: "light",
  language: "en",
  weekStarts: "monday",
  compactMode: false,
  emailUpdates: true,
  taskAssigned: true,
  taskDue: true,
  projectUpdates: true,
  comments: true,
  productNews: false,
};

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${props.className || ""}`}
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${props.className || ""}`}
    />
  );
}

function Toggle({ checked, onChange, title, description }) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    jobTitle: "",
    department: "",
    bio: "",
  });
  const [organization, setOrganization] = useState({
    name: "",
    website: "",
    timezone: "Asia/Kolkata",
  });
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
    try {
      const savedProfile = localStorage.getItem("taskflow-settings-profile");
      const savedOrganization = localStorage.getItem("taskflow-settings-organization");
      const savedPreferences =
        localStorage.getItem("taskflowPreferences") ||
        localStorage.getItem("taskflow-settings-preferences");

      if (savedProfile) {
        setProfile((current) => ({ ...current, ...JSON.parse(savedProfile) }));
      }

      if (savedOrganization) {
        setOrganization((current) => ({ ...current, ...JSON.parse(savedOrganization) }));
      }

      if (savedPreferences) {
        setPreferences((current) => ({ ...current, ...JSON.parse(savedPreferences) }));
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setProfile((current) => ({
          ...current,
          name: current.name || user.name || "",
          email: current.email || user.email || "",
          jobTitle: current.jobTitle || user.jobTitle || "",
          department: current.department || user.department || "",
          bio: current.bio || user.bio || "",
        }));
      }

      // Load the latest profile from the backend.
      try {
        const response = await API.get("/users/me");
        const user = response.data?.user || response.data?.data?.user || response.data?.data || response.data;

        if (user && typeof user === "object") {
          setProfile((current) => ({
            ...current,
            name: user.name ?? current.name,
            email: user.email ?? current.email,
            jobTitle: user.jobTitle ?? current.jobTitle,
            department: user.department ?? current.department,
            bio: user.bio ?? current.bio,
          }));

          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (apiError) {
        // Keep the locally cached profile usable if the profile endpoint is unavailable.
        console.warn("Could not load profile from API:", apiError.response?.data?.message || apiError.message);
      }
    } catch (error) {
      console.error("Unable to load TaskFlow settings:", error);
    } finally {
      setLoaded(true);
    }
    };

    loadSettings();
  }, []);

  const updateProfile = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const updateOrganization = (key, value) => setOrganization((current) => ({ ...current, [key]: value }));
  const updatePreference = (key, value) => {
    setPreferences((current) => {
      const updated = { ...current, [key]: value };

      // Apply appearance immediately when the user selects a theme.
      if (key === "theme") {
        localStorage.setItem("taskflowPreferences", JSON.stringify(updated));
        localStorage.setItem("taskflow-settings-preferences", JSON.stringify(updated));
        window.dispatchEvent(new Event("taskflow-theme-change"));
      }

      return updated;
    });
  };

  const saveCurrentSection = async (event) => {
    event?.preventDefault();
    setSaving(true);

    try {
      if (activeSection === "profile") {
        const response = await API.put("/users/profile", {
          name: profile.name,
          jobTitle: profile.jobTitle,
          department: profile.department,
          bio: profile.bio,
        });

        const updatedUser =
          response.data?.user ||
          response.data?.data?.user ||
          response.data?.data;

        if (updatedUser && typeof updatedUser === "object") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setProfile((current) => ({
            ...current,
            name: updatedUser.name ?? current.name,
            email: updatedUser.email ?? current.email,
            jobTitle: updatedUser.jobTitle ?? current.jobTitle,
            department: updatedUser.department ?? current.department,
            bio: updatedUser.bio ?? current.bio,
          }));
        }

        localStorage.setItem("taskflow-settings-profile", JSON.stringify(profile));
        toast.success("Profile updated successfully.");
      } else if (activeSection === "organization") {
        localStorage.setItem("taskflow-settings-organization", JSON.stringify(organization));
        toast.success("Organization preferences saved on this device.");
      } else if (activeSection === "preferences" || activeSection === "notifications") {
        // ThemeProvider reads this shared key.
        localStorage.setItem("taskflowPreferences", JSON.stringify(preferences));
        // Keep the previous key for compatibility with any older pages.
        localStorage.setItem("taskflow-settings-preferences", JSON.stringify(preferences));
        window.dispatchEvent(new Event("taskflow-theme-change"));
        toast.success("Preferences saved successfully.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to save settings.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setSaving(true);

    try {
      const response = await API.patch("/users/change-password", passwords);
      toast.success(response.data?.message || "Password updated successfully.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update password.");
    } finally {
      setSaving(false);
    }
  };

  const inputType = showPasswords ? "text" : "password";

  if (!loaded) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-background text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-7 text-foreground transition-colors duration-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Settings2 size={14} /> Workspace
            <span>/</span>
            <span className="text-indigo-600">Settings</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#151b42]">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account, workspace and TaskFlow preferences.</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 pb-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Settings menu</p>
            <nav className="space-y-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activeSection === id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><LockKeyhole size={14} /> Your account</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Keep your profile and security information up to date.</p>
            </div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {activeSection === "profile" && (
              <form onSubmit={saveCurrentSection}>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-[#151b42]">My profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Your personal information and profile details.</p>
                </div>
                <div className="space-y-6 p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                      {(profile.name || profile.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{profile.name || "Your name"}</p>
                      <p className="mt-1 text-xs text-slate-500">Profile avatar</p>
                      <button type="button" onClick={() => toast.info("Avatar upload can be connected to your existing Cloudinary upload flow.")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"><Camera size={14} /> Change avatar</button>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name"><TextInput value={profile.name} onChange={(e) => updateProfile("name", e.target.value)} placeholder="Enter your full name" /></Field>
                    <Field label="Email address" hint="Your sign-in email address."><TextInput type="email" value={profile.email} onChange={(e) => updateProfile("email", e.target.value)} placeholder="you@company.com" /></Field>
                    <Field label="Job title"><TextInput value={profile.jobTitle} onChange={(e) => updateProfile("jobTitle", e.target.value)} placeholder="e.g. Backend Developer" /></Field>
                    <Field label="Department"><TextInput value={profile.department} onChange={(e) => updateProfile("department", e.target.value)} placeholder="e.g. Engineering" /></Field>
                  </div>
                  <Field label="About"><textarea value={profile.bio} onChange={(e) => updateProfile("bio", e.target.value)} rows={4} maxLength={300} placeholder="Write a short introduction..." className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /><span className="mt-1 block text-right text-xs text-slate-400">{profile.bio.length}/300</span></Field>
                </div>
                <Footer saving={saving} onSave={saveCurrentSection} onCancel={() => setActiveSection("preferences")} />
              </form>
            )}

            {activeSection === "organization" && (
              <form onSubmit={saveCurrentSection}>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-[#151b42]">Organization settings</h2>
                  <p className="mt-1 text-sm text-slate-500">Basic information for your current workspace.</p>
                </div>
                <div className="space-y-5 p-5 sm:p-7">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-800">Workspace details are currently saved locally. Connect these fields to your organization update API to synchronize changes with all members.</div>
                  <Field label="Organization name"><TextInput value={organization.name} onChange={(e) => updateOrganization("name", e.target.value)} placeholder="Your organization name" /></Field>
                  <Field label="Website"><TextInput type="url" value={organization.website} onChange={(e) => updateOrganization("website", e.target.value)} placeholder="https://example.com" /></Field>
                  <Field label="Workspace timezone"><SelectInput value={organization.timezone} onChange={(e) => updateOrganization("timezone", e.target.value)}><option value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</option><option value="UTC">UTC</option><option value="America/New_York">Eastern Time</option><option value="Europe/London">London</option></SelectInput></Field>
                </div>
                <Footer saving={saving} onSave={saveCurrentSection} />
              </form>
            )}

            {activeSection === "preferences" && (
              <div>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="text-lg font-bold text-[#151b42]">Preferences</h2><p className="mt-1 text-sm text-slate-500">Customize how TaskFlow looks and behaves.</p></div>
                <div className="divide-y divide-slate-100 px-5 sm:px-7">
                  <div className="py-5">
                    <p className="mb-3 text-sm font-semibold text-slate-800">Appearance</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }].map(({ value, label, icon: Icon }) => (
                        <button key={value} type="button" onClick={() => updatePreference("theme", value)} className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-medium ${preferences.theme === value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Icon size={18} />{label}{preferences.theme === value && <Check size={16} className="ml-auto" />}</button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Your selected theme applies across the TaskFlow workspace. System mode follows your device appearance.</p>
                  </div>
                  <div className="grid gap-5 py-5 sm:grid-cols-2">
                    <Field label="Language"><SelectInput value={preferences.language} onChange={(e) => updatePreference("language", e.target.value)}><option value="en">English</option><option value="hi">Hindi</option></SelectInput></Field>
                    <Field label="Week starts on"><SelectInput value={preferences.weekStarts} onChange={(e) => updatePreference("weekStarts", e.target.value)}><option value="monday">Monday</option><option value="sunday">Sunday</option></SelectInput></Field>
                  </div>
                  <Toggle checked={preferences.compactMode} onChange={(value) => updatePreference("compactMode", value)} title="Compact interface" description="Use tighter spacing in lists and tables." />
                </div>
                <Footer saving={saving} onSave={saveCurrentSection} />
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="text-lg font-bold text-[#151b42]">Notifications</h2><p className="mt-1 text-sm text-slate-500">Choose which updates you want to receive.</p></div>
                <div className="divide-y divide-slate-100 px-5 sm:px-7">
                  <Toggle checked={preferences.emailUpdates} onChange={(value) => updatePreference("emailUpdates", value)} title="Email notifications" description="Allow TaskFlow to send notifications to your email." />
                  <Toggle checked={preferences.taskAssigned} onChange={(value) => updatePreference("taskAssigned", value)} title="Task assignments" description="When a task is assigned to you." />
                  <Toggle checked={preferences.taskDue} onChange={(value) => updatePreference("taskDue", value)} title="Due date reminders" description="Reminders for tasks approaching their due date." />
                  <Toggle checked={preferences.projectUpdates} onChange={(value) => updatePreference("projectUpdates", value)} title="Project updates" description="Status changes and important project activity." />
                  <Toggle checked={preferences.comments} onChange={(value) => updatePreference("comments", value)} title="Comments and mentions" description="When someone comments on or mentions you." />
                  <Toggle checked={preferences.productNews} onChange={(value) => updatePreference("productNews", value)} title="Product news" description="Occasional announcements and feature updates." />
                </div>
                <Footer saving={saving} onSave={saveCurrentSection} />
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="text-lg font-bold text-[#151b42]">Security</h2><p className="mt-1 text-sm text-slate-500">Manage your password and account security.</p></div>
                <form onSubmit={changePassword} className="space-y-5 p-5 sm:p-7">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><div className="flex items-center gap-2 font-semibold"><Shield size={16} /> Secure password update</div><p className="mt-1 text-xs leading-5">Your current password is verified by the server before the new password is saved.</p></div>
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">Change password</p><button type="button" onClick={() => setShowPasswords((value) => !value)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600">{showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}{showPasswords ? "Hide passwords" : "Show passwords"}</button></div>
                  <Field label="Current password"><TextInput type={inputType} autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords((current) => ({ ...current, currentPassword: e.target.value }))} placeholder="Enter current password" /></Field>
                  <Field label="New password" hint="Use at least 8 characters."><TextInput type={inputType} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords((current) => ({ ...current, newPassword: e.target.value }))} placeholder="Enter new password" /></Field>
                  <Field label="Confirm new password"><TextInput type={inputType} autoComplete="new-password" value={passwords.confirmPassword} onChange={(e) => setPasswords((current) => ({ ...current, confirmPassword: e.target.value }))} placeholder="Confirm new password" /></Field>
                  <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Updating..." : "Update password"}</button>
                </form>
                <div className="border-t border-slate-100 p-5 sm:px-7">
                  <h3 className="font-semibold text-slate-800">Account actions</h3>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                    <div><p className="text-sm font-medium text-slate-800">Sign out</p><p className="mt-1 text-xs text-slate-500">Sign out of this device.</p></div>
                    <button type="button" onClick={() => logoutUser(router)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><LogOut size={15} /> Sign out</button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                    <div><p className="text-sm font-medium text-rose-700">Delete account</p><p className="mt-1 text-xs text-slate-500">Permanently remove your account and associated data.</p></div>
                    <button type="button" onClick={() => toast.info("Account deletion is disabled until a secure backend flow and confirmation are implemented.")} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={15} /> Delete account</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">TaskFlow settings · Some settings are stored locally until their backend endpoints are connected.</p>
      </div>
    </main>
  );
}

function Footer({ saving, onCancel, onSave }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
      {onCancel && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>}
      <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"><Save size={16} />{saving ? "Saving..." : "Save changes"}</button>
    </div>
  );
}
