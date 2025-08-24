import { useEffect, useState } from "react";
import PHRService from "../../api/PHRService";
import "./phr.css";

const PAGE_LIMIT = 10;

export default function PHROverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareLinks, setShareLinks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [hours, setHours] = useState(24);
  const [activeTab, setActiveTab] = useState("summary");
  const [consultations, setConsultations] = useState(null);
  const [prescriptions, setPrescriptions] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [audit, setAudit] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [exportJob, setExportJob] = useState(null);
  const [consultationPage, setConsultationPage] = useState(1);
  const [consultationMeta, setConsultationMeta] = useState(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [labs, setLabs] = useState(null);
  const [labsMeta, setLabsMeta] = useState(null);
  const [labsPage, setLabsPage] = useState(1);
  const [imaging, setImaging] = useState(null);
  const [imagingMeta, setImagingMeta] = useState(null);
  const [imagingPage, setImagingPage] = useState(1);

  // poll export job
  useEffect(() => {
    if (!exportJob || ["Completed", "Failed"].includes(exportJob.status))
      return;
    const iv = setInterval(() => {
      PHRService.getExportJob(exportJob._id)
        .then((j) => setExportJob(j))
        .catch(() => {});
    }, 2000);
    return () => clearInterval(iv);
  }, [exportJob]);

  useEffect(() => {
    (async () => {
      try {
        const ov = await PHRService.getOverview();
        setData(ov);
        const links = await PHRService.listShareLinks();
        setShareLinks(links);
      } catch (e) {
        console.log("PHR load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createLink = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await PHRService.createShareLink({
        scope: { all: true },
        expiresInHours: hours,
      });
      setShareLinks((prev) => [res, ...prev]);
    } catch (e) {
      console.log("Create link error", e);
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id) => {
    try {
      await PHRService.revokeShareLink(id);
      setShareLinks((prev) => prev.filter((l) => l.id !== id && l._id !== id));
    } catch (e) {
      console.log("Revoke error", e);
    }
  };

  if (loading)
    return <div className="phr-loading">Loading Personal Health Record...</div>;

  return (
    <div className="phr-page">
      <h1>Personal Health Record</h1>
      <div className="phr-tabs">
        {[
          "summary",
          "consultations",
          "prescriptions",
          "documents",
          "labs",
          "imaging",
          "export",
          "audit",
          "preferences",
        ].map((t) => (
          <button
            key={t}
            className={"phr-tab " + (activeTab === t ? "active" : "")}
            onClick={() => {
              setActiveTab(t);
              if (t === "consultations" && !consultations)
                PHRService.consultations({
                  page: consultationPage,
                  limit: PAGE_LIMIT,
                }).then((d) => {
                  setConsultations(d.items);
                  setConsultationMeta(d.pagination);
                });
              if (t === "prescriptions" && !prescriptions)
                PHRService.prescriptions().then(setPrescriptions);
              if (t === "documents" && !documents)
                PHRService.documents().then(setDocuments);
              if (t === "labs" && !labs)
                PHRService.labs({ page: labsPage, limit: PAGE_LIMIT }).then(
                  (d) => {
                    setLabs(d.items);
                    setLabsMeta(d.pagination);
                  }
                );
              if (t === "imaging" && !imaging)
                PHRService.imaging({
                  page: imagingPage,
                  limit: PAGE_LIMIT,
                }).then((d) => {
                  setImaging(d.items);
                  setImagingMeta(d.pagination);
                });
              if (t === "audit" && !audit)
                PHRService.audit({ page: auditPage, limit: 20 }).then((a) => {
                  setAudit(a.rows);
                  setAuditMeta(a.pagination);
                });
              if (t === "preferences" && !prefs)
                PHRService.getPreferences().then(setPrefs);
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {activeTab === "summary" && (
        <section className="phr-section">
          <h2>Summary</h2>
          {!data && <p>No data found.</p>}
          {data && (
            <div className="phr-summary-grid">
              <div className="phr-card">
                <h3>Latest Consultation</h3>
                {data.latestRecord ? (
                  <div>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(data.latestRecord.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Diagnosis:</strong>{" "}
                      {data.latestRecord.diagnosis || "N/A"}
                    </p>
                  </div>
                ) : (
                  <p>No consultations yet.</p>
                )}
              </div>
              <div className="phr-card">
                <h3>Recent Prescriptions</h3>
                {data.activePrescriptions?.length ? (
                  <ul>
                    {data.activePrescriptions.map((p) => (
                      <li key={p._id}>{p.prescription}</li>
                    ))}
                  </ul>
                ) : (
                  <p>None</p>
                )}
              </div>
              <div className="phr-card">
                <h3>Recent Documents</h3>
                {data.documents?.length ? (
                  <ul>
                    {data.documents.map((d) => (
                      <li key={d._id}>{d.originalName || d.fileName}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No documents</p>
                )}
              </div>
              <div className="phr-card">
                <h3>Recent Labs</h3>
                {data.recentLabs?.length ? (
                  <ul>
                    {data.recentLabs.map((l) => (
                      <li key={l._id}>
                        {l.testType} • {l.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No labs</p>
                )}
              </div>
              <div className="phr-card">
                <h3>Recent Imaging</h3>
                {data.recentImaging?.length ? (
                  <ul>
                    {data.recentImaging.map((r) => (
                      <li key={r._id}>
                        {r.modality} • {r.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No imaging</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      {activeTab === "consultations" && (
        <section className="phr-section">
          <h2>Consultations</h2>
          {!consultations && <p>Loading...</p>}
          {consultations && consultations.length === 0 && <p>No records.</p>}
          {consultations && consultations.length > 0 && (
            <>
              <table className="phr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c) => (
                    <tr key={c._id}>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        {c.doctor?.profile?.firstName}{" "}
                        {c.doctor?.profile?.lastName}
                      </td>
                      <td>{c.diagnosis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {consultationMeta && (
                <div className="phr-pagination">
                  <button
                    disabled={consultationMeta.page <= 1}
                    onClick={() => {
                      const newPage = consultationMeta.page - 1;
                      setConsultationPage(newPage);
                      PHRService.consultations({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setConsultations(d.items);
                        setConsultationMeta(d.pagination);
                      });
                    }}
                  >
                    Prev
                  </button>
                  <span>
                    Page {consultationMeta.page} / {consultationMeta.pages}
                  </span>
                  <button
                    disabled={consultationMeta.page >= consultationMeta.pages}
                    onClick={() => {
                      const newPage = consultationMeta.page + 1;
                      setConsultationPage(newPage);
                      PHRService.consultations({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setConsultations(d.items);
                        setConsultationMeta(d.pagination);
                      });
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeTab === "prescriptions" && (
        <section className="phr-section">
          <h2>Prescriptions</h2>
          {!prescriptions && <p>Loading...</p>}
          {prescriptions && prescriptions.length === 0 && (
            <p>No prescriptions.</p>
          )}
          {prescriptions && prescriptions.length > 0 && (
            <ul>
              {prescriptions.map((p) => (
                <li key={p._id}>{p.prescription}</li>
              ))}
            </ul>
          )}
        </section>
      )}
      {activeTab === "documents" && (
        <section className="phr-section">
          <h2>Documents</h2>
          {!documents && <p>Loading...</p>}
          {documents && documents.length === 0 && <p>No documents.</p>}
          {documents && documents.length > 0 && (
            <div className="phr-doc-grid">
              {documents.map((d) => {
                const type = d.mimeType?.startsWith("image/")
                  ? "image"
                  : d.mimeType === "application/pdf"
                  ? "pdf"
                  : "file";
                return (
                  <div
                    key={d._id}
                    className={`doc-card doc-${type}`}
                    onClick={() => setDocPreview(d)}
                  >
                    <div className="doc-name">
                      {d.originalName || d.filename}
                    </div>
                    <div className="doc-meta">
                      {(d.size / 1024).toFixed(1)} KB • {d.mimeType}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {docPreview && (
            <div className="doc-modal" onClick={() => setDocPreview(null)}>
              <div
                className="doc-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-btn"
                  onClick={() => setDocPreview(null)}
                >
                  ×
                </button>
                <h3>{docPreview.originalName || docPreview.filename}</h3>
                {docPreview.mimeType === "application/pdf" && (
                  <iframe
                    title="pdf"
                    src={docPreview.fileUrl}
                    className="doc-frame"
                  />
                )}
                {docPreview.mimeType?.startsWith("image/") && (
                  <img
                    src={docPreview.fileUrl}
                    alt="preview"
                    className="doc-image"
                  />
                )}
                {!docPreview.mimeType?.startsWith("image/") &&
                  docPreview.mimeType !== "application/pdf" && (
                    <p>
                      No inline preview available.{" "}
                      <a
                        href={docPreview.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </p>
                  )}
              </div>
            </div>
          )}
        </section>
      )}
      {activeTab === "labs" && (
        <section className="phr-section">
          <h2>Labs</h2>
          {!labs && <p>Loading...</p>}
          {labs && labs.length === 0 && <p>No lab examinations.</p>}
          {labs && labs.length > 0 && (
            <>
              <table className="phr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Test</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map((l) => (
                    <tr key={l._id}>
                      <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td>{l.testType}</td>
                      <td>{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {labsMeta && (
                <div className="phr-pagination">
                  <button
                    disabled={labsMeta.page <= 1}
                    onClick={() => {
                      const newPage = labsMeta.page - 1;
                      setLabsPage(newPage);
                      PHRService.labs({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setLabs(d.items);
                        setLabsMeta(d.pagination);
                      });
                    }}
                  >
                    Prev
                  </button>
                  <span>
                    Page {labsMeta.page} / {labsMeta.pages}
                  </span>
                  <button
                    disabled={labsMeta.page >= labsMeta.pages}
                    onClick={() => {
                      const newPage = labsMeta.page + 1;
                      setLabsPage(newPage);
                      PHRService.labs({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setLabs(d.items);
                        setLabsMeta(d.pagination);
                      });
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeTab === "imaging" && (
        <section className="phr-section">
          <h2>Imaging</h2>
          {!imaging && <p>Loading...</p>}
          {imaging && imaging.length === 0 && <p>No imaging reports.</p>}
          {imaging && imaging.length > 0 && (
            <>
              <table className="phr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Modality</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {imaging.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>{r.modality}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {imagingMeta && (
                <div className="phr-pagination">
                  <button
                    disabled={imagingMeta.page <= 1}
                    onClick={() => {
                      const newPage = imagingMeta.page - 1;
                      setImagingPage(newPage);
                      PHRService.imaging({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setImaging(d.items);
                        setImagingMeta(d.pagination);
                      });
                    }}
                  >
                    Prev
                  </button>
                  <span>
                    Page {imagingMeta.page} / {imagingMeta.pages}
                  </span>
                  <button
                    disabled={imagingMeta.page >= imagingMeta.pages}
                    onClick={() => {
                      const newPage = imagingMeta.page + 1;
                      setImagingPage(newPage);
                      PHRService.imaging({
                        page: newPage,
                        limit: PAGE_LIMIT,
                      }).then((d) => {
                        setImaging(d.items);
                        setImagingMeta(d.pagination);
                      });
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeTab === "export" && (
        <section className="phr-section">
          <h2>Export</h2>
          <button
            onClick={() => PHRService.createExportJob("pdf").then(setExportJob)}
          >
            Generate PDF
          </button>{" "}
          <button
            onClick={() =>
              PHRService.createExportJob("json_fhir").then(setExportJob)
            }
          >
            Generate FHIR JSON
          </button>
          {exportJob && (
            <div className="phr-card">
              <p>
                <strong>Job:</strong> {exportJob._id} <strong>Status:</strong>{" "}
                {exportJob.status} <strong>Progress:</strong>{" "}
                {exportJob.progress || 0}%{" "}
                {exportJob.artifactUrl && (
                  <a
                    href={exportJob.artifactUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                )}
              </p>
            </div>
          )}
        </section>
      )}
      {activeTab === "preferences" && (
        <section className="phr-section">
          <h2>Preferences</h2>
          {!prefs && <p>Loading...</p>}
          {prefs && (
            <div className="phr-prefs">
              {[
                "share_phr_by_default",
                "allow_ephemeral_links",
                "allow_export_pdf",
                "allow_export_fhir",
              ].map((k) => (
                <label key={k} className="pref-item">
                  <input
                    type="checkbox"
                    checked={!!prefs[k]}
                    onChange={(e) => {
                      const updated = { ...prefs, [k]: e.target.checked };
                      setPrefs(updated);
                      PHRService.updatePreferences({ [k]: e.target.checked });
                    }}
                  />{" "}
                  {k}
                </label>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="phr-section">
        <h2>Share Links</h2>
        <form onSubmit={createLink} className="share-form">
          <label>
            Expiry (hours):{" "}
            <input
              type="number"
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Share Link"}
          </button>
        </form>
        <table className="phr-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shareLinks.map((l) => (
              <tr key={l.id || l._id}>
                <td>{(l.id || l._id).slice(-6)}</td>
                <td>{new Date(l.expiresAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => revoke(l.id || l._id)}>Revoke</button>
                </td>
              </tr>
            ))}
            {!shareLinks.length && (
              <tr>
                <td colSpan={3}>No active links</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
