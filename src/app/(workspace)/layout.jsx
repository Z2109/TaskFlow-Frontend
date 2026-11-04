
"use client";

import { useState } from "react";

import Sidebar from "@/components/workspace/Sidebar";
import Navbar from "@/components/workspace/Navbar";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { PermissionProvider } from "@/context/PermissionContext";

export default function WorkspaceLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <ThemeProvider>
      <PermissionProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-200">

          {/* Shared Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />

          {/* Main Workspace */}
          <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">

            {/* Shared Navbar */}
            <Navbar onMenuClick={openSidebar} />

            {/* Individual Page Content */}
            <main className="min-w-0 flex-1 bg-background p-4 text-foreground transition-colors duration-200 sm:p-6 lg:p-7">
              {children}
            </main>

          </div>
        </div>
      </PermissionProvider>
    </ThemeProvider>
  );
}
