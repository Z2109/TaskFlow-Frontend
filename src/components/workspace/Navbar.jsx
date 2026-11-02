
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Command,
} from "lucide-react";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();

  const [user, setUser] = useState({
    name: "User",
    role: "Member",
    email: "",
  });

  const [organizationName, setOrganizationName] = useState("Your Company");
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Load user and organization information
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser({
          name: parsedUser.name || "User",
          role: parsedUser.role || "Member",
          email: parsedUser.email || "",
        });
      } else {
        setUser({
          name:
            localStorage.getItem("userName") ||
            localStorage.getItem("name") ||
            "User",
          role: localStorage.getItem("userRole") || "Member",
          email: localStorage.getItem("userEmail") || "",
        });
      }

      setOrganizationName(
        localStorage.getItem("organizationName") || "Your Company"
      );
    } catch (error) {
      console.error("Unable to load navbar user information:", error);
    }
  }, []);

  // Logout functionality
  const handleLogout = () => {
    try {
      // Remove authentication information
      const keysToRemove = [
        "token",
        "user",
        "userName",
        "name",
        "userRole",
        "userEmail",
        "organizationId",
        "organizationName",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear session data
      sessionStorage.clear();

      // Close dropdown
      setShowProfile(false);
      setShowNotifications(false);

      toast.success("Logged out successfully!");

      // Redirect to login page
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Unable to logout. Please try again.");
    }
  };

  // Global search shortcut: Ctrl + K / Cmd + K
  useEffect(() => {
    const handleShortcut = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        document.getElementById("taskflow-global-search")?.focus();
      }

      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSearch = (event) => {
    event.preventDefault();

    if (!search.trim()) return;

    console.log("TaskFlow search:", search.trim());
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">

      {/* LEFT SECTION */}
      <div className="flex min-w-0 flex-1 items-center gap-3">

        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="relative w-full max-w-[420px]"
        >
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id="taskflow-global-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks, projects, people"
            className="h-[42px] w-full rounded-xl border border-transparent bg-[#F3F4FB] pl-11 pr-16 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          />

          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[10px] font-medium text-slate-400 shadow-sm">
            <Command size={11} />
            <span>K</span>
          </div>
        </form>
      </div>

      {/* RIGHT SECTION */}
      <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-5">

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.8} />

            <span className="absolute right-[9px] top-[7px] h-[9px] w-[9px] rounded-full border-2 border-white bg-red-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 z-50 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Notifications
                </h3>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Bell size={19} />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  You're all caught up!
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your notifications will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-9 w-px bg-slate-200 sm:block" />

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-1 transition hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8E9FF] text-[12px] font-bold text-[#5145EC]">
              {initials || "U"}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[145px] truncate text-[12px] font-bold text-slate-800">
                {user.name}
              </p>

              <p className="max-w-[170px] truncate text-[10px] text-slate-400">
                {user.role} · {organizationName}
              </p>
            </div>

            <ChevronDown
              size={15}
              className="hidden text-slate-400 sm:block"
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-14 z-50 w-[230px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

              {/* Profile information */}
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="truncate text-sm font-bold text-slate-800">
                  {user.name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {user.email || organizationName}
                </p>
              </div>

              <div className="p-2">

                {/* My Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <User size={16} />
                  My profile
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <Settings size={16} />
                  Settings
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-slate-100" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
