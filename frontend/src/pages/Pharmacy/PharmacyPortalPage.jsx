import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useEffect, useState } from "react";

export default function PharmacyPortalPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/pharmacy/me");
        if (!mounted) return;
        setProfile(res.data?.data || null);
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
        <h1>Pharmacy Portal</h1>
        <div className="actions">
          <Link className="btn" to="/pharmacy/inventory">
            Inventory
          </Link>
          <Link className="btn" to="/pharmacy/orders">
            Orders
          </Link>
          <Link className="btn" to="/pharmacy/profile/edit">
            Update Profile
          </Link>
        </div>
      </div>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no pharmacy profile") && (
            <RegisterButton />
          )}
        </div>
      )}
      {profile ? (
        <div className="card">
          <h3>{profile.name}</h3>
          <p>Status: {profile.verificationStatus}</p>
          <p>
            {profile.address || profile.city || profile.country
              ? `${profile.address || ""} ${profile.city || ""} ${
                  profile.country || ""
                }`
              : "No address set"}
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/pharmacy/profile/edit">
              Edit Profile
            </Link>
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="card">
          <p>No profile yet. Use this button to create one.</p>
          <RegisterButton />
        </div>
      ) : null}

      <div className="analytics-section">
        <h2>Quick Actions</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" to="/pharmacy/inventory">
            View Inventory
          </Link>
          <Link className="btn" to="/pharmacy/orders">
            View Orders
          </Link>
          <Link className="btn" to="/pharmacy/profile/edit">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function RegisterButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const create = async () => {
    try {
      setBusy(true);
      setMsg("");
      await apiClient.post("/pharmacy/register", { name: "My Pharmacy" });
      setMsg("Registered. Refresh the page.");
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <button className="btn" onClick={create} disabled={busy}>
        {busy ? "Registering…" : "Register Pharmacy"}
      </button>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
