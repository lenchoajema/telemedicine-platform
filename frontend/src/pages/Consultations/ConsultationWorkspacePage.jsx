import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChartingService from "../../api/ChartingService";
import NotesPanel from "../../components/Consultations/NotesPanel";
import RxPanel from "../../components/Consultations/RxPanel";
import OrdersPanel from "../../components/Consultations/OrdersPanel";
import PatientSnapshot from "../../components/Consultations/PatientSnapshot";
import ResultsPanel from "../../components/Consultations/ResultsPanel";
import ThemeToggle from "../../components/shared/ThemeToggle";
import LifecycleSummary from "../../components/Consultations/LifecycleSummary";
import apiClient from "../../api/apiClient";

export default function ConsultationWorkspacePage() {
  const { appointmentId } = useParams();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    ChartingService.getChart(appointmentId)
      .then((data) => {
        if (mounted) setChart(data);
      })
      .catch((e) => {
        if (mounted)
          setError(e?.response?.data?.message || "Failed to load chart");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  const noteSaved = (note) => setChart((c) => ({ ...c, note }));

  const setLifecycleStatus = async (status, closureNotes) => {
    try {
      await apiClient.patch(`/appointments/${appointmentId}/lifecycle/status`, {
        currentStatus: status,
        closureNotes,
      });
      // Refresh chart to pick up any lifecycle-linked fields
      const data = await ChartingService.getChart(appointmentId);
      setChart(data);
    } catch (e) {
      console.error("Failed to update lifecycle", e);
      setError(e?.message || "Failed to update lifecycle");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) return <div className="p-4">Loading chart…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!chart) return <div className="p-4">No chart found.</div>;

  const patientId =
    chart?.appointment?.patient?._id || chart?.appointment?.patient;
  const lifecycleId = chart?.note?.lifecycleId;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Consultation Workspace</h2>
        <ThemeToggle variant="icon" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="card p-3 flex items-center gap-2">
            <button
              className="btn btn-outline"
              onClick={() => setLifecycleStatus("UnderReview")}
            >
              Mark Under Review
            </button>
            <button
              className="btn btn-outline"
              onClick={async () => {
                const notes = prompt("Closure notes (optional)") || undefined;
                await setLifecycleStatus("Closed", notes);
              }}
            >
              Close Appointment
            </button>
          </div>
          <div className="card p-4">
            <NotesPanel
              appointmentId={appointmentId}
              initialNote={chart.note}
              lifecycleId={lifecycleId}
              onNoteSaved={noteSaved}
            />
          </div>
          <div className="card p-4">
            <RxPanel appointmentId={appointmentId} lifecycleId={lifecycleId} />
          </div>
        </div>
        <div className="col-span-1 space-y-4">
          <div className="card p-4">
            <LifecycleSummary appointmentId={appointmentId} />
          </div>
          <div className="card p-4">
            <PatientSnapshot chart={chart} />
          </div>
          <div className="card p-4">
            <OrdersPanel
              appointmentId={appointmentId}
              patientId={patientId}
              lifecycleId={lifecycleId}
            />
          </div>
          <div className="card p-4">
            <ResultsPanel
              appointmentId={appointmentId}
              patientId={patientId}
              chart={chart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
