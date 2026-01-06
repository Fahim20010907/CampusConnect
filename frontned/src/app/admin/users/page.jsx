"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/Authcontext";
import AdminLayout from "@/component/AdminLayout";
import ProtectedAdminRoute from "@/component/ProtectedAdminRoute";
import Swal from "sweetalert2";

export default function AdminUsers() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [user, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`,
        {
          headers: {
            "x-user-id": user.uid,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user.uid,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        Swal.fire("Deleted!", "User has been deleted.", "success");
        setUsers(users.filter((u) => u._id !== userId));
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const handleUpdateRole = async (userId, currentRole) => {
    const roles = ["student", "faculty", "club_coordinator", "admin"];
    const otherRoles = roles.filter((r) => r !== currentRole);

    const { value: newRole } = await Swal.fire({
      title: "Update User Role",
      input: "select",
      inputOptions: otherRoles.reduce((acc, role) => {
        acc[role] = role.charAt(0).toUpperCase() + role.slice(1);
        return acc;
      }, {}),
      showCancelButton: true,
    });

    if (!newRole) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "x-user-id": user.uid,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Swal.fire("Updated!", "User role has been updated.", "success");
        fetchUsers();
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      console.error("Failed to update role:", err);
      Swal.fire("Error", "Failed to update role", "error");
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      faculty: "bg-blue-100 text-blue-800",
      club_coordinator: "bg-purple-100 text-purple-800",
      student: "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-500 mt-2">Manage all users in the system</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="club_coordinator">Club Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {u.department || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleUpdateRole(u._id, u.role)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            📊 Total Users: <strong>{users.length}</strong>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
