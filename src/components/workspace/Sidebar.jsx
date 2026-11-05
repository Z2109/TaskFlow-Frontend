
"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePermissions } from "@/context/PermissionContext";

import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  ShieldCheck,
  ChartNoAxesCombined,
  Crown,
  X,
  Zap,
  ChevronDown,
  Building2,
  Sparkles,
} from "lucide-react";

// Sidebar navigation with required permissions
const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:read",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    permission: "project:read",
  },
  {
    title: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
    permission: "task:read",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    permission: "task:read",
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
    permission: "member:manage",
  },
  {
    title: "Roles & Permissions",
    href: "/roles",
    icon: ShieldCheck,
    permission: "role:manage",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
    permission: "analytics:read",
  },
  {
    title: "AI Assistant",
    href: "/ai-assistant",
    icon: Sparkles,
    permission: "ai:chat",
  },
];

function SidebarContent({
  isOpen = false,
  onClose = () => {},
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [organizationName, setOrganizationName] =
    useState("Your Company");

  const {
    loading,
    hasPermission,
  } = usePermissions();

  // Update organization name
  useEffect(() => {
    const updateOrganization = () => {
      const storedOrganization =
        localStorage.getItem("organizationName");

      setOrganizationName(
        storedOrganization || "Your Company"
      );
    };

    updateOrganization();

    window.addEventListener(
      "storage",
      updateOrganization
    );

    window.addEventListener(
      "organizationChanged",
      updateOrganization
    );

    return () => {
      window.removeEventListener(
        "storage",
        updateOrganization
      );

      window.removeEventListener(
        "organizationChanged",
        updateOrganization
      );
    };
  }, []);

  // Filter navigation according to permissions
  const visibleNavigation = navigation.filter(
    (item) => hasPermission(item.permission)
  );

  // Upgrade navigation
  const handleUpgrade = () => {
    onClose();
    router.push("/upgrade");
  };

  const isUpgradeActive =
    pathname === "/upgrade" ||
    pathname.startsWith("/upgrade/");

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          isOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-screen w-[250px] flex-col
          border-r border-white/5
          bg-[#171B49] text-white
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:z-30 lg:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* BRAND */}
        <div className="flex h-[76px] shrink-0 items-center justify-between px-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5145EC] shadow-lg shadow-indigo-950/30">
              <span className="text-lg font-bold">
                T
              </span>
            </div>

            <span className="text-[19px] font-bold tracking-tight">
              TaskFlow
            </span>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMPANY SELECTOR */}
        <div className="mx-4 mb-5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-[#222758] px-3 py-3 text-left transition hover:bg-[#292f69]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Building2 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-indigo-200/70">
                Company
              </p>

              <p className="truncate text-[13px] font-semibold text-white">
                {organizationName}
              </p>
            </div>

            <ChevronDown
              size={15}
              className="shrink-0 text-indigo-200/70"
            />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-4 pb-5">

          {loading ? (
            <div className="space-y-3 px-3 py-3">
              <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            <>
              {visibleNavigation.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group flex min-h-[43px] items-center gap-3
                      rounded-xl px-3.5 py-2.5
                      text-[13px] font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-[#5145EC] text-white shadow-lg shadow-indigo-950/20"
                          : "text-indigo-100/75 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={
                        isActive
                          ? "text-white"
                          : "text-indigo-200/75 group-hover:text-white"
                      }
                    />

                    <span>{item.title}</span>

                    {/* AI Assistant indicator */}
                    {item.title === "AI Assistant" && (
                      <span className="ml-auto rounded-md bg-indigo-400/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-200">
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* UPGRADE NAVIGATION */}
              <button
                type="button"
                onClick={handleUpgrade}
                className={`
                  group flex min-h-[43px] w-full items-center gap-3
                  rounded-xl px-3.5 py-2.5
                  text-left text-[13px] font-medium
                  transition-all duration-200
                  ${
                    isUpgradeActive
                      ? "bg-[#5145EC] text-white shadow-lg shadow-indigo-950/20"
                      : "text-indigo-100/75 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Crown
                  size={17}
                  className={
                    isUpgradeActive
                      ? "text-white"
                      : "text-indigo-200/75 group-hover:text-white"
                  }
                />

                <span>Upgrade plan</span>
              </button>
            </>
          )}
        </nav>

        {/* UPGRADE CARD */}
        <div className="shrink-0 px-4 pb-5">
          <div className="rounded-xl border border-indigo-400/10 bg-[#222758] p-3.5">

            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Crown size={15} />
              </div>

              <p className="text-[12px] font-bold text-white">
                Upgrade to Pro
              </p>
            </div>

            <p className="mb-3 text-[11px] leading-4 text-indigo-200/70">
              More AI credits and members
            </p>

            <button
              type="button"
              onClick={handleUpgrade}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5145EC] px-3 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#6257F2] active:scale-[0.98]"
            >
              <Zap size={14} />
              Upgrade
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-indigo-200/40">
            © 2026 TaskFlow
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar(props) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-[250px] shrink-0 bg-[#171B49]" />
      }
    >
      <SidebarContent {...props} />
    </Suspense>
  );
}
