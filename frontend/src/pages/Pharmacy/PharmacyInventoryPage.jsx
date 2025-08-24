import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [addForm, setAddForm] = useState({
    sku: "",
    unitPrice: "",
    qtyOnHand: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get(
          "/pharmacy/inventory?page=1&pageSize=50&sort=-updatedAt"
        );
        if (!mounted) return;
        setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Pharmacy Inventory</h1>
      </div>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no pharmacy profile") && (
            <div style={{ marginTop: 8 }}>
              <p>Please register your pharmacy profile first.</p>
              <Link className="btn" to="/pharmacy/portal">
                Go to Pharmacy Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {!loading && items.length === 0 && <p>No inventory yet.</p>}

      {/* Quick add inventory */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Add Inventory</h3>
        <p style={{ marginTop: -8, color: "#666" }}>
          Provide at least SKU, Unit Price, and Quantity.
        </p>
        <div
          className="form"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
            gap: 8,
          }}
        >
          <label>
            SKU
            <input
              value={addForm.sku}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, sku: e.target.value }))
              }
              placeholder="e.g. AMOX-500"
            />
          </label>
          <label>
            Unit Price
            <input
              type="number"
              value={addForm.unitPrice}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, unitPrice: e.target.value }))
              }
              placeholder="10"
            />
          </label>
          <label>
            Qty On Hand
            <input
              type="number"
              value={addForm.qtyOnHand}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, qtyOnHand: e.target.value }))
              }
              placeholder="100"
            />
          </label>
          <div style={{ alignSelf: "end" }}>
            <button
              className="btn"
              disabled={adding}
              onClick={async () => {
                try {
                  setAdding(true);
                  setAddErr("");
                  const payload = {
                    sku: addForm.sku || undefined,
                    unitPrice: addForm.unitPrice
                      ? Number(addForm.unitPrice)
                      : undefined,
                    qtyOnHand: addForm.qtyOnHand
                      ? Number(addForm.qtyOnHand)
                      : undefined,
                  };
                  await apiClient.post("/pharmacy/inventory", [payload]);
                  // reload list
                  const res = await apiClient.get(
                    "/pharmacy/inventory?page=1&pageSize=50&sort=-updatedAt"
                  );
                  setItems(Array.isArray(res.data?.data) ? res.data.data : []);
                  setAddForm({ sku: "", unitPrice: "", qtyOnHand: "" });
                } catch (e) {
                  setAddErr(e?.response?.data?.message || e.message);
                } finally {
                  setAdding(false);
                }
              }}
            >
              {" "}
              {adding ? "Adding…" : "Add"}{" "}
            </button>
            {addErr && (
              <div style={{ color: "crimson", marginTop: 6 }}>{addErr}</div>
            )}
          </div>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Drug</th>
            <th>Unit Price</th>
            <th>Qty On Hand</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td>{it.sku || "-"}</td>
              <td>{String(it.drugId || "").slice(-6)}</td>
              <td>{it.unitPrice != null ? it.unitPrice : "-"}</td>
              <td>{it.qtyOnHand != null ? it.qtyOnHand : "-"}</td>
              <td>
                {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
