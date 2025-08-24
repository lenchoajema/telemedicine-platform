import { useEffect, useMemo, useState } from "react";
import OrdersService from "../../api/OrdersService";

function coalesceChartLabs(chart) {
  const candidates = [
    chart?.labResults,
    chart?.labs,
    chart?.orders?.labs,
    chart?.orders,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
    if (c && Array.isArray(c?.items) && c.items.length) return c.items;
  }
  return [];
}

function coalesceChartImaging(chart) {
  const candidates = [
    chart?.imagingResults,
    chart?.imaging,
    chart?.orders?.imaging,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
    if (c && Array.isArray(c?.items) && c.items.length) return c.items;
  }
  return [];
}

export default function ResultsPanel({ appointmentId, patientId, chart }) {
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialLabs = useMemo(() => coalesceChartLabs(chart), [chart]);
  const initialImaging = useMemo(() => coalesceChartImaging(chart), [chart]);

  useEffect(() => {
    let mounted = true;
    setError("");
    if (initialLabs.length || initialImaging.length) {
      setLabs(initialLabs);
      setImaging(initialImaging);
      return () => {
        mounted = false;
      };
    }
    // Fallback: try fetching from Orders API if chart didn't include them
    const fetchData = async () => {
      setLoading(true);
      try {
        const [labResp, imgResp] = await Promise.allSettled([
          OrdersService.listLabOrders?.({ appointmentId, patientId }),
          OrdersService.listImagingOrders?.({ appointmentId, patientId }),
        ]);
        if (!mounted) return;
        if (labResp.status === "fulfilled" && Array.isArray(labResp.value))
          setLabs(labResp.value);
        if (imgResp.status === "fulfilled" && Array.isArray(imgResp.value))
          setImaging(imgResp.value);
      } catch (e) {
        if (mounted)
          setError(e?.response?.data?.message || "Failed to load results");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [appointmentId, patientId, initialLabs, initialImaging]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Results</h3>
      {loading && <p className="text-sm muted">Loading results…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <h4 className="font-medium">Lab Results</h4>
        {Array.isArray(labs) && labs.length ? (
          <ul className="divide-y">
            {labs
              .slice(-5)
              .reverse()
              .map((l, idx) => (
                <li key={idx} className="py-2 text-sm">
                  <div className="flex justify-between">
                    <span>{l.display || l.name || l.code || "Lab"}</span>
                    <span className="text-gray-600">
                      {l.status || l.resultStatus || ""}
                    </span>
                  </div>
                  <div>
                    {l.result?.value != null ? (
                      <span>
                        {l.result.value}
                        {l.result.unit ? ` ${l.result.unit}` : ""}
                        {l.result.referenceRange
                          ? ` (ref ${l.result.referenceRange})`
                          : ""}
                        {l.result.abnormal && (
                          <strong className="ml-1 text-amber-700">(!)</strong>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">No values</span>
                    )}
                  </div>
                  {l.collectedAt && (
                    <div className="muted">
                      Collected: {new Date(l.collectedAt).toLocaleString()}
                    </div>
                  )}
                  {l.reportedAt && (
                    <div className="muted">
                      Reported: {new Date(l.reportedAt).toLocaleString()}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No lab results</p>
        )}
      </div>

      <div>
        <h4 className="font-medium">Imaging Reports</h4>
        {Array.isArray(imaging) && imaging.length ? (
          <ul className="divide-y">
            {imaging
              .slice(-5)
              .reverse()
              .map((r, idx) => (
                <li key={idx} className="py-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      {[r.modality, r.bodyPart].filter(Boolean).join(" ") ||
                        "Imaging"}
                    </span>
                    <span className="text-gray-600">{r.status || ""}</span>
                  </div>
                  {r.report?.impression && (
                    <div className="mt-1 whitespace-pre-wrap">
                      {r.report.impression}
                    </div>
                  )}
                  {!r.report?.impression && r.report?.text && (
                    <div className="mt-1 whitespace-pre-wrap">
                      {r.report.text}
                    </div>
                  )}
                  {(r.reportedAt || r.performedAt) && (
                    <div className="muted mt-1">
                      {r.performedAt && (
                        <>
                          Performed: {new Date(r.performedAt).toLocaleString()}
                        </>
                      )}
                      {r.reportedAt && (
                        <>
                          <span className="mx-1">•</span>Reported:{" "}
                          {new Date(r.reportedAt).toLocaleString()}
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No imaging reports</p>
        )}
      </div>
    </div>
  );
}
