import React, { useEffect, useMemo, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContextCore";
import { Eye } from "lucide-react";

const AdminDoctorsPage = () => {
  const { addNotification } = useNotifications();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchDoctors = async (cursor = null, append = false) => {
      try {
        if (!append) setLoading(true);
        const url = new URL(`${import.meta.env.VITE_API_URL}/admin/users`);
        url.searchParams.set("role", "doctor");
        url.searchParams.set("limit", "20");
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch doctors (${res.status})`);
        const data = await res.json();
        const users = Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data)
          ? data
          : Array.isArray(data?.data?.users)
          ? data.data.users
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const onlyDoctors = users.filter((u) => u.role === "doctor");
        setDoctors((prev) =>
          append ? [...prev, ...onlyDoctors] : onlyDoctors
        );
        setNextCursor(data?.nextCursor || null);
      } catch (err) {
        setError(err.message || "Failed to fetch doctors");
      } finally {
        if (!append) setLoading(false);
      }
    };

    // initial load
    fetchDoctors();

    // Expose a load-more handler bound to state
    const loadMore = async () => {
      if (!nextCursor) return;
      setLoadingMore(true);
      await fetchDoctors(nextCursor, true);
      setLoadingMore(false);
    };
    // Attach to instance for onClick usage without recreating per row
    AdminDoctorsPage.loadMore = loadMore;
  }, [nextCursor]);

  const filteredDoctors = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return doctors.filter((u) => {
      if (
        statusFilter !== "all" &&
        (u.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (!needle) return true;
      const email = (u.email || "").toLowerCase();
      const first = u.profile?.firstName?.toLowerCase() || "";
      const last = u.profile?.lastName?.toLowerCase() || "";
      const full =
        u.profile?.fullName?.toLowerCase() || `${first} ${last}`.trim();
      return email.includes(needle) || full.includes(needle);
    });
  }, [doctors, searchTerm, statusFilter]);

  const updateStatus = async (userId, newStatus) => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!resp.ok) throw new Error("Failed to update status");
      setDoctors((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
      addNotification("Doctor status updated", "success");
    } catch (e) {
      addNotification(e.message || "Failed to update status", "error");
    }
  };

  const openDoctorProfile = async (userId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Failed to resolve doctor profile");
      const data = await res.json();
      const doctorId = data?.doctorDetails?._id;
      if (!doctorId) throw new Error("Doctor profile not found");
      window.open(`/doctors/${doctorId}`, "_blank");
    } catch (e) {
      addNotification(e.message || "Could not open doctor profile", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Doctors</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          className="border rounded px-3 py-2 w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Account Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {u.profile?.fullName ||
                        `${u.profile?.firstName || ""} ${
                          u.profile?.lastName || ""
                        }`.trim()}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {u.email}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        /^(approved|verified)$/i.test(
                          u.verificationStatus || ""
                        )
                          ? "bg-green-100 text-green-800"
                          : /^(rejected)$/i.test(u.verificationStatus || "")
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {(u.verificationStatus || "pending")
                        .toString()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        /^(active)$/i.test(u.status || "")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        title="View Profile"
                        onClick={() => openDoctorProfile(u._id)}
                      >
                        <Eye size={18} />
                      </button>
                      {/^active$/i.test(u.status || "") ? (
                        <button
                          className="text-red-600 hover:text-red-800 text-sm border px-2 py-1 rounded"
                          onClick={() => updateStatus(u._id, "suspended")}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="text-green-600 hover:text-green-800 text-sm border px-2 py-1 rounded"
                          onClick={() => updateStatus(u._id, "active")}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-center py-4">
          <button
            className="border px-4 py-2 rounded disabled:opacity-50"
            onClick={() => AdminDoctorsPage.loadMore?.()}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
