"use client";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/Authcontext";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { logOut } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300 overflow-y-auto`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            ☰
          </button>
        </div>

        <nav className="mt-8">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-3 hover:bg-gray-800 transition"
          >
            <span className="text-lg">📊</span>
            {sidebarOpen && <span className="ml-3">Dashboard</span>}
          </Link>

          <Link
            href="/admin/users"
            className="block px-4 py-3 hover:bg-gray-800 transition"
          >
            <span className="text-lg">👥</span>
            {sidebarOpen && <span className="ml-3">Users</span>}
          </Link>

          <Link
            href="/admin/events"
            className="block px-4 py-3 hover:bg-gray-800 transition"
          >
            <span className="text-lg">📅</span>
            {sidebarOpen && <span className="ml-3">Events</span>}
          </Link>

          <Link
            href="/admin/reports"
            className="block px-4 py-3 hover:bg-gray-800 transition"
          >
            <span className="text-lg">⚠️</span>
            {sidebarOpen && <span className="ml-3">Reports</span>}
          </Link>

          <hr className="my-4 border-gray-700" />

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 hover:bg-red-600 transition text-red-400"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to App
            </Link>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
