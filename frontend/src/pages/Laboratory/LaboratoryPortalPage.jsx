import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useEffect, useState } from "react";

export default function LaboratoryPortalPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/laboratory/me");
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
        <h1>Laboratory Portal</h1>
        <div className="actions">
          <Link className="btn" to="/laboratory/catalog">
            Catalog
          </Link>
          <Link className="btn" to="/laboratory/orders">
            Orders
          </Link>
          <Link className="btn" to="/laboratory/profile/edit">
            Update Profile
          </Link>
        </div>
      </div>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="card" style={{ borderColor: "crimson" }}>
          <p style={{ color: "crimson" }}>{String(error)}</p>
          {String(error).toLowerCase().includes("no laboratory profile") && (
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
            <Link className="btn" to="/laboratory/profile/edit">
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
      await apiClient.post("/laboratory/register", { name: "My Laboratory" });
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
        {busy ? "Registering…" : "Register Laboratory"}
      </button>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
