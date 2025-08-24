import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";

export default function LifecycleSummary({ appointmentId }) {
  const [lifecycle, setLifecycle] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get(
          `/appointments/${appointmentId}/lifecycle`
        );
        if (!mounted) return;
        const { lifecycle: lc, events: evts } = res.data.data || {};
        setLifecycle(lc || null);
        setEvents(Array.isArray(evts) ? evts : []);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load lifecycle");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  if (loading) return <div>Loading lifecycle…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!lifecycle) return <div>No lifecycle found.</div>;

  const recent = [...events].slice(-5).reverse();

  return (
    <div>
      <h3 className="font-semibold text-lg">Lifecycle</h3>
      <div className="text-sm mt-1">
        <div>
          <strong>Status:</strong> {lifecycle.currentStatus}
        </div>
        <div>
          <strong>ID:</strong> {lifecycle.lifecycleId}
        </div>
      </div>
      <div className="mt-2">
        <h4 className="font-medium">Recent Events</h4>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet.</p>
        ) : (
          <ul className="text-sm divide-y">
            {recent.map((e) => (
              <li
                key={e._id}
                className="py-1 flex items-center justify-between"
              >
                <span>{e.eventType}</span>
                <span className="text-gray-500">
                  {new Date(e.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
