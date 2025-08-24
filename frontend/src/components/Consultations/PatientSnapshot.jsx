import React from "react";

function formatName(p) {
  if (!p) return "";
  const first = p.firstName || p.givenName || "";
  const last = p.lastName || p.familyName || "";
  return `${first} ${last}`.trim() || p.name || "Patient";
}

function calcAge(dob) {
  try {
    if (!dob) return "";
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return `${age}y`;
  } catch {
    return "";
  }
}

function lastVital(vitals, key) {
  const list = Array.isArray(vitals) ? vitals : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const v = list[i];
    if (v && (v.type === key || v.code === key)) return v;
  }
  return null;
}

export default function PatientSnapshot({ chart }) {
  const patient = chart?.patient || chart?.appointment?.patient || {};
  const demographics = chart?.demographics || patient?.demographics || {};
  const allergies = chart?.allergies || patient?.allergies || [];
  const medications = chart?.medications || patient?.medications || [];
  const vitals = chart?.vitals || patient?.vitals || [];

  const name = formatName(patient);
  const mrn = patient?.mrn || demographics?.mrn || "";
  const sex = patient?.sex || demographics?.sex || demographics?.gender || "";
  const dob = patient?.dob || demographics?.dob || "";
  const age = calcAge(dob);

  const bp = lastVital(vitals, "BP") || {};
  const hr = lastVital(vitals, "HR") || {};
  const temp = lastVital(vitals, "TEMP") || {};
  const spo2 = lastVital(vitals, "SPO2") || {};

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Patient Snapshot</h3>
        <p className="text-sm muted">
          {name}
          {age && <span className="ml-2">• {age}</span>}
          {sex && <span className="ml-2">• {sex}</span>}
          {mrn && <span className="ml-2">• MRN {mrn}</span>}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Allergies</h4>
        {Array.isArray(allergies) && allergies.length > 0 ? (
          <ul className="list-disc ml-5 text-sm">
            {allergies.slice(0, 5).map((a, idx) => (
              <li key={idx}>
                {a?.substance || a?.name || "Allergy"}
                {a?.reaction && <span className="ml-1">- {a.reaction}</span>}
                {a?.severity && <span className="ml-1">({a.severity})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No known allergies</p>
        )}
      </div>

      <div>
        <h4 className="font-medium">Active Medications</h4>
        {Array.isArray(medications) && medications.length > 0 ? (
          <ul className="list-disc ml-5 text-sm">
            {medications.slice(0, 6).map((m, idx) => (
              <li key={idx}>
                {m?.drugName || m?.name}
                {m?.dose && <span className="ml-1">{m.dose}</span>}
                {m?.route && <span className="ml-1">{m.route}</span>}
                {m?.frequency && <span className="ml-1">{m.frequency}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No active meds</p>
        )}
      </div>

      <div>
        <h4 className="font-medium">Latest Vitals</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="card p-2">
            BP:{" "}
            {bp?.systolic && bp?.diastolic
              ? `${bp.systolic}/${bp.diastolic}`
              : bp?.value || "-"}
          </div>
          <div className="card p-2">HR: {hr?.value || "-"}</div>
          <div className="card p-2">Temp: {temp?.value || "-"}</div>
          <div className="card p-2">SpO2: {spo2?.value || "-"}</div>
        </div>
      </div>
    </div>
  );
}
