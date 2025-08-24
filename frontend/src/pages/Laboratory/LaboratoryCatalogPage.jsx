import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";

export default function LaboratoryCatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [addForm, setAddForm] = useState({
    testCode: "",
    testName: "",
    price: "",
    technology: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get(
          "/laboratory/catalog?page=1&pageSize=50&sort=-updatedAt"
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
        <h1>Lab Test Catalog</h1>
      </div>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no laboratory profile") && (
            <div style={{ marginTop: 8 }}>
              <p>Please register your laboratory profile first.</p>
              <Link className="btn" to="/laboratory/portal">
                Go to Laboratory Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {!loading && items.length === 0 && <p>No catalog items yet.</p>}

      {/* Quick add test */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Add Test</h3>
        <div
          className="form"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
            gap: 8,
          }}
        >
          <label>
            Code
            <input
              value={addForm.testCode}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, testCode: e.target.value }))
              }
              placeholder="HB1AC"
            />
          </label>
          <label>
            Name
            <input
              value={addForm.testName}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, testName: e.target.value }))
              }
              placeholder="Hemoglobin A1c"
            />
          </label>
          <label>
            Technology
            <input
              value={addForm.technology}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, technology: e.target.value }))
              }
              placeholder="ELISA"
            />
          </label>
          <label>
            Price
            <input
              type="number"
              value={addForm.price}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="250"
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
                    testCode: addForm.testCode || undefined,
                    testName: addForm.testName || undefined,
                    price: addForm.price ? Number(addForm.price) : undefined,
                    technology: addForm.technology || undefined,
                  };
                  await apiClient.post("/laboratory/catalog", [payload]);
                  const res = await apiClient.get(
                    "/laboratory/catalog?page=1&pageSize=50&sort=-updatedAt"
                  );
                  setItems(Array.isArray(res.data?.data) ? res.data.data : []);
                  setAddForm({
                    testCode: "",
                    testName: "",
                    price: "",
                    technology: "",
                  });
                } catch (e) {
                  setAddErr(e?.response?.data?.message || e.message);
                } finally {
                  setAdding(false);
                }
              }}
            >
              {adding ? "Adding…" : "Add"}
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
            <th>Code</th>
            <th>Name</th>
            <th>Technology</th>
            <th>Price</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td>{it.testCode}</td>
              <td>{it.testName}</td>
              <td>{it.technology}</td>
              <td>{it.price != null ? it.price : "-"}</td>
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
