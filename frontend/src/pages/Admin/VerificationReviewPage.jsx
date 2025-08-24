import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // This import should now work
import { useNotifications } from "../../contexts/NotificationContextCore";
import VerificationStatus from "../../components/doctors/VerificationStatus";
import "./VerificationReviewPage.css";

export default function VerificationReviewPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { doctorId } = useParams();

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null); // { type, fileUrl }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null); // object URL when we successfully fetch binary

  // Inject styles & add ESC key close when a preview document is active
  useEffect(() => {
    if (!previewDoc) return; // Only run when opening the preview

    // Inline styles (guarded so we don't duplicate if CSS file missing / not loaded yet)
    const STYLE_ID = "doc-preview-inline-styles";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.innerHTML = `
        .doc-preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 2rem; }
        .doc-preview-modal { background: #fff; max-width: 92vw; max-height: 92vh; width: min(1000px,100%); height: min(900px,100%); display: flex; flex-direction: column; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid #d0d0d0; }
        .preview-header { display: flex; align-items: center; justify-content: space-between; padding: .65rem 1rem; border-bottom: 1px solid #e2e2e2; background: linear-gradient(#fdfdfd,#f3f4f6); }
        .preview-body { position: relative; flex: 1; overflow: hidden; background: #1e1e1e; display: flex; align-items: center; justify-content: center; }
        .preview-image { max-width: 100%; max-height: 100%; object-fit: contain; background: #222; }
        .preview-pdf { width: 100%; height: 100%; border: 0; background: #fff; }
        .btn-close { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; line-height: 1; }
        .btn-close:focus { outline: 2px solid #4c8bf5; outline-offset: 2px; }
        .preview-generic { padding: 2rem; text-align: center; color: #fff; }
        .preview-loading { position: absolute; inset: 0; display: flex; flex-direction: column; gap: .75rem; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); color: #fff; font-size: .95rem; letter-spacing: .3px; }
        .spinner { width: 46px; height: 46px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .preview-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; color: #b00020; padding: 2rem; text-align: center; }
        .preview-error a { color: #1a56d6; text-decoration: underline; }
        @media (max-width: 600px) { .doc-preview-modal { width: 96vw; height: 92vh; } .preview-image { max-height: 100%; } }
      `;
      document.head.appendChild(style);
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setPreviewDoc(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewDoc]);

  // Timeout for long-loading documents (e.g., blocked PDF); after 12s show error fallback
  useEffect(() => {
    if (!previewDoc || !previewLoading) return;
    const t = setTimeout(() => {
      if (previewLoading) {
        setPreviewError("Timed out loading document");
        setPreviewLoading(false);
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [previewDoc, previewLoading]);

  // Prefetch image (and optionally pdf) to detect early failures & create blob URL (helps with certain path / CORS mis-resolutions)
  useEffect(() => {
    if (!previewDoc) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }
    // Only prefetch images (PDF shown via direct URL to allow native viewer controls)
    const url = previewDoc.fileUrl;
    if (!url || !isImageType(url)) return;
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (aborted) return;
        const objectUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
        // If still loading set loading false (image onLoad might not fire if we swap src before mount)
        setPreviewLoading(false);
      } catch (err) {
        if (aborted) return;
        // Keep existing error if already set, else set fetch failure
        setPreviewError((prev) => prev || "Failed to load image");
        setPreviewLoading(false);
      }
    })();
    return () => {
      aborted = true;
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewDoc]);

  // Fetch all pending verifications
  useEffect(() => {
    let active = true;
    const fetchPendingVerifications = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/verifications/pending`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (active) setPendingList(data);
        }
      } catch (error) {
        console.error("Error fetching pending verifications:", error);
      }
    };
    fetchPendingVerifications();
    // Light polling every 30s so new doctor appears without reload (can be optimized to websockets later)
    const id = setInterval(fetchPendingVerifications, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const manualRefresh = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/verifications/pending`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPendingList(data);
        addNotification("Pending verifications refreshed", "info");
      }
    } catch (e) {
      console.error("Manual refresh failed", e);
      addNotification("Refresh failed", "error");
    }
  };

  // Fetch specific entity details if ID is provided
  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const fetchEntityDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/verifications/${doctorId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setEntity(data);
        } else {
          addNotification("Failed to fetch verification details", "error");
        }
      } catch (error) {
        console.error("Error fetching verification details:", error);
        addNotification("Error fetching verification details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEntityDetails();
  }, [doctorId, addNotification]);

  const handleApprove = async () => {
    await updateVerificationStatus("approve");
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      addNotification("Please provide rejection reason in the notes", "error");
      return;
    }
    await updateVerificationStatus("reject");
  };

  const updateVerificationStatus = async (action) => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/admin/verifications/${doctorId}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        addNotification(
          `Verification ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
          "success"
        );

        // Remove from pending list
        setPendingList(pendingList.filter((item) => item._id !== doctorId));

        // Redirect to pending list
        navigate("/admin/verifications");
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} verification`);
      }
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      addNotification(
        error.message || `Error ${action}ing verification`,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="verification-review-page">
        <div className="unauthorized-message">
          <h2>Unauthorized Access</h2>
          <p>You must be an admin to view this page.</p>
          <Link to="/" className="btn-back">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="verification-review-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="verification-review-page">
      <div className="verification-review-container">
        <h1>Verification Review</h1>

        {!doctorId ? (
          <div className="pending-verifications-list">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Pending Verifications</h2>
              <button
                className="btn-view-details"
                onClick={manualRefresh}
                style={{ padding: "0.4rem 0.75rem" }}
              >
                Refresh
              </button>
            </div>
            {pendingList.length === 0 ? (
              <p className="no-items">No pending verification requests</p>
            ) : (
              <ul className="pending-list">
                {pendingList.map((item) => {
                  const type = item.entityType || "doctor";
                  const name =
                    type === "doctor"
                      ? `Dr. ${item.user?.profile?.firstName || ""} ${
                          item.user?.profile?.lastName || ""
                        }`.trim()
                      : item.name || `${type} entity`;
                  return (
                    <li key={item._id} className="pending-list-item">
                      <div className="doctor-basic-info">
                        <h3>{name}</h3>
                        <p style={{ textTransform: "capitalize" }}>{type}</p>
                        {type === "doctor" && <p>{item.specialization}</p>}
                        <p className="submitted-date">
                          Submitted:{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/admin/verifications/${item._id}`}
                        className="btn-view-details"
                      >
                        Review
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          entity && (
            <div className="doctor-verification-details">
              <div className="verification-header">
                <div className="doctor-info">
                  <h2>
                    {entity.entityType === "doctor"
                      ? `Dr. ${entity.user?.profile?.firstName || ""} ${
                          entity.user?.profile?.lastName || ""
                        }`
                      : entity.name}
                  </h2>
                  {entity.entityType === "doctor" && (
                    <p className="doctor-email">{entity.user?.email}</p>
                  )}
                  <VerificationStatus status={entity.verificationStatus} />
                </div>
                <Link to="/admin/verifications" className="btn-back">
                  Back to List
                </Link>
              </div>
              {entity.entityType === "doctor" && (
                <div className="detail-section">
                  <h3>Professional Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Specialization</span>
                      <span className="detail-value">
                        {entity.specialization}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">License Number</span>
                      <span className="detail-value">
                        {entity.licenseNumber}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {entity.entityType !== "doctor" && (
                <div className="detail-section">
                  <h3>Profile Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{entity.name}</span>
                    </div>
                    {entity.address && (
                      <div className="detail-item">
                        <span className="detail-label">Address</span>
                        <span className="detail-value">{entity.address}</span>
                      </div>
                    )}
                    {entity.city && (
                      <div className="detail-item">
                        <span className="detail-label">City</span>
                        <span className="detail-value">{entity.city}</span>
                      </div>
                    )}
                    {entity.phone && (
                      <div className="detail-item">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{entity.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {entity.entityType === "doctor" && (
                <div className="detail-section">
                  <h3>Education</h3>
                  {entity.education && entity.education.length > 0 ? (
                    <ul className="education-list">
                      {entity.education.map((edu, index) => (
                        <li key={index} className="education-item">
                          <div className="education-degree">{edu.degree}</div>
                          <div className="education-institution">
                            {edu.institution}
                          </div>
                          <div className="education-year">{edu.year}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">
                      No education information provided
                    </p>
                  )}
                </div>
              )}

              {entity.entityType === "doctor" && (
                <div className="detail-section">
                  <h3>Experience</h3>
                  {entity.experience && entity.experience.length > 0 ? (
                    <ul className="experience-list">
                      {entity.experience.map((exp, index) => (
                        <li key={index} className="experience-item">
                          <div className="experience-position">
                            {exp.position}
                          </div>
                          <div className="experience-hospital">
                            {exp.hospital}
                          </div>
                          <div className="experience-period">
                            {exp.startYear} - {exp.endYear}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">
                      No experience information provided
                    </p>
                  )}
                </div>
              )}

              {entity.entityType === "doctor" && (
                <div className="detail-section">
                  <h3>Verification Documents</h3>
                  {entity.verificationDocuments &&
                  entity.verificationDocuments.length > 0 ? (
                    <ul className="document-list">
                      {entity.verificationDocuments.map((doc, index) => (
                        <li key={index} className="document-item">
                          <div className="document-type">
                            {doc.type.charAt(0).toUpperCase() +
                              doc.type.slice(1)}
                          </div>
                          <button
                            type="button"
                            className="document-link"
                            onClick={() => {
                              setPreviewError(null); // reset
                              setPreviewLoading(true);
                              if (previewBlobUrl) {
                                URL.revokeObjectURL(previewBlobUrl);
                                setPreviewBlobUrl(null);
                              }
                              setPreviewDoc({
                                ...doc,
                                fileUrl: getPreviewUrl(doc.fileUrl),
                                originalUrl: doc.fileUrl,
                              });
                            }}
                          >
                            {isImageType(doc.fileUrl) || isPdfType(doc.fileUrl)
                              ? "Preview"
                              : "View"}
                          </button>
                          <div className="document-date">
                            Uploaded:{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">No documents uploaded</p>
                  )}
                </div>
              )}
              {previewDoc && (
                <div
                  className="doc-preview-overlay"
                  onClick={() => setPreviewDoc(null)}
                >
                  <div
                    className="doc-preview-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="preview-header">
                      <h4>
                        {previewDoc.type.charAt(0).toUpperCase() +
                          previewDoc.type.slice(1)}{" "}
                        Preview
                      </h4>
                      <button
                        className="btn-close"
                        onClick={() => setPreviewDoc(null)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="preview-body">
                      {previewLoading && (
                        <div className="preview-loading">
                          <div className="spinner" />
                          <div>Loading document...</div>
                        </div>
                      )}
                      {previewError && (
                        <div className="preview-error">
                          <p>{previewError}</p>
                          <p style={{ marginTop: "0.5rem" }}>
                            <button
                              style={{
                                background: "#1a56d6",
                                color: "#fff",
                                border: "none",
                                padding: "0.45rem 0.85rem",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // retry
                                if (previewDoc) {
                                  setPreviewError(null);
                                  setPreviewLoading(true);
                                  if (previewBlobUrl) {
                                    URL.revokeObjectURL(previewBlobUrl);
                                    setPreviewBlobUrl(null);
                                  }
                                  // Force cache-bust to avoid stale 404
                                  const busted =
                                    previewDoc.fileUrl
                                      .replace(/([?&])_ts=\d+/, "$1")
                                      .replace(/[#].*$/, "") +
                                    (previewDoc.fileUrl.includes("?")
                                      ? "&"
                                      : "?") +
                                    `_ts=${Date.now()}`;
                                  setPreviewDoc({
                                    ...previewDoc,
                                    fileUrl: busted,
                                  });
                                }
                              }}
                            >
                              Retry
                            </button>
                          </p>
                          <p>
                            <a
                              href={previewDoc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open in new tab
                            </a>
                          </p>
                        </div>
                      )}
                      {isImageType(previewDoc.fileUrl) && (
                        <img
                          src={previewBlobUrl || previewDoc.fileUrl}
                          alt={previewDoc.type}
                          className="preview-image"
                          onLoad={() => setPreviewLoading(false)}
                          onError={() => {
                            setPreviewLoading(false);
                            setPreviewError("Failed to load image");
                          }}
                          crossOrigin="anonymous"
                        />
                      )}
                      {isPdfType(previewDoc.fileUrl) && (
                        <iframe
                          title="PDF Preview"
                          src={previewDoc.fileUrl}
                          className="preview-pdf"
                          onLoad={() => setPreviewLoading(false)}
                        />
                      )}
                      {!isImageType(previewDoc.fileUrl) &&
                        !isPdfType(previewDoc.fileUrl) && (
                          <div className="preview-generic">
                            <p>
                              Inline preview not supported for this file type.{" "}
                              <a
                                href={previewDoc.fileUrl}
                                download
                                rel="noopener noreferrer"
                              >
                                Download file
                              </a>
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Review Notes</h3>
                <textarea
                  className="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your review notes here (required for rejection)"
                  rows={4}
                />
              </div>

              <div className="verification-actions">
                <button
                  className="btn-reject"
                  onClick={handleReject}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Reject Verification"}
                </button>
                <button
                  className="btn-approve"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Approve Verification"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Normalize file URL to ensure we bypass auth middleware if old URLs include /api/uploads
function normalizeDocUrl(url) {
  if (!url) return url;
  try {
    // Only strip the first /api before /uploads to keep query fragments intact
    return url.replace(/\/api(?=\/uploads)/, "");
  } catch {
    return url;
  }
}
function isImageType(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split("?")[0]);
}
function isPdfType(url) {
  if (!url) return false;
  return /\.pdf$/i.test(url.split("?")[0]);
}

// Build absolute preview URL robustly
function getPreviewUrl(url) {
  if (!url) return url;
  let cleaned = normalizeDocUrl(url);
  // Already absolute
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  // protocol-relative
  if (/^\/\//.test(cleaned)) return window.location.protocol + cleaned;
  // Leading slash (e.g., /uploads/..)
  if (cleaned.startsWith("/")) {
    const api = import.meta.env.VITE_API_URL || "";
    // Remove trailing /api or /api/ if present
    const base = api.replace(/\/api\/?$/, "");
    return base + cleaned;
  }
  // Relative path case
  const api = import.meta.env.VITE_API_URL || "";
  const base = api.replace(/\/api\/?$/, "");
  return (
    base.replace(/\/$/, "") + (cleaned.startsWith("/") ? "" : "/") + cleaned
  );
}
