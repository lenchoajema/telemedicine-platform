import { useState, useEffect } from "react";
import DeviceService from "../../api/DeviceService";
import "./Devices.css";

export default function DevicesPage() {
  const [integrations, setIntegrations] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure we always work with an array regardless of API shape
  const normalizeVitals = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (data && typeof data === "object") return Object.values(data);
    return [];
  };

  const formatValue = (val) => {
    if (val == null) return "";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [integrationsData, vitalsData] = await Promise.all([
        DeviceService.getStatus(),
        DeviceService.getVitals(),
      ]);
      setIntegrations(integrationsData);
      setVitals(normalizeVitals(vitalsData));
    } catch (err) {
      setError("Failed to load device data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    try {
      await DeviceService.connectDevice(provider);
      fetchData(); // Refresh data after connecting
    } catch (err) {
      setError(`Failed to connect to ${provider}.`);
    }
  };

  const handleDisconnect = async (id) => {
    try {
      await DeviceService.disconnectDevice(id);
      fetchData(); // Refresh data
    } catch (err) {
      setError("Failed to disconnect device.");
    }
  };

  const handleSync = async (id) => {
    try {
      await DeviceService.syncData(id);
      fetchData(); // Refresh vitals
    } catch (err) {
      setError("Failed to sync data.");
    }
  };

  if (loading) {
    return <div>Loading devices...</div>;
  }

  return (
    <div className="devices-page">
      <h1>Wearable Device Integrations</h1>
      {error && <p className="error-message">{error}</p>}

      <section className="integration-panel">
        <h2>Connect a Device</h2>
        <div className="connect-buttons">
          <button onClick={() => handleConnect("GoogleFit")}>
            Connect Google Fit
          </button>
          <button onClick={() => handleConnect("AppleHealth")}>
            Connect Apple Health
          </button>
          <button onClick={() => handleConnect("Fitbit")}>
            Connect Fitbit
          </button>
        </div>
      </section>

      <section className="status-panel">
        <h2>Connected Devices</h2>
        {integrations.length === 0 ? (
          <p>No devices connected.</p>
        ) : (
          <table className="phr-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Status</th>
                <th>Last Synced</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((int) => (
                <tr key={int._id}>
                  <td>{int.provider}</td>
                  <td>
                    <span
                      className={`status-badge status-${int.status.toLowerCase()}`}
                    >
                      {int.status}
                    </span>
                  </td>
                  <td>
                    {int.lastSyncAt
                      ? new Date(int.lastSyncAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleSync(int._id)}
                      disabled={int.status !== "Active"}
                    >
                      Sync Now
                    </button>
                    <button
                      onClick={() => handleDisconnect(int._id)}
                      className="disconnect-btn"
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="vitals-dashboard">
        <h2>Recent Vitals</h2>
        {(() => {
          const vitalsArray = Array.isArray(vitals)
            ? vitals
            : normalizeVitals(vitals);
          if (!Array.isArray(vitalsArray) || vitalsArray.length === 0) {
            return <p>No vitals synced yet.</p>;
          }
          return (
            <table className="phr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {vitalsArray.map((vital, idx) => (
                  <tr
                    key={
                      vital?._id ||
                      vital?.id ||
                      `${vital?.vitalType || vital?.type}-${
                        vital?.recordedAt || vital?.date || idx
                      }`
                    }
                  >
                    <td>
                      {new Date(
                        vital?.recordedAt || vital?.date || Date.now()
                      ).toLocaleString()}
                    </td>
                    <td>{vital?.vitalType || vital?.type || ""}</td>
                    <td>{`${formatValue(
                      vital?.value ?? vital?.reading ?? vital?.measurement
                    )} ${vital?.unit || vital?.units || ""}`}</td>
                    <td>{vital?.source || vital?.provider || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </section>
    </div>
  );
}
