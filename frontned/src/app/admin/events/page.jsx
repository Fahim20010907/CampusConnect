"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/Authcontext";
import AdminLayout from "@/component/AdminLayout";
import ProtectedAdminRoute from "@/component/ProtectedAdminRoute";
import Swal from "sweetalert2";

export default function AdminEvents() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [user, searchTerm]);

  const fetchEvents = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events?${params}`,
        {
          headers: {
            "x-user-id": user.uid,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    const result = await Swal.fire({
      title: "Delete Event?",
      text: `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}`,
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
        Swal.fire("Deleted!", "Event has been deleted.", "success");
        setEvents(events.filter((e) => e._id !== eventId));
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
      Swal.fire("Error", "Failed to delete event", "error");
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>
            <p className="text-gray-500 mt-2">Manage all events in the system</p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
                {error}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No events found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        RSVPs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {event.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.description ? event.description.substring(0, 50) + "..." : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.location || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.date ? new Date(event.date).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.rsvps?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDeleteEvent(event._id, event.title)}
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            📅 Total Events: <strong>{events.length}</strong>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
