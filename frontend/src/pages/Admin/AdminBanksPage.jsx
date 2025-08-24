import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/apiClient";
import { useSearchParams } from "react-router-dom";

export default function AdminBanksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [country, setCountry] = useState("ET");
  const [provider, setProvider] = useState("paystack");
  const [search, setSearch] = useState("");
  const [banks, setBanks] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  // Logs
  const tabFromUrl = useMemo(
    () => searchParams.get("tab") || "banks",
    [searchParams]
  );
  const [tab, setTab] = useState(tabFromUrl);
  const [logs, setLogs] = useState([]);
  const [logCursor, setLogCursor] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

  const loadBanks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/banks", {
        params: {
          country,
          search: search || undefined,
          channel: "bank_transfer",
        },
      });
      setBanks(res?.data?.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to load banks");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const syncProvider = async () => {
    try {
      setLoading(true);
      await apiClient.post(`/banks/sync/${provider}`, null, {
        params: { country },
      });
      await loadBanks();
      setMsg(`Synced ${provider.toUpperCase()} for ${country}`);
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Sync failed");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep tab in sync with URL and side effects
  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    // Auto-load logs when switching to logs tab
    if (tab === "logs" && logs.length === 0 && !logLoading) {
      loadLogs(true);
    }
    // Reflect tab in URL
    const next = new URLSearchParams(searchParams);
    if (next.get("tab") !== tab) {
      next.set("tab", tab);
      setSearchParams(next, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadLogs = async (reset = false) => {
    try {
      setLogLoading(true);
      const res = await apiClient.get("/banks/logs", {
        params: {
          provider,
          country,
          from: logFrom || undefined,
          to: logTo || undefined,
          cursor: reset ? undefined : logCursor || undefined,
          limit: 20,
        },
      });
      const items = res?.data?.items || [];
      setLogs((prev) => (reset ? items : [...prev, ...items]));
      setLogCursor(res?.data?.nextCursor || null);
    } catch (e) {
      // slient error toast
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h2>Admin Bank Registry</h2>
      {msg && (
        <div
          className={`save-message ${
            msg.includes("fail") || msg.includes("Fail") ? "error" : "success"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label>Country</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-group">
          <label>Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="paystack">Paystack</option>
            <option value="flutterwave">Flutterwave</option>
            <option value="dpo">DPO</option>
            <option value="cellulant">Cellulant</option>
            <option value="chapa">Chapa</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tab</label>
          <select value={tab} onChange={(e) => setTab(e.target.value)}>
            <option value="banks">Banks</option>
            <option value="logs">Change Log</option>
          </select>
        </div>
        <div className="form-group" style={{ alignSelf: "end" }}>
          <button
            className="save-button"
            onClick={syncProvider}
            disabled={loading}
          >
            {loading ? "Syncing..." : "Sync Provider"}
          </button>
        </div>
        <div className="form-group">
          <label>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="form-group" style={{ alignSelf: "end" }}>
          <button
            className="save-button"
            onClick={loadBanks}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load Banks"}
          </button>
        </div>
      </div>

      {tab === "banks" ? (
        <>
          <h3 style={{ marginTop: 16 }}>Banks</h3>
          {banks.length === 0 ? (
            <p>No banks found</p>
          ) : (
            <ul>
              {banks.map((b) => (
                <li key={b._id}>
                  {b.name} ({b.countryIso2}) • Status: {b.status}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <h3 style={{ marginTop: 16 }}>Change Log</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>From</label>
              <input
                type="date"
                value={logFrom}
                onChange={(e) => setLogFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>To</label>
              <input
                type="date"
                value={logTo}
                onChange={(e) => setLogTo(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ alignSelf: "end" }}>
              <button
                className="save-button"
                disabled={logLoading}
                onClick={() => loadLogs(true)}
              >
                {logLoading ? "Loading..." : "Load Logs"}
              </button>
            </div>
          </div>
          {logs.length === 0 ? (
            <p>No logs</p>
          ) : (
            <>
              <ul>
                {logs.map((l) => (
                  <li key={l._id}>
                    {l.provider} {l.countryIso2 || ""} • added {l.added} •
                    updated {l.updated} • finished{" "}
                    {l.finishedAt
                      ? new Date(l.finishedAt).toLocaleString()
                      : "—"}
                  </li>
                ))}
              </ul>
              {logCursor && (
                <button
                  className="save-button"
                  disabled={logLoading}
                  onClick={() => loadLogs(false)}
                >
                  {logLoading ? "Loading..." : "Load More"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
