import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import DoctorService from "../../api/DoctorService";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContextCore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import "./DoctorPages.css";

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [selectedDay, setSelectedDay] = useState("monday");
  // New template + preview state
  const [template, setTemplate] = useState(null); // {id, version, rulesJSON, timeZone}
  const [doctorId, setDoctorId] = useState(null);
  const [previewSlots, setPreviewSlots] = useState([]);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [previewMeta, setPreviewMeta] = useState(null); // {from,to,generatedAt,hash}
  const [autoPublish, setAutoPublish] = useState(false);
  const previewHorizonDays = 14;
  // Resolve Doctor document ID: first try existing doctorId in auth context, else fetch /doctors/profile
  useEffect(() => {
    const resolveDoctorId = async () => {
      if (!user) return;
      // If auth context already supplies a doctor document id (preferred)
      if (user.doctorId && user.doctorId !== doctorId) {
        setDoctorId(user.doctorId);
        return;
      }
      // Avoid re-fetch if we already have something that isn't a plain user id length mismatch
      if (doctorId) return;
      try {
        const profileRes = await apiClient.get("/doctors/profile");
        const prof = profileRes.data;
        if (prof && prof._id) {
          setDoctorId(prof._id);
        } else {
          // fallback to user id (will not match slot doctor ref, but allows UI work)
          if (user._id) setDoctorId(user._id);
        }
      } catch (e) {
        console.warn(
          "Failed to resolve doctor profile id, falling back to user id",
          e?.response?.data || e.message
        );
        if (user._id) setDoctorId(user._id);
      }
    };
    resolveDoctorId();
  }, [user, doctorId]);
  // Local edit configuration for currently selected day/block
  const [editConfig, setEditConfig] = useState({
    start: "09:00",
    end: "17:00",
    slotDuration: 30,
    dirty: false,
  });
  const [conflicts, setConflicts] = useState([]);
  const [regenerateMode, setRegenerateMode] = useState("AppendMissing");
  const days = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  const generateTimeSlots = (start, end, duration) => {
    const slots = [];
    if (!start || !end) return slots;
    let [sh, sm] = start.split(":").map(Number);
    let [eh, em] = end.split(":").map(Number);
    let startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    while (startMinutes + duration <= endMinutes) {
      const h = Math.floor(startMinutes / 60)
        .toString()
        .padStart(2, "0");
      const m = (startMinutes % 60).toString().padStart(2, "0");
      slots.push({ time: `${h}:${m}`, available: true });
      startMinutes += duration;
    }
    return slots;
  };

  const regeneratePreview = async () => {
    if (!template || !doctorId) return;
    try {
      const from = new Date();
      from.setDate(from.getDate() + 1);
      const to = new Date(from);
      to.setDate(to.getDate() + previewHorizonDays);
      const previewRes = await apiClient.post(
        `/doctors/${doctorId}/availability/preview`,
        {
          rulesJson: template.rulesJSON,
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
        }
      );
      if (previewRes.data?.success) {
        setPreviewSlots(previewRes.data.data.generated || []);
        setPreviewSummary(previewRes.data.data.summary || null);
        setConflicts(previewRes.data.data.conflicts || []);
        const persist = {
          generated: previewRes.data.data.generated || [],
          summary: previewRes.data.data.summary,
          conflicts: previewRes.data.data.conflicts || [],
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
          generatedAt: Date.now(),
          rulesHash: JSON.stringify(template.rulesJSON || {}),
        };
        try {
          localStorage.setItem(
            `availability_preview_${doctorId}`,
            JSON.stringify(persist)
          );
        } catch (_) {}
        setPreviewMeta({
          from: persist.from,
          to: persist.to,
          generatedAt: persist.generatedAt,
          hash: persist.rulesHash,
        });
        addNotification("Preview generated. Publish to persist.", "info");
        if (autoPublish) publishChanges();
      }
    } catch (e) {
      console.error("Preview failed", e);
      addNotification("Preview failed", "warning");
    }
  };

  // (loadTemplate effect defined below)

  useEffect(() => {
    const loadTemplate = async () => {
      if (!doctorId) return; // wait until doctorId known
      try {
        setLoading(true);
        const tplRes = await apiClient.get(
          `/doctors/${doctorId}/availability/template`
        );
        const tpl = tplRes.data?.data;
        if (tpl) {
          setTemplate(tpl);
          const mapCode = {
            MON: "monday",
            TUE: "tuesday",
            WED: "wednesday",
            THU: "thursday",
            FRI: "friday",
            SAT: "saturday",
            SUN: "sunday",
          };
          const processed = Object.entries(
            tpl.rulesJSON.weekdays || {}
          ).flatMap(([code, blocks]) =>
            blocks.map((b) => ({
              day: mapCode[code],
              startTime: b.start,
              endTime: b.end,
              slotDuration: tpl.rulesJSON.slotLengthMinutes || 30,
              slots: generateTimeSlots(
                b.start,
                b.end,
                tpl.rulesJSON.slotLengthMinutes || 30
              ),
            }))
          );
          setAvailability(processed);
          // restore persisted preview if matching hash
          try {
            const key = `availability_preview_${doctorId}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              const stored = JSON.parse(raw);
              const currentHash = JSON.stringify(tpl.rulesJSON || {});
              if (stored.rulesHash === currentHash) {
                setPreviewSlots(stored.generated || []);
                setPreviewSummary(stored.summary || null);
                setConflicts(stored.conflicts || []);
                setPreviewMeta({
                  from: stored.from,
                  to: stored.to,
                  generatedAt: stored.generatedAt,
                  hash: stored.rulesHash,
                });
              }
            }
          } catch (_) {}
        }
      } catch (apiError) {
        console.error("Template load failed", apiError);
        addNotification("Failed to load availability template", "warning");
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [doctorId, addNotification]);

  const handleDayChange = (day) => {
    setSelectedDay(day);
    const existing = availability.find((a) => a.day === day);
    if (existing) {
      setEditConfig({
        start: existing.startTime,
        end: existing.endTime,
        slotDuration: existing.slotDuration,
        dirty: false,
      });
    } else {
      setEditConfig({
        start: "09:00",
        end: "17:00",
        slotDuration: 30,
        dirty: false,
      });
    }
  };

  const handleStartTimeChange = (e) =>
    setEditConfig((c) => ({ ...c, start: e.target.value, dirty: true }));
  const handleEndTimeChange = (e) =>
    setEditConfig((c) => ({ ...c, end: e.target.value, dirty: true }));
  const handleSlotDurationChange = (e) =>
    setEditConfig((c) => ({
      ...c,
      slotDuration: parseInt(e.target.value, 10),
      dirty: true,
    }));

  const addAvailability = async () => {
    try {
      if (!doctorId) return;
      const wdMap = {
        monday: "MON",
        tuesday: "TUE",
        wednesday: "WED",
        thursday: "THU",
        friday: "FRI",
        saturday: "SAT",
        sunday: "SUN",
      };
      const code = wdMap[selectedDay];
      const next = template
        ? {
            ...template,
            rulesJSON: {
              ...template.rulesJSON,
              weekdays: { ...(template.rulesJSON.weekdays || {}) },
            },
          }
        : {
            id: null,
            version: 0,
            rulesJSON: {
              weekdays: {},
              slotLengthMinutes: editConfig.slotDuration,
              bufferMinutes: 0,
            },
            timeZone: "UTC",
          };
      // Append (multi-block) instead of overwrite
      const existingBlocks = next.rulesJSON.weekdays[code] || [];
      // Replace existing identical block if present (idempotent add)
      const filtered = existingBlocks.filter(
        (b) => !(b.start === editConfig.start && b.end === editConfig.end)
      );
      filtered.push({ start: editConfig.start, end: editConfig.end });
      // Sort by start time for consistency
      filtered.sort((a, b) =>
        a.start < b.start ? -1 : a.start > b.start ? 1 : 0
      );
      next.rulesJSON.weekdays[code] = filtered;
      next.rulesJSON.slotLengthMinutes = editConfig.slotDuration;
      setTemplate(next);
      // Update local availability representation
      const slots = generateTimeSlots(
        editConfig.start,
        editConfig.end,
        editConfig.slotDuration
      );
      const dayAvailabilityWithSlots = {
        day: selectedDay,
        startTime: editConfig.start,
        endTime: editConfig.end,
        slotDuration: editConfig.slotDuration,
        slots,
      };
      setAvailability((prev) => {
        // Remove any previous identical block only
        const remaining = prev.filter(
          (a) =>
            !(
              a.day === selectedDay &&
              a.startTime === editConfig.start &&
              a.endTime === editConfig.end
            )
        );
        return [...remaining, dayAvailabilityWithSlots];
      });
      setEditConfig((c) => ({ ...c, dirty: false }));
      // Preview horizon
      const from = new Date();
      from.setDate(from.getDate() + 1);
      const to = new Date(from);
      to.setDate(to.getDate() + previewHorizonDays);
      try {
        const previewRes = await apiClient.post(
          `/doctors/${doctorId}/availability/preview`,
          {
            rulesJson: next.rulesJSON,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
          }
        );
        if (previewRes.data?.success) {
          setPreviewSlots(previewRes.data.data.generated || []);
          setPreviewSummary(previewRes.data.data.summary);
          setConflicts(previewRes.data.data.conflicts || []);
          const persist = {
            generated: previewRes.data.data.generated || [],
            summary: previewRes.data.data.summary,
            conflicts: previewRes.data.data.conflicts || [],
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
            generatedAt: Date.now(),
            rulesHash: JSON.stringify(next.rulesJSON || {}),
          };
          try {
            localStorage.setItem(
              `availability_preview_${doctorId}`,
              JSON.stringify(persist)
            );
          } catch (_) {}
          setPreviewMeta({
            from: persist.from,
            to: persist.to,
            generatedAt: persist.generatedAt,
            hash: persist.rulesHash,
          });
          addNotification("Preview generated. Publish to persist.", "info");
          if (autoPublish) {
            publishChanges(next);
          }
        }
      } catch (e) {
        console.error("Preview failed", e);
        addNotification("Preview failed", "warning");
      }
    } catch (error) {
      console.error("Error adding availability:", error);
      addNotification("Failed to update availability", "error");
    }
  };

  const removeAvailability = async (day) => {
    try {
      if (!template || !doctorId) return;
      const wdMap = {
        monday: "MON",
        tuesday: "TUE",
        wednesday: "WED",
        thursday: "THU",
        friday: "FRI",
        saturday: "SAT",
        sunday: "SUN",
      };
      const code = wdMap[day];
      const next = {
        ...template,
        rulesJSON: {
          ...template.rulesJSON,
          weekdays: { ...(template.rulesJSON.weekdays || {}) },
        },
      };
      delete next.rulesJSON.weekdays[code];
      setTemplate(next);
      setAvailability((prev) => prev.filter((a) => a.day !== day));
      if (selectedDay === day)
        setEditConfig({
          start: "09:00",
          end: "17:00",
          slotDuration: 30,
          dirty: false,
        });
      addNotification("Day removed (publish to persist).", "warning");
      if (autoPublish) {
        console.log("Auto publishing after day removal");
        publishChanges(next);
      }
    } catch (error) {
      console.error("Error removing availability:", error);
      addNotification("Unable to connect to server", "error");
    }
  };

  const publishChanges = async (overrideTemplate) => {
    // If a click event was accidentally passed, discard it
    if (
      overrideTemplate &&
      (overrideTemplate.nativeEvent || overrideTemplate.target)
    ) {
      overrideTemplate = null;
    }
    const tplToUse = overrideTemplate || template;
    if (!tplToUse || !doctorId) {
      console.log("Publish aborted: missing template or doctorId", {
        hasTemplate: !!tplToUse,
        doctorId,
      });
      return;
    }
    if (publishing) {
      console.log("Publish ignored: already publishing");
      return;
    }
    if (
      !tplToUse.rulesJSON ||
      !tplToUse.rulesJSON.weekdays ||
      Object.keys(tplToUse.rulesJSON.weekdays).length === 0
    ) {
      addNotification(
        "Add at least one availability block before publishing",
        "warning"
      );
      return;
    }
    console.log("Publishing availability template", {
      version: tplToUse.version,
      weekdays: Object.keys(tplToUse.rulesJSON.weekdays || {}),
    });
    setPublishing(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() + 1);
      const to = new Date(from);
      to.setDate(to.getDate() + previewHorizonDays);
      const res = await apiClient.post(
        `/doctors/${doctorId}/availability/publish`,
        {
          rulesJson: tplToUse.rulesJSON,
          baseVersion: tplToUse.version,
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
          regenerateMode,
        }
      );
      if (res.data?.success) {
        setTemplate((t) => ({
          ...(overrideTemplate || t),
          version: res.data.data.newVersion,
        }));
        addNotification(
          `Published availability (added ${res.data.data.added}, kept ${res.data.data.kept})`,
          "success"
        );
        // After successful template publish, sync blocks to DoctorAvailability (multi-block persistence)
        try {
          const blocks = Object.entries(
            tplToUse.rulesJSON.weekdays || {}
          ).flatMap(([code, blks]) => {
            const codeMap = {
              MON: "monday",
              TUE: "tuesday",
              WED: "wednesday",
              THU: "thursday",
              FRI: "friday",
              SAT: "saturday",
              SUN: "sunday",
            };
            return blks.map((b) => ({
              day: codeMap[code] || code.toLowerCase(),
              startTime: b.start,
              endTime: b.end,
              slotDuration: tplToUse.rulesJSON.slotLengthMinutes || 30,
            }));
          });
          if (blocks.length) {
            console.log("Syncing blocks to DoctorAvailability", blocks);
            await DoctorService.setAvailabilityBlocks(blocks);
          }
        } catch (syncErr) {
          console.warn("Post-publish block sync failed", syncErr);
          addNotification("Published slots, but block sync failed", "warning");
        }
      } else {
        addNotification("Publish failed", "error");
      }
    } catch (e) {
      console.error("Publish error", e);
      const resp = e.response?.data;
      // Handle stale version conflicts (409) gracefully by updating local template & suggesting retry
      if (
        e.response?.status === 409 &&
        resp?.message &&
        resp.message.toLowerCase().includes("stale")
      ) {
        const latest = resp.latest;
        if (latest && typeof latest.version === "number") {
          console.log(
            "Stale version detected. Updating local template to latest and retrying once.",
            latest
          );
          setTemplate((old) => ({
            ...old,
            version: latest.version,
            rulesJSON: latest.rulesJSON || old.rulesJSON,
          }));
          addNotification(
            "Template updated to latest version. Re-publishing...",
            "info"
          );
          // Retry once with updated version after a tick
          setTimeout(() => {
            publishChanges();
          }, 50);
          return;
        }
      }
      let msg = resp?.message || "Publish failed";
      if (resp?.stage) msg += ` (stage: ${resp.stage})`;
      if (resp?.errorType) msg += ` [${resp.errorType}]`;
      addNotification(msg, "error");
    } finally {
      setPublishing(false);
    }
  };

  // Remove a single block within a day
  const removeBlock = (block) => {
    try {
      if (!template) return;
      const wdMap = {
        monday: "MON",
        tuesday: "TUE",
        wednesday: "WED",
        thursday: "THU",
        friday: "FRI",
        saturday: "SAT",
        sunday: "SUN",
      };
      const code = wdMap[selectedDay];
      const next = {
        ...template,
        rulesJSON: {
          ...template.rulesJSON,
          weekdays: { ...(template.rulesJSON.weekdays || {}) },
        },
      };
      const existing = (next.rulesJSON.weekdays[code] || []).filter(
        (b) => !(b.start === block.startTime && b.end === block.endTime)
      );
      if (existing.length === 0) {
        delete next.rulesJSON.weekdays[code];
      } else {
        next.rulesJSON.weekdays[code] = existing;
      }
      setTemplate(next);
      setAvailability((prev) =>
        prev.filter(
          (b) =>
            !(
              b.day === selectedDay &&
              b.startTime === block.startTime &&
              b.endTime === block.endTime
            )
        )
      );
      addNotification("Block removed (publish to persist).", "warning");
      if (autoPublish) {
        console.log("Auto publishing after block removal");
        publishChanges(next);
      }
    } catch (e) {
      console.error("Remove block failed", e);
      addNotification("Failed removing block", "error");
    }
  };

  // (generateTimeSlots helper defined earlier near top)

  if (loading) return <LoadingSpinner />;

  // Multi-block: collect all blocks for selected day
  const dayBlocks = availability
    .filter((a) => a.day === selectedDay)
    .sort((a, b) =>
      a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0
    );
  // Backwards compatibility variable (first block) for existing UI pieces
  const dayAvailability = dayBlocks[0];

  return (
    <div className="doctor-page availability-page">
      <h1>Set Your Availability</h1>
      <p>Configure when you're available to see patients.</p>

      <div className="availability-container">
        <div className="days-sidebar">
          <h3>Days</h3>
          <div className="days-list">
            {days.map((day) => (
              <div
                key={day.id}
                className={`day-item ${
                  selectedDay === day.id ? "selected" : ""
                } ${
                  availability.some((a) => a.day === day.id)
                    ? "has-availability"
                    : ""
                }`}
                onClick={() => handleDayChange(day.id)}
              >
                <span className="day-name">{day.label}</span>
                {availability.some((a) => a.day === day.id) && (
                  <span className="availability-indicator">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="day-config">
          <div
            className="day-header"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <h2 style={{ margin: 0 }}>
              {days.find((d) => d.id === selectedDay)?.label}
            </h2>
            {dayBlocks.length > 0 && (
              <button
                className="btn-sm danger"
                onClick={() => removeAvailability(selectedDay)}
              >
                Remove Availability
              </button>
            )}
            <button
              className="btn secondary"
              disabled={
                !template ||
                publishing ||
                !template?.rulesJSON?.weekdays ||
                Object.keys(template.rulesJSON.weekdays).length === 0
              }
              onClick={() => {
                console.log("Top publish button clicked");
                publishChanges();
              }}
              title={
                !template
                  ? "Template not loaded yet"
                  : !template?.rulesJSON?.weekdays ||
                    Object.keys(template.rulesJSON.weekdays).length === 0
                  ? "Add an availability block first"
                  : publishing
                  ? "Publishing in progress"
                  : ""
              }
            >
              {publishing ? "Publishing..." : "Publish Changes"}
            </button>
            <button
              className="btn outline"
              onClick={regeneratePreview}
              disabled={!template || publishing}
            >
              Preview
            </button>
            <label
              style={{
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
              />{" "}
              Auto publish after preview
            </label>
          </div>
          <div className="time-config">
            <div className="time-inputs">
              <div className="input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={editConfig.start}
                  onChange={handleStartTimeChange}
                />
              </div>
              <div className="input-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={editConfig.end}
                  onChange={handleEndTimeChange}
                />
              </div>
              <div className="input-group">
                <label>Appointment Duration (minutes)</label>
                <select
                  value={editConfig.slotDuration}
                  onChange={handleSlotDurationChange}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginTop: "0.75rem",
              }}
            >
              <button
                className="btn primary"
                onClick={addAvailability}
                disabled={
                  !selectedDay ||
                  !editConfig.start ||
                  !editConfig.end ||
                  editConfig.start >= editConfig.end
                }
              >
                {dayBlocks.length > 0 ? "Add Block & Preview" : "Add & Preview"}
              </button>
              <button
                className="btn secondary"
                disabled={
                  !template ||
                  publishing ||
                  !template?.rulesJSON?.weekdays ||
                  Object.keys(template.rulesJSON.weekdays).length === 0
                }
                onClick={() => {
                  console.log("Lower publish button clicked");
                  publishChanges();
                }}
                title={
                  !template
                    ? "Template not loaded yet"
                    : !template?.rulesJSON?.weekdays ||
                      Object.keys(template.rulesJSON.weekdays).length === 0
                    ? "Add an availability block first"
                    : publishing
                    ? "Publishing in progress"
                    : ""
                }
              >
                {publishing ? "Publishing..." : "Publish Changes"}
              </button>
              {!publishing &&
                template?.rulesJSON &&
                (!template.rulesJSON.weekdays ||
                  Object.keys(template.rulesJSON.weekdays).length === 0) && (
                  <span style={{ fontSize: "0.75rem", color: "#c00" }}>
                    Add at least one block first
                  </span>
                )}
              <div style={{ marginLeft: "auto" }}>
                <label style={{ fontSize: "0.85rem", display: "block" }}>
                  Regenerate Mode
                </label>
                <select
                  value={regenerateMode}
                  onChange={(e) => setRegenerateMode(e.target.value)}
                  disabled={publishing}
                >
                  <option value="AppendMissing">Append Missing</option>
                  <option value="ReplaceUnbooked">Replace Unbooked</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Close availability-container */}
      </div>

      {dayBlocks.length > 0 && (
        <div className="time-slots-preview">
          <h3>
            Draft Time Slots for {days.find((d) => d.id === selectedDay)?.label}
          </h3>
          {dayBlocks.map((block, i) => (
            <div key={i} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <strong style={{ marginRight: "0.5rem" }}>
                  Block {i + 1}: {block.startTime} - {block.endTime}
                </strong>
                <button
                  className="btn-xs danger"
                  onClick={() => removeBlock(block)}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Remove Block
                </button>
              </div>
              <div className="slots-container">
                {block.slots && block.slots.length > 0 ? (
                  block.slots.map((slot, index) => (
                    <div
                      key={index}
                      className={`time-slot ${
                        slot.available ? "available" : "booked"
                      }`}
                    >
                      {slot.time}
                      {slot.available ? " (Available)" : " (Booked)"}
                    </div>
                  ))
                ) : (
                  <div className="no-slots">No slots</div>
                )}
              </div>
            </div>
          ))}
          <button
            className="btn danger"
            onClick={() => removeAvailability(selectedDay)}
          >
            Remove All Availability for{" "}
            {days.find((d) => d.id === selectedDay)?.label}
          </button>
        </div>
      )}

      {dayBlocks.length === 0 && (
        <div className="no-availability">
          <p>
            No availability set for{" "}
            {days.find((d) => d.id === selectedDay)?.label}
          </p>
          <p>Use the form above to add your available hours.</p>
        </div>
      )}
      {previewSummary && (
        <div className="preview-summary" style={{ marginTop: "1.5rem" }}>
          <h3>Last Preview Summary (next {previewHorizonDays} days)</h3>
          <p>Generated Slots: {previewSummary.generated}</p>
          <p>Conflicts: {previewSummary.conflicts}</p>
          {previewMeta && (
            <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>
              From {previewMeta.from} to {previewMeta.to} • Generated{" "}
              {new Date(previewMeta.generatedAt).toLocaleTimeString()} •{" "}
              {JSON.stringify(template?.rulesJSON || {}) === previewMeta.hash
                ? "Up to date"
                : "May be stale"}
            </p>
          )}
          <p className="hint">
            Preview shows potential slots. Publishing writes them as bookable
            slots (keeps existing booked ones).
          </p>
          {conflicts && conflicts.length > 0 && (
            <div className="conflicts" style={{ marginTop: "0.75rem" }}>
              <h4>Conflicts ({conflicts.length})</h4>
              <ul style={{ maxHeight: "160px", overflowY: "auto" }}>
                {conflicts.slice(0, 25).map((c, idx) => (
                  <li key={idx} style={{ fontSize: "0.8rem" }}>
                    {c.date ? `${c.date} ` : ""}
                    {c.start && c.end ? `${c.start}-${c.end}` : "slot"}
                    {c.reason ? `: ${c.reason}` : ""}
                  </li>
                ))}
              </ul>
              {conflicts.length > 25 && (
                <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                  Showing first 25 of {conflicts.length} conflicts
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
