import { useEffect, useMemo, useState } from "react";
import ChartingService from "../../api/ChartingService";

export default function NotesPanel({
  appointmentId,
  initialNote,
  lifecycleId,
  onNoteSaved,
}) {
  const [note, setNote] = useState(initialNote || null);
  const [sections, setSections] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    freeText: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(initialNote?.templateId || "");

  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
      const s = initialNote.sectionsJSON || {};
      setSections({
        subjective: s.subjective || "",
        objective: s.objective || "",
        assessment: s.assessment || "",
        plan: s.plan || "",
        freeText: s.freeText || "",
      });
      setTemplateId(initialNote.templateId || "");
    }
  }, [initialNote]);

  useEffect(() => {
    // load templates for this appointment context
    let mounted = true;
    ChartingService.listTemplates(appointmentId)
      .then((list) => {
        if (mounted)
          setTemplates(Array.isArray(list) ? list : list?.items || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  // Simple debounce
  const debounced = useMemo(() => {
    let t;
    return (fn, delay = 800) => {
      clearTimeout(t);
      t = setTimeout(fn, delay);
    };
  }, []);

  useEffect(() => {
    // nothing to save yet if all empty and no prior note
    const anyContent = Object.values(sections).some((v) => (v ?? "") !== "");
    if (!anyContent && !note) return;
    setError("");
    debounced(async () => {
      try {
        setSaving(true);
        const payload = {
          sectionsJSON: sections,
          templateId: templateId || undefined,
          lifecycleId: lifecycleId || undefined,
        };
        let saved;
        if (note?._id) {
          saved = await ChartingService.updateNote(
            appointmentId,
            note._id,
            payload
          );
        } else {
          saved = await ChartingService.upsertNote(appointmentId, payload);
        }
        setNote(saved);
        onNoteSaved && onNoteSaved(saved);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to save note");
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [sections, templateId, appointmentId]);

  const handleSign = async () => {
    if (!note?._id) return;
    setError("");
    try {
      setSaving(true);
      const signed = await ChartingService.signNote(appointmentId, note._id);
      setNote(signed);
      onNoteSaved && onNoteSaved(signed);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to sign note");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tid) => {
    setTemplateId(tid);
    const t = templates.find((x) => x._id === tid);
    if (t?.sectionsJSON) {
      setSections((prev) => ({
        ...prev,
        subjective: t.sectionsJSON.subjective || prev.subjective,
        objective: t.sectionsJSON.objective || prev.objective,
        assessment: t.sectionsJSON.assessment || prev.assessment,
        plan: t.sectionsJSON.plan || prev.plan,
      }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Consultation Notes</h3>
        <div className="flex items-center gap-3 text-sm muted">
          <span>{saving ? "Saving…" : note?.noteStatus || "Draft"}</span>
          <span>{note?.version != null ? `v${note.version}` : null}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <label className="col-span-2 flex items-center gap-2">
          <span className="label">Template</span>
          <select
            className="select"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">— None —</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name || t.Name || "Template"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Subjective</label>
          <textarea
            className="textarea"
            rows={5}
            value={sections.subjective}
            onChange={(e) =>
              setSections((s) => ({ ...s, subjective: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Objective</label>
          <textarea
            className="textarea"
            rows={5}
            value={sections.objective}
            onChange={(e) =>
              setSections((s) => ({ ...s, objective: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assessment</label>
          <textarea
            className="textarea"
            rows={5}
            value={sections.assessment}
            onChange={(e) =>
              setSections((s) => ({ ...s, assessment: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <textarea
            className="textarea"
            rows={5}
            value={sections.plan}
            onChange={(e) =>
              setSections((s) => ({ ...s, plan: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium mb-1">Free text</label>
        <textarea
          className="textarea"
          rows={6}
          placeholder="Type notes… (autosaves)"
          value={sections.freeText}
          onChange={(e) =>
            setSections((s) => ({ ...s, freeText: e.target.value }))
          }
        />
      </div>

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          className="btn btn-primary"
          onClick={handleSign}
          disabled={!note?._id || note?.noteStatus === "Signed" || saving}
        >
          Sign Note
        </button>
      </div>
    </div>
  );
}
