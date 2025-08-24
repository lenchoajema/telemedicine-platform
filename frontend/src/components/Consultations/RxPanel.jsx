import { useEffect, useState } from "react";
import ErxService from "../../api/ErxService";

export default function RxPanel({ appointmentId, lifecycleId }) {
  const [form, setForm] = useState({
    drugName: "",
    dose: "",
    route: "",
    frequency: "",
    durationDays: 5,
    refills: 0,
    substitutionAllowed: true,
    pharmacyId: "",
  });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pharmQuery, setPharmQuery] = useState("");
  const [pharmacies, setPharmacies] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ErxService.listPrescriptions({ appointmentId });
      setList(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const searchPharmacies = async () => {
    try {
      const result = await ErxService.searchPharmacies(pharmQuery);
      setPharmacies(Array.isArray(result) ? result : result?.items || []);
    } catch (e) {
      // ignore errors in search, keep UI responsive
    }
  };

  const createRx = async () => {
    setError("");
    try {
      await ErxService.createPrescription({
        appointmentId,
        lifecycleId,
        ...form,
      });
      setForm({
        drugName: "",
        dose: "",
        route: "",
        frequency: "",
        durationDays: 5,
        refills: 0,
        substitutionAllowed: true,
        pharmacyId: "",
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create prescription");
    }
  };

  const sendRx = async (id) => {
    setError("");
    try {
      await ErxService.sendPrescription(id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to send eRx");
    }
  };

  const cancelRx = async (id) => {
    setError("");
    try {
      await ErxService.cancelPrescription(id, "Clinician cancelled");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel eRx");
    }
  };

  const routeRx = async (id) => {
    setError("");
    try {
      if (!form.pharmacyId) {
        setError("Select a pharmacy first");
        return;
      }
      await ErxService.routeToPharmacy(id, {
        pharmacyId: form.pharmacyId,
        lifecycleId,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to route prescription");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Medications</h3>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className="input"
          placeholder="Drug name"
          value={form.drugName}
          onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Dose (e.g., 500 mg)"
          value={form.dose}
          onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Route (PO)"
          value={form.route}
          onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Frequency (BID)"
          value={form.frequency}
          onChange={(e) =>
            setForm((f) => ({ ...f, frequency: e.target.value }))
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Duration (days)"
          value={form.durationDays}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              durationDays: Number(e.target.value) || 0,
            }))
          }
        />
        <input
          className="input"
          type="number"
          placeholder="Refills"
          value={form.refills}
          onChange={(e) =>
            setForm((f) => ({ ...f, refills: Number(e.target.value) || 0 }))
          }
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.substitutionAllowed}
            onChange={(e) =>
              setForm((f) => ({ ...f, substitutionAllowed: e.target.checked }))
            }
          />{" "}
          Allow substitution
        </label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Search pharmacies"
            value={pharmQuery}
            onChange={(e) => setPharmQuery(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            type="button"
            onClick={searchPharmacies}
          >
            Search
          </button>
        </div>
        <select
          className="select col-span-2"
          value={form.pharmacyId}
          onChange={(e) =>
            setForm((f) => ({ ...f, pharmacyId: e.target.value }))
          }
        >
          <option value="">— Select pharmacy (optional) —</option>
          {pharmacies.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name ||
                `${p.Name || "Pharmacy"}${p.city ? ` - ${p.city}` : ""}`}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" onClick={createRx}>
        Add Medication
      </button>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <div className="mt-4">
        <h4 className="font-semibold mb-1">Current Prescriptions</h4>
        {loading ? (
          <p>Loading…</p>
        ) : list.length === 0 ? (
          <p>None</p>
        ) : (
          <ul className="divide-y">
            {list.map((rx) => (
              <li
                key={rx._id}
                className="py-2 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {rx.drugName} {rx.dose} {rx.route} {rx.frequency}
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {rx.transmissionStatus || rx.status || "Draft"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => sendRx(rx._id)}
                    disabled={
                      rx.transmissionStatus === "Queued" ||
                      rx.transmissionStatus === "Sent"
                    }
                  >
                    Send
                  </button>
                  <button
                    className="btn"
                    title="Route to selected pharmacy"
                    onClick={() => routeRx(rx._id)}
                  >
                    Route Rx
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => cancelRx(rx._id)}
                    disabled={
                      rx.transmissionStatus === "Cancelled" ||
                      rx.transmissionStatus === "Sent"
                    }
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
