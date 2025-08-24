import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import PharmacyInventoryPage from "../Pharmacy/PharmacyInventoryPage";
import PharmacyOrdersPage from "../Pharmacy/PharmacyOrdersPage";
import LaboratoryCatalogPage from "../Laboratory/LaboratoryCatalogPage";
import LaboratoryOrdersPage from "../Laboratory/LaboratoryOrdersPage";

const SEED = {
  countries: ["KE", "NG", "ET", "ZA", "GH"],
  technologies: ["PCR", "ELISA", "Chem Analyzer", "Hematology", "Immunoassay"],
  turnaround: ["6h", "12h", "24h", "2-3 days"],
  drugs: [
    { id: 101, name: "Amoxicillin 500mg cap" },
    { id: 102, name: "Paracetamol 500mg tab" },
    { id: 103, name: "Metformin 500mg tab" },
  ],
};

export default function PortalsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [params, setParams] = useSearchParams();
  const roleDefaultTab =
    role === "pharmacist"
      ? "Pharmacy"
      : role === "laboratory"
      ? "Laboratory"
      : "Discovery";
  const allowedTopTabs =
    role === "pharmacist"
      ? ["Pharmacy", "Discovery"]
      : role === "laboratory"
      ? ["Laboratory", "Discovery"]
      : ["Discovery"]; // admin or others
  const mainParam = params.get("tab");
  const mainTab = allowedTopTabs.includes(mainParam || "")
    ? mainParam
    : roleDefaultTab;
  const setMainTab = (t) => {
    params.set("tab", t);
    if (t === "Pharmacy") params.set("sub", "Profile");
    if (t === "Laboratory") params.set("sub", "Profile");
    if (t === "Discovery") params.set("sub", "Pharmacy Finder");
    setParams(params, { replace: true });
  };
  const sub =
    params.get("sub") ||
    (mainTab === "Pharmacy"
      ? "Profile"
      : mainTab === "Laboratory"
      ? "Profile"
      : "Pharmacy Finder");
  const setSub = (s) => {
    params.set("sub", s);
    setParams(params, { replace: true });
  };

  // Ensure URL reflects allowed tab if a disallowed one was provided
  useEffect(() => {
    if (!allowedTopTabs.includes(mainTab)) {
      params.set("tab", roleDefaultTab);
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Portals</h1>
        <div className="actions">
          {allowedTopTabs.includes("Pharmacy") && (
            <TabButton
              active={mainTab === "Pharmacy"}
              onClick={() => setMainTab("Pharmacy")}
            >
              Pharmacy
            </TabButton>
          )}
          {allowedTopTabs.includes("Laboratory") && (
            <TabButton
              active={mainTab === "Laboratory"}
              onClick={() => setMainTab("Laboratory")}
            >
              Laboratory
            </TabButton>
          )}
          {allowedTopTabs.includes("Discovery") && (
            <TabButton
              active={mainTab === "Discovery"}
              onClick={() => setMainTab("Discovery")}
            >
              Discovery
            </TabButton>
          )}
        </div>
      </div>

      {mainTab === "Pharmacy" && role === "pharmacist" && (
        <Section
          subTabs={["Profile", "Inventory", "Orders", "Reports"]}
          current={sub}
          onChange={setSub}
        >
          {sub === "Profile" && <PharmacyProfilePanel />}
          {sub === "Inventory" && <PharmacyInventoryPage />}
          {sub === "Orders" && <PharmacyOrdersPage />}
          {sub === "Reports" && <PharmacyReportsPanel />}
        </Section>
      )}
      {mainTab === "Pharmacy" && role !== "pharmacist" && (
        <AccessDeniedCard portalName="Pharmacy" allowedRole="pharmacist" />
      )}

      {mainTab === "Laboratory" && role === "laboratory" && (
        <Section
          subTabs={["Profile", "Test Catalog", "Orders", "Results"]}
          current={sub}
          onChange={setSub}
        >
          {sub === "Profile" && <LaboratoryProfilePanel />}
          {sub === "Test Catalog" && <LaboratoryCatalogPage />}
          {sub === "Orders" && <LaboratoryOrdersPage />}
          {sub === "Results" && <LaboratoryOrdersPage />}
        </Section>
      )}
      {mainTab === "Laboratory" && role !== "laboratory" && (
        <AccessDeniedCard portalName="Laboratory" allowedRole="laboratory" />
      )}

      {mainTab === "Discovery" && (
        <Section
          subTabs={["Pharmacy Finder", "Lab Finder", "Order Threads"]}
          current={sub}
          onChange={setSub}
        >
          {sub === "Pharmacy Finder" && <PharmacyFinder />}
          {sub === "Lab Finder" && <LabFinder />}
          {sub === "Order Threads" && (
            <div>
              <p>Open contextual chat for orders.</p>
              <Link className="btn" to="/chat">
                Open Chat
              </Link>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      className="btn"
      style={{
        background: active ? "#2563eb" : undefined,
        color: active ? "#fff" : undefined,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Section({ subTabs, current, onChange, children }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {subTabs.map((s) => (
          <TabButton key={s} active={current === s} onClick={() => onChange(s)}>
            {s}
          </TabButton>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PharmacyProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "KE",
    phone: "",
  });

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/pharmacy/me");
        if (!m) return;
        const p = res.data?.data || {};
        setForm({
          name: p.name || "",
          address: p.address || "",
          city: p.city || "",
          country: p.country || "KE",
          phone: p.phone || "",
        });
      } catch (e) {
        if (!m) return;
        if (e?.response?.status === 404) setError("No pharmacy profile");
        else setError(e?.response?.data?.message || e.message);
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg("");
      setError("");
      if (!/^\+[0-9\-\s]{6,}$/.test(form.phone || "")) {
        setError("Phone should be E.164 (e.g. +254712345678)");
        return;
      }
      await apiClient.put("/pharmacy/me", form);
      setMsg("Saved");
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message);
    }
  };

  const register = async () => {
    try {
      await apiClient.post("/pharmacy/register", {
        name: form.name || "My Pharmacy",
      });
      setError("");
      setMsg("Registered. You can now save full details.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="card">
      <h3>Pharmacy Profile</h3>
      {loading && <p>Loading…</p>}
      {error && (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          {error}{" "}
          {error.includes("No pharmacy profile") && (
            <button
              className="btn"
              onClick={register}
              style={{ marginLeft: 8 }}
            >
              Register
            </button>
          )}
        </div>
      )}
      <form
        onSubmit={save}
        className="form"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
          gap: 8,
        }}
      >
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+254..."
          />
        </label>
        <label>
          Address
          <input
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </label>
        <label>
          City
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </label>
        <label>
          Country
          <select
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
          >
            {SEED.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit">
            Save
          </button>
          {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
        </div>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link className="btn" to="/pharmacy/profile/edit">
          Open Full Profile Editor
        </Link>
      </div>
    </div>
  );
}

function PharmacyReportsPanel() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await apiClient.get(
          "/pharmacy/inventory?page=1&pageSize=200&sort=-updatedAt"
        );
        if (!m) return;
        setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        /* noop */
      }
    })();
    return () => {
      m = false;
    };
  }, []);
  const lowStock = items
    .filter(
      (it) =>
        typeof it.reorderLevel === "number" &&
        typeof it.qtyOnHand === "number" &&
        it.qtyOnHand <= it.reorderLevel
    )
    .slice(0, 10);
  const soonExpiring = items
    .filter(
      (it) =>
        it.expiryDate &&
        new Date(it.expiryDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000
    )
    .slice(0, 10);
  return (
    <div
      className="grid-2"
      style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
    >
      <div className="card">
        <h3>Low Stock</h3>
        {lowStock.length === 0 ? (
          <p>None</p>
        ) : (
          lowStock.map((it) => (
            <div key={it._id}>
              {it.sku || String(it.drugId).slice(-6)} — {it.qtyOnHand}
            </div>
          ))
        )}
      </div>
      <div className="card">
        <h3>Expiring Soon</h3>
        {soonExpiring.length === 0 ? (
          <p>None</p>
        ) : (
          soonExpiring.map((it) => (
            <div key={it._id}>
              {it.sku || String(it.drugId).slice(-6)} —{" "}
              {new Date(it.expiryDate).toLocaleDateString()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LaboratoryProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "KE",
    phone: "",
  });

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/laboratory/me");
        if (!m) return;
        const p = res.data?.data || {};
        setForm({
          name: p.name || "",
          address: p.address || "",
          city: p.city || "",
          country: p.country || "KE",
          phone: p.phone || "",
        });
      } catch (e) {
        if (!m) return;
        if (e?.response?.status === 404) setError("No laboratory profile");
        else setError(e?.response?.data?.message || e.message);
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      setMsg("");
      setError("");
      if (!/^\+[0-9\-\s]{6,}$/.test(form.phone || "")) {
        setError("Phone should be E.164 (e.g. +254712345678)");
        return;
      }
      await apiClient.put("/laboratory/me", form);
      setMsg("Saved");
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message);
    }
  };

  const register = async () => {
    try {
      await apiClient.post("/laboratory/register", {
        name: form.name || "My Laboratory",
      });
      setError("");
      setMsg("Registered. You can now save full details.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="card">
      <h3>Laboratory Profile</h3>
      {loading && <p>Loading…</p>}
      {error && (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          {error}{" "}
          {error.includes("No laboratory profile") && (
            <button
              className="btn"
              onClick={register}
              style={{ marginLeft: 8 }}
            >
              Register
            </button>
          )}
        </div>
      )}
      <form
        onSubmit={save}
        className="form"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
          gap: 8,
        }}
      >
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+254..."
          />
        </label>
        <label>
          Address
          <input
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </label>
        <label>
          City
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </label>
        <label>
          Country
          <select
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
          >
            {SEED.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit">
            Save
          </button>
          {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
        </div>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link className="btn" to="/laboratory/profile/edit">
          Open Full Profile Editor
        </Link>
      </div>
    </div>
  );
}

function PharmacyFinder() {
  const [filters, setFilters] = useState({
    country: "KE",
    query: "",
    drugId: 101,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/discovery/pharmacies?query=${encodeURIComponent(
            filters.query
          )}&page=1`
        );
        setRows(res.data?.data || []);
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [filters.query, filters.country, filters.drugId]);
  return (
    <div>
      <div
        className="form"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}
      >
        <label>
          Country
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((f) => ({ ...f, country: e.target.value }))
            }
          >
            {SEED.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Drug
          <select
            value={filters.drugId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, drugId: Number(e.target.value) }))
            }
          >
            {SEED.drugs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            placeholder="Search pharmacies…"
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
          />
        </label>
      </div>
      {loading && <p>Loading…</p>}
      <div className="table-like">
        {rows.map((r) => (
          <div key={r._id} className="card" style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{r.name}</strong>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {r.city || ""} {r.country || ""}
                </div>
              </div>
              <div>
                <span className="badge">Verified</span>
                <button
                  className="btn"
                  style={{ marginLeft: 8 }}
                  title="Requires an existing prescription context"
                >
                  Route Rx
                </button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !loading && <p>No results.</p>}
      </div>
    </div>
  );
}

function LabFinder() {
  const [filters, setFilters] = useState({
    country: "KE",
    query: "",
    technology: "PCR",
    tat: "24h",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/discovery/labs?query=${encodeURIComponent(filters.query)}&page=1`
        );
        setRows(res.data?.data || []);
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [filters.query, filters.country, filters.technology, filters.tat]);
  return (
    <div>
      <div
        className="form"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}
      >
        <label>
          Country
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((f) => ({ ...f, country: e.target.value }))
            }
          >
            {SEED.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Technology
          <select
            value={filters.technology}
            onChange={(e) =>
              setFilters((f) => ({ ...f, technology: e.target.value }))
            }
          >
            {SEED.technologies.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          TAT
          <select
            value={filters.tat}
            onChange={(e) => setFilters((f) => ({ ...f, tat: e.target.value }))}
          >
            {SEED.turnaround.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            placeholder="Search labs…"
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
          />
        </label>
      </div>
      {loading && <p>Loading…</p>}
      <div className="table-like">
        {rows.map((r) => (
          <div key={r._id} className="card" style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{r.name}</strong>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {r.city || ""} {r.country || ""}
                </div>
              </div>
              <div>
                <span className="badge">Verified</span>
                <button
                  className="btn"
                  style={{ marginLeft: 8 }}
                  title="Requires an order context"
                >
                  Order to this lab
                </button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !loading && <p>No results.</p>}
      </div>
    </div>
  );
}

function AccessDeniedCard({ portalName, allowedRole }) {
  return (
    <div className="card" style={{ borderColor: "#ef4444" }}>
      <h3>{portalName} portal</h3>
      <p style={{ color: "#b91c1c" }}>
        You don’t have permission to access the {portalName} portal with your
        account. This section is only available to the “{allowedRole}” role.
      </p>
      <p>
        If you need access, contact an administrator, or switch to the Discovery
        tab to explore public information.
      </p>
    </div>
  );
}
