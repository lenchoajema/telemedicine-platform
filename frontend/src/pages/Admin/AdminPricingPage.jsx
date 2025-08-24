import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

export default function AdminPricingPage() {
  const [services, setServices] = useState([]);
  const [pricebooks, setPricebooks] = useState([]);
  const [pbCursor, setPbCursor] = useState(null);
  const [plans, setPlans] = useState([]);
  // PriceBook pagination
  const [pbPage, setPbPage] = useState(1);
  const [pbPageSize, setPbPageSize] = useState(10);
  const [pbTotal, setPbTotal] = useState(0);

  const [newService, setNewService] = useState({
    code: "",
    name: "",
    description: "",
    defaultPrice: 0,
    currency: "USD",
    active: true,
  });
  const [newPB, setNewPB] = useState({
    region: "ET",
    payerType: "SelfPay",
    effectiveFrom: "",
    items: [],
  });
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    interval: "month",
    currency: "USD",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  // Filters
  const [serviceQuery, setServiceQuery] = useState("");
  const [pbQuery, setPbQuery] = useState("");
  const filteredServices = services.filter((s) => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.code || "").toLowerCase().includes(q) ||
      (s.name || "").toLowerCase().includes(q)
    );
  });
  const filteredPricebooks = pricebooks.filter((pb) => {
    const q = pbQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (pb.region || "").toLowerCase().includes(q) ||
      (pb.payerType || "").toLowerCase().includes(q)
    );
  });
  // PriceBook metadata edit state
  const [editPBId, setEditPBId] = useState(null);
  const [editPB, setEditPB] = useState({
    region: "",
    payerType: "",
    effectiveFrom: "",
  });
  // Inline edit state
  const [editServiceId, setEditServiceId] = useState(null);
  const [editService, setEditService] = useState({
    name: "",
    description: "",
    defaultPrice: 0,
    currency: "USD",
    active: true,
  });
  const [editPlanId, setEditPlanId] = useState(null);
  const [editPlan, setEditPlan] = useState({
    name: "",
    price: 0,
    interval: "month",
    currency: "USD",
    description: "",
    active: true,
  });
  // PriceBook items editor
  const [selectedPB, setSelectedPB] = useState(null);
  const [pbItemsDraft, setPbItemsDraft] = useState([]);
  const [csvText, setCsvText] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      const [svc, pb, pl] = await Promise.all([
        apiClient.get("/pricing/admin/services"),
        apiClient.get("/pricing/admin/pricebooks", {
          params: { page: pbPage, pageSize: pbPageSize },
        }),
        apiClient.get("/pricing/admin/plans"),
      ]);
      setServices(svc?.data?.items || []);
      setPricebooks(pb?.data?.items || []);
      if (pb?.data) {
        setPbTotal(pb.data.total || 0);
        setPbPage(pb.data.page || 1);
        setPbPageSize(pb.data.pageSize || pbPageSize);
      }
      setPlans(pl?.data?.items || []);
    } catch (e) {
      setMsgType("error");
      setMsg(e?.response?.data?.error || "Failed to load");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pbPage, pbPageSize]);

  const loadMorePricebooks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/pricing/price-books", {
        params: { limit: 20, cursor: pbCursor || undefined },
      });
      const items = res?.data?.items || [];
      setPricebooks((p) => [...p, ...items]);
      setPbCursor(res?.data?.nextCursor || null);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };
  <p style={{ fontSize: 12, color: "#555" }}>
    Tip: Use the button below to append more results using the new cursor-based
    endpoint.
  </p>;

  const createService = async () => {
    try {
      setLoading(true);
      await apiClient.post("/pricing/admin/services", newService);
      setNewService({
        code: "",
        name: "",
        description: "",
        defaultPrice: 0,
        currency: "USD",
        active: true,
      });
      await loadAll();
      setMsg("Service created");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to create service");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const toggleServiceActive = async (id, active) => {
    try {
      setLoading(true);
      await apiClient.patch(`/pricing/admin/services/${id}`, {
        active: !active,
      });
      await loadAll();
    } catch {}
  };
  const deleteService = async (id) => {
    try {
      if (!window.confirm("Delete this service? This cannot be undone."))
        return;
      setLoading(true);
      await apiClient.delete(`/pricing/admin/services/${id}`);
      await loadAll();
    } catch {}
  };
  const startEditService = (s) => {
    setEditServiceId(s._id);
    setEditService({
      name: s.name || "",
      description: s.description || "",
      defaultPrice: s.defaultPrice ?? 0,
      currency: s.currency || "USD",
      active: !!s.active,
    });
  };
  const cancelEditService = () => setEditServiceId(null);
  const saveEditService = async (id) => {
    try {
      setLoading(true);
      await apiClient.patch(`/pricing/admin/services/${id}`, editService);
      await loadAll();
      setEditServiceId(null);
      setMsg("Service updated");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to update service");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const createPricebook = async () => {
    try {
      setLoading(true);
      await apiClient.post("/pricing/admin/pricebooks", newPB);
      setNewPB({
        region: "ET",
        payerType: "SelfPay",
        effectiveFrom: "",
        items: [],
      });
      await loadAll();
      setMsg("Pricebook created");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to create pricebook");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const deletePricebook = async (id) => {
    try {
      if (!window.confirm("Delete this pricebook? This cannot be undone."))
        return;
      setLoading(true);
      await apiClient.delete(`/pricing/admin/pricebooks/${id}`);
      await loadAll();
    } catch {}
  };

  const togglePricebookActive = async (id, active) => {
    try {
      setLoading(true);
      await apiClient.patch(`/pricing/admin/pricebooks/${id}`, {
        active: !active,
      });
      await loadAll();
    } catch {}
  };

  const createPlan = async () => {
    try {
      setLoading(true);
      await apiClient.post("/pricing/admin/plans", newPlan);
      setNewPlan({
        name: "",
        price: 0,
        interval: "month",
        currency: "USD",
        description: "",
      });
      await loadAll();
      setMsg("Plan created");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to create plan");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const togglePlanActive = async (id, active) => {
    try {
      setLoading(true);
      await apiClient.patch(`/pricing/admin/plans/${id}`, { active: !active });
      await loadAll();
    } catch {}
  };
  const deletePlan = async (id) => {
    try {
      if (!window.confirm("Delete this plan? This cannot be undone.")) return;
      setLoading(true);
      await apiClient.delete(`/pricing/admin/plans/${id}`);
      await loadAll();
    } catch {}
  };

  // PriceBook metadata edit handlers
  const startEditPB = (pb) => {
    setEditPBId(pb._id);
    const ef = pb.effectiveFrom ? new Date(pb.effectiveFrom) : null;
    const efStr = ef
      ? `${ef.getFullYear()}-${String(ef.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(ef.getDate()).padStart(2, "0")}`
      : "";
    setEditPB({
      region: pb.region || "",
      payerType: pb.payerType || "",
      effectiveFrom: efStr,
    });
  };
  const cancelEditPB = () => setEditPBId(null);
  const saveEditPB = async (id) => {
    if (!editPB.region || !editPB.payerType) {
      setMsgType("error");
      setMsg("region and payerType are required");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    try {
      setLoading(true);
      const payload = { region: editPB.region, payerType: editPB.payerType };
      if (editPB.effectiveFrom) payload.effectiveFrom = editPB.effectiveFrom;
      await apiClient.patch(`/pricing/admin/pricebooks/${id}`, payload);
      await loadAll();
      setEditPBId(null);
      setMsgType("success");
      setMsg("PriceBook updated");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsgType("error");
      setMsg(e?.response?.data?.error || "Failed to update pricebook");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  const startEditPlan = (p) => {
    setEditPlanId(p._id);
    setEditPlan({
      name: p.name || "",
      price: p.price ?? 0,
      interval: p.interval || "month",
      currency: p.currency || "USD",
      description: p.description || "",
      active: !!p.active,
    });
  };
  const cancelEditPlan = () => setEditPlanId(null);
  const saveEditPlan = async (id) => {
    try {
      setLoading(true);
      await apiClient.patch(`/pricing/admin/plans/${id}`, editPlan);
      await loadAll();
      setEditPlanId(null);
      setMsg("Plan updated");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to update plan");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // PriceBook items editor helpers
  const openPBEditor = (pb) => {
    setSelectedPB(pb);
    setPbItemsDraft((pb.items || []).map((i) => ({ ...i })));
  };
  const closePBEditor = () => {
    setSelectedPB(null);
    setPbItemsDraft([]);
  };
  const addPBItem = () => {
    const firstService = services[0];
    if (!firstService) return;
    setPbItemsDraft((d) => [
      ...d,
      {
        serviceId: firstService._id,
        unitPrice: firstService.defaultPrice || 0,
        taxRate: 0,
        discount: {},
      },
    ]);
  };
  const removePBItem = (idx) => {
    setPbItemsDraft((d) => d.filter((_, i) => i !== idx));
  };
  const updatePBItem = (idx, field, value) => {
    setPbItemsDraft((d) =>
      d.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };
  const savePBItems = async () => {
    if (!selectedPB) return;
    try {
      setLoading(true);
      const items = pbItemsDraft.map((i) => ({
        serviceId: i.serviceId,
        unitPrice: Number(i.unitPrice) || 0,
        taxRate: Number(i.taxRate) || 0,
        discount: i.discount || {},
      }));
      await apiClient.patch(`/pricing/admin/pricebooks/${selectedPB._id}`, {
        items,
      });
      await loadAll();
      setMsg("PriceBook items saved");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to save items");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h2>Admin Pricing Management</h2>
      {msg && (
        <div
          className={`save-message ${
            msgType === "error" ? "error" : "success"
          }`}
        >
          {msg}
        </div>
      )}

      <h3>Services</h3>
      <div className="form-group">
        <input
          placeholder="Search services by code or name..."
          value={serviceQuery}
          onChange={(e) => setServiceQuery(e.target.value)}
        />
      </div>
      <ul>
        {filteredServices.map((s) => (
          <li key={s._id}>
            <div>
              <strong>{s.code}</strong>{" "}
              {editServiceId === s._id ? (
                <>
                  <input
                    style={{ width: 160, marginLeft: 8 }}
                    value={editService.name}
                    onChange={(e) =>
                      setEditService((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                  <input
                    style={{ width: 100, marginLeft: 8 }}
                    type="number"
                    value={editService.defaultPrice}
                    onChange={(e) =>
                      setEditService((p) => ({
                        ...p,
                        defaultPrice: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    style={{ width: 80, marginLeft: 8 }}
                    value={editService.currency}
                    onChange={(e) =>
                      setEditService((p) => ({
                        ...p,
                        currency: e.target.value,
                      }))
                    }
                  />
                  <input
                    style={{ width: 220, marginLeft: 8 }}
                    placeholder="Description"
                    value={editService.description}
                    onChange={(e) =>
                      setEditService((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                  <button
                    style={{ marginLeft: 8 }}
                    className="save-button"
                    onClick={() => saveEditService(s._id)}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button style={{ marginLeft: 8 }} onClick={cancelEditService}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  — {s.name} • {s.currency} {s.defaultPrice} •{" "}
                  {s.active ? "Active" : "Inactive"}
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => toggleServiceActive(s._id, s.active)}
                  >
                    {s.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => startEditService(s)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    className="danger-button"
                    onClick={() => deleteService(s._id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <div className="form-group">
          <label>Code</label>
          <input
            value={newService.code}
            onChange={(e) =>
              setNewService((p) => ({ ...p, code: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            value={newService.name}
            onChange={(e) =>
              setNewService((p) => ({ ...p, name: e.target.value }))
            }
          />
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <input
            value={newService.description}
            onChange={(e) =>
              setNewService((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            value={newService.defaultPrice}
            onChange={(e) =>
              setNewService((p) => ({
                ...p,
                defaultPrice: Number(e.target.value),
              }))
            }
          />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <input
            value={newService.currency}
            onChange={(e) =>
              setNewService((p) => ({ ...p, currency: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Active</label>
          <input
            type="checkbox"
            checked={!!newService.active}
            onChange={(e) =>
              setNewService((p) => ({ ...p, active: e.target.checked }))
            }
          />
        </div>
        <div className="form-group" style={{ alignSelf: "end" }}>
          <button
            className="save-button"
            onClick={createService}
            disabled={loading || !newService.code || !newService.name}
          >
            Create Service
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>PriceBooks</h3>
      <div className="form-group">
        <input
          placeholder="Search pricebooks by region or payer type..."
          value={pbQuery}
          onChange={(e) => setPbQuery(e.target.value)}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span>Page</span>
        <button
          disabled={pbPage <= 1}
          onClick={() => setPbPage((p) => Math.max(1, p - 1))}
        >
          {"<"}
        </button>
        <span>{pbPage}</span>
        <button
          disabled={pbPage * pbPageSize >= pbTotal}
          onClick={() => setPbPage((p) => p + 1)}
        >
          {">"}
        </button>
        <span style={{ marginLeft: 8 }}>Page Size</span>
        <select
          value={pbPageSize}
          onChange={(e) => {
            setPbPageSize(Number(e.target.value));
            setPbPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span style={{ marginLeft: 8 }}>Total: {pbTotal}</span>
      </div>
      <p style={{ fontSize: 12, color: "#555" }}>
        Tip: Use the button below to append more results using the new
        cursor-based endpoint.
      </p>
      <ul>
        {filteredPricebooks.map((pb) => (
          <li key={pb._id}>
            {editPBId === pb._id ? (
              <>
                <input
                  style={{ width: 90 }}
                  value={editPB.region}
                  onChange={(e) =>
                    setEditPB((p) => ({ ...p, region: e.target.value }))
                  }
                />
                /
                <input
                  style={{ width: 120 }}
                  value={editPB.payerType}
                  onChange={(e) =>
                    setEditPB((p) => ({ ...p, payerType: e.target.value }))
                  }
                />
                <span> • effective: </span>
                <input
                  type="date"
                  value={editPB.effectiveFrom}
                  onChange={(e) =>
                    setEditPB((p) => ({ ...p, effectiveFrom: e.target.value }))
                  }
                />
                <button
                  style={{ marginLeft: 8 }}
                  className="save-button"
                  onClick={() => saveEditPB(pb._id)}
                  disabled={loading}
                >
                  Save
                </button>
                <button style={{ marginLeft: 8 }} onClick={cancelEditPB}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {pb.region}/{pb.payerType} • items: {pb.items?.length || 0} •
                effective:{" "}
                {pb.effectiveFrom
                  ? new Date(pb.effectiveFrom).toLocaleDateString()
                  : "-"}{" "}
                • {pb.active ? "Active" : "Inactive"}
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => togglePricebookActive(pb._id, pb.active)}
                >
                  {pb.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => startEditPB(pb)}
                >
                  Edit
                </button>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => openPBEditor(pb)}
                >
                  Manage Items
                </button>
                <a
                  style={{ marginLeft: 8 }}
                  className="save-button"
                  href={`${
                    apiClient.defaults && apiClient.defaults.baseURL
                      ? apiClient.defaults.baseURL
                      : ""
                  }/pricing/admin/pricebooks/${pb._id}/export`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Export CSV
                </a>
                <button
                  style={{ marginLeft: 8 }}
                  className="danger-button"
                  onClick={() => deletePricebook(pb._id)}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 8 }}>
        <button
          className="save-button"
          onClick={loadMorePricebooks}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more (cursor)"}
        </button>
      </div>
      {selectedPB && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 6,
            marginTop: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>
              Editing PriceBook Items — {selectedPB.region}/
              {selectedPB.payerType}
            </strong>
            <div>
              <button
                className="save-button"
                onClick={savePBItems}
                disabled={loading}
              >
                Save Items
              </button>
              <button style={{ marginLeft: 8 }} onClick={closePBEditor}>
                Close
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {(pbItemsDraft || []).map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <select
                  value={it.serviceId}
                  onChange={(e) =>
                    updatePBItem(idx, "serviceId", e.target.value)
                  }
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
                <input
                  style={{ width: 100 }}
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) =>
                    updatePBItem(idx, "unitPrice", Number(e.target.value))
                  }
                />
                <input
                  style={{ width: 80 }}
                  type="number"
                  value={it.taxRate}
                  onChange={(e) =>
                    updatePBItem(idx, "taxRate", Number(e.target.value))
                  }
                />
                <button
                  className="danger-button"
                  onClick={() => removePBItem(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addPBItem}>Add Item</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>CSV Import</h4>
            <p style={{ margin: 0 }}>Columns: serviceCode,unitPrice,taxRate</p>
            <textarea
              rows={6}
              style={{ width: "100%", fontFamily: "monospace" }}
              placeholder={
                "serviceCode,unitPrice,taxRate\nCONSULT_NEW,25,0\nLAB_CBC,10,0"
              }
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <button
              className="save-button"
              disabled={loading || !csvText.trim()}
              onClick={async () => {
                try {
                  setLoading(true);
                  await apiClient.post(
                    `/pricing/admin/pricebooks/${selectedPB._id}/import`,
                    { csv: csvText }
                  );
                  setCsvText("");
                  await loadAll();
                  setMsg("CSV imported");
                  setMsgType("success");
                  setTimeout(() => setMsg(""), 2000);
                } catch (e) {
                  setMsgType("error");
                  setMsg(e?.response?.data?.error || "Import failed");
                  setTimeout(() => setMsg(""), 3000);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Import CSV
            </button>
          </div>
        </div>
      )}
      <div className="form-grid">
        <div className="form-group">
          <label>Region</label>
          <input
            value={newPB.region}
            onChange={(e) =>
              setNewPB((p) => ({ ...p, region: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Payer Type</label>
          <input
            value={newPB.payerType}
            onChange={(e) =>
              setNewPB((p) => ({ ...p, payerType: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Effective From</label>
          <input
            type="date"
            value={newPB.effectiveFrom}
            onChange={(e) =>
              setNewPB((p) => ({ ...p, effectiveFrom: e.target.value }))
            }
          />
        </div>
        <div className="form-group" style={{ alignSelf: "end" }}>
          <button
            className="save-button"
            onClick={createPricebook}
            disabled={loading || !newPB.region || !newPB.payerType}
          >
            Create Pricebook
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Plans</h3>
      <ul>
        {plans.map((pl) => (
          <li key={pl._id}>
            {editPlanId === pl._id ? (
              <>
                <input
                  style={{ width: 160 }}
                  value={editPlan.name}
                  onChange={(e) =>
                    setEditPlan((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <input
                  style={{ width: 100, marginLeft: 8 }}
                  type="number"
                  value={editPlan.price}
                  onChange={(e) =>
                    setEditPlan((p) => ({
                      ...p,
                      price: Number(e.target.value),
                    }))
                  }
                />
                <select
                  style={{ marginLeft: 8 }}
                  value={editPlan.interval}
                  onChange={(e) =>
                    setEditPlan((p) => ({ ...p, interval: e.target.value }))
                  }
                >
                  <option value="month">month</option>
                  <option value="year">year</option>
                  <option value="quarter">quarter</option>
                </select>
                <input
                  style={{ width: 80, marginLeft: 8 }}
                  value={editPlan.currency}
                  onChange={(e) =>
                    setEditPlan((p) => ({ ...p, currency: e.target.value }))
                  }
                />
                <input
                  style={{ width: 220, marginLeft: 8 }}
                  placeholder="Description"
                  value={editPlan.description}
                  onChange={(e) =>
                    setEditPlan((p) => ({ ...p, description: e.target.value }))
                  }
                />
                <button
                  style={{ marginLeft: 8 }}
                  className="save-button"
                  onClick={() => saveEditPlan(pl._id)}
                  disabled={loading}
                >
                  Save
                </button>
                <button style={{ marginLeft: 8 }} onClick={cancelEditPlan}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {pl.name} • {pl.currency} {pl.price}/{pl.interval} •{" "}
                {pl.active ? "Active" : "Inactive"}
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => togglePlanActive(pl._id, pl.active)}
                >
                  {pl.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => startEditPlan(pl)}
                >
                  Edit
                </button>
                <button
                  style={{ marginLeft: 8 }}
                  className="danger-button"
                  onClick={() => deletePlan(pl._id)}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <div className="form-group">
          <label>Name</label>
          <input
            value={newPlan.name}
            onChange={(e) =>
              setNewPlan((p) => ({ ...p, name: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            value={newPlan.price}
            onChange={(e) =>
              setNewPlan((p) => ({ ...p, price: Number(e.target.value) }))
            }
          />
        </div>
        <div className="form-group">
          <label>Interval</label>
          <select
            value={newPlan.interval}
            onChange={(e) =>
              setNewPlan((p) => ({ ...p, interval: e.target.value }))
            }
          >
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </div>
        <div className="form-group">
          <label>Currency</label>
          <input
            value={newPlan.currency}
            onChange={(e) =>
              setNewPlan((p) => ({ ...p, currency: e.target.value }))
            }
          />
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <input
            value={newPlan.description}
            onChange={(e) =>
              setNewPlan((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
        <div className="form-group" style={{ alignSelf: "end" }}>
          <button
            className="save-button"
            onClick={createPlan}
            disabled={loading || !newPlan.name}
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}
