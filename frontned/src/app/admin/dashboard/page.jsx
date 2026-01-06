"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/Authcontext";
import AdminLayout from "@/component/AdminLayout";
import ProtectedAdminRoute from "@/component/ProtectedAdminRoute";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/stats`,
          {
            headers: {
              "x-user-id": user.uid, // Firebase UID
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-2">Welcome back! Here's your overview.</p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon="👥"
                color="border-blue-500"
              />
              <StatCard
                title="Total Events"
                value={stats.totalEvents}
                icon="📅"
                color="border-green-500"
              />
              <StatCard
                title="Total Posts"
                value={stats.totalPosts}
                icon="📝"
                color="border-purple-500"
              />
              <StatCard
                title="Reports"
                value={stats.reportedContent}
                icon="⚠️"
                color="border-red-500"
              />
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/admin/users"
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition"
              >
                Manage Users
              </a>
              <a
                href="/admin/events"
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition"
              >
                Manage Events
              </a>
              <a
                href="/admin/reports"
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg text-center transition"
              >
                View Reports
              </a>
              <a
                href="/"
                className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-lg text-center transition"
              >
                Back to App
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Info</h2>
            <div className="text-gray-600 space-y-2">
              <p>
                <strong>Last Updated:</strong> {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : "N/A"}
              </p>
              <p>
                <strong>Admin User:</strong> {user?.email || "Unknown"}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                All admin actions are logged for audit purposes. Check the server logs for detailed action history.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
