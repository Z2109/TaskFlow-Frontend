
"use client";

import { useState } from "react";
import Sidebar from "@/components/workspace/Sidebar";
import Navbar from "@/components/workspace/Navbar";

export default function WorkspaceLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen w-full bg-[#F4F5FB]">

      {/* Shared Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Workspace */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">

        {/* Shared Navbar */}
        <Navbar onMenuClick={openSidebar} />

        {/* Individual Page Content */}
        <main className="min-w-0 flex-1 bg-[#F4F5FB] p-4 sm:p-6 lg:p-7">
          {children}
        </main>

      </div>
    </div>
  );
}
