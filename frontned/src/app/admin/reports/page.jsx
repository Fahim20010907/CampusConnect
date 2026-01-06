"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/Authcontext";
import AdminLayout from "@/component/AdminLayout";
import ProtectedAdminRoute from "@/component/ProtectedAdminRoute";

export default function AdminReports() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reports`,
        {
          headers: {
            "x-user-id": user.uid,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setReports(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Reports</h1>
            <p className="text-gray-500 mt-2">View and manage reported content</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📋 Report Management System
            </h3>
            <p className="text-blue-800">
              This page is ready for the report system implementation. When users report content
              (posts, events, comments), those reports will appear here. You'll be able to:
            </p>
            <ul className="list-disc list-inside text-blue-800 mt-3 space-y-1">
              <li>Review reported content and context</li>
              <li>Take action on reports (approve, reject, or escalate)</li>
              <li>Track report history and patterns</li>
              <li>Manage reporter information</li>
            </ul>
          </div>

          {/* Reports Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">✅ No reports yet</p>
                <p className="text-gray-400 mt-2">Great! Everything is in order.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <h3 className="font-semibold text-gray-800">{report.title}</h3>
                    <p className="text-gray-600 mt-2">{report.description}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Implementation Guide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📚 How to Implement Reports
            </h3>
            <div className="space-y-4 text-gray-700 text-sm">
              <div>
                <strong>1. Create Report Model</strong>
                <p className="text-gray-600 mt-1">Add a Report schema to track reported content</p>
              </div>
              <div>
                <strong>2. Add Report Routes</strong>
                <p className="text-gray-600 mt-1">Create endpoints for submitting and managing reports</p>
              </div>
              <div>
                <strong>3. Implement Report Button</strong>
                <p className="text-gray-600 mt-1">Add a report button to posts/events/comments in the UI</p>
              </div>
              <div>
                <strong>4. Review & Action</strong>
                <p className="text-gray-600 mt-1">Use this dashboard to review and take action on reports</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
