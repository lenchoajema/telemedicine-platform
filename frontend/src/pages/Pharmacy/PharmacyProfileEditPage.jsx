import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";

export default function PharmacyProfileEditPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get("/pharmacy/me");
        if (!mounted) return;
        const p = res.data?.data || {};
        setForm({
          name: p.name || "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          country: p.country || "",
          phone: p.phone || "",
        });
      } catch (e) {
        if (!mounted) return;
        if (e?.response?.status === 404) {
          setError("No pharmacy profile found. Please register first.");
        } else {
          setError(e?.response?.data?.message || e.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      setError(null);
      await apiClient.put("/pharmacy/me", form);
      setMessage("Profile updated successfully.");
      setTimeout(() => navigate("/pharmacy/portal"), 800);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Edit Pharmacy Profile</h1>
        <div className="actions">
          <Link className="btn" to="/pharmacy/portal">
            Back to Portal
          </Link>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && (
        <div>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).includes("register") && (
            <Link className="btn" to="/pharmacy/portal">
              Go to Portal to Register
            </Link>
          )}
        </div>
      )}

      {!loading && !error && (
        <form onSubmit={onSave} className="form">
          <div className="form-row">
            <label>Name</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>
          <div className="form-row">
            <label>Address</label>
            <input name="address" value={form.address} onChange={onChange} />
          </div>
          <div className="form-row">
            <label>City</label>
            <input name="city" value={form.city} onChange={onChange} />
          </div>
          <div className="form-row">
            <label>State</label>
            <input name="state" value={form.state} onChange={onChange} />
          </div>
          <div className="form-row">
            <label>Country</label>
            <input name="country" value={form.country} onChange={onChange} />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </form>
      )}
    </div>
  );
}
