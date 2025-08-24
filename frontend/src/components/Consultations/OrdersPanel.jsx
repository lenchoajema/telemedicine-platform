import { useState } from "react";
import OrdersService from "../../api/OrdersService";

export default function OrdersPanel({ appointmentId, patientId, lifecycleId }) {
  const [tab, setTab] = useState("labs");
  const [labItems, setLabItems] = useState([
    { code: "", display: "", priority: "Routine", specimenType: "" },
  ]);
  const [labIndication, setLabIndication] = useState("");
  const [imaging, setImaging] = useState({
    modality: "X-Ray",
    bodyPart: "",
    priority: "Routine",
    indicationText: "",
    contrast: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const addLabRow = () =>
    setLabItems((arr) => [
      ...arr,
      { code: "", display: "", priority: "Routine", specimenType: "" },
    ]);

  const orderLabs = async () => {
    setError("");
    setMessage("");
    try {
      const items = labItems
        .filter((i) => i.code || i.display)
        .map((i) => ({
          code: i.code,
          display: i.display,
          priority: i.priority,
          specimenType: i.specimenType,
        }));
      const payload = {
        appointmentId,
        patientId,
        lifecycleId,
        items,
        indicationText: labIndication,
      };
      await OrdersService.createLabOrders(payload);
      setMessage("Lab orders placed");
      setLabItems([
        { code: "", display: "", priority: "Routine", specimenType: "" },
      ]);
      setLabIndication("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create lab orders");
    }
  };

  const orderImaging = async () => {
    setError("");
    setMessage("");
    try {
      const payload = {
        appointmentId,
        patientId,
        lifecycleId,
        modality: imaging.modality,
        bodyPart: imaging.bodyPart,
        priority: imaging.priority,
        indicationText: imaging.indicationText,
        contrast: imaging.contrast,
      };
      await OrdersService.createImagingOrder(payload);
      setMessage("Imaging order placed");
      setImaging({
        modality: "X-Ray",
        bodyPart: "",
        priority: "Routine",
        indicationText: "",
        contrast: false,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create imaging order");
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-3 border-b">
        <button
          className={`pb-2 ${
            tab === "labs" ? "border-b-2 border-blue-600" : "text-gray-500"
          }`}
          onClick={() => setTab("labs")}
        >
          Labs
        </button>
        <button
          className={`pb-2 ${
            tab === "imaging" ? "border-b-2 border-blue-600" : "text-gray-500"
          }`}
          onClick={() => setTab("imaging")}
        >
          Imaging
        </button>
      </div>
      {tab === "labs" ? (
        <div>
          <div className="space-y-2">
            {labItems.map((item, idx) => (
              <div className="grid grid-cols-2 gap-2" key={idx}>
                <input
                  className="input"
                  placeholder="Code (e.g., CBC)"
                  value={item.code}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLabItems((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, code: v } : x))
                    );
                  }}
                />
                <input
                  className="input"
                  placeholder="Display (Complete Blood Count)"
                  value={item.display}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLabItems((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, display: v } : x))
                    );
                  }}
                />
                <select
                  className="select"
                  value={item.priority}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLabItems((arr) =>
                      arr.map((x, i) => (i === idx ? { ...x, priority: v } : x))
                    );
                  }}
                >
                  <option>Routine</option>
                  <option>Urgent</option>
                  <option>Stat</option>
                </select>
                <input
                  className="input"
                  placeholder="Specimen (e.g., Blood)"
                  value={item.specimenType}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLabItems((arr) =>
                      arr.map((x, i) =>
                        i === idx ? { ...x, specimenType: v } : x
                      )
                    );
                  }}
                />
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addLabRow}>
              Add Test
            </button>
          </div>
          <div className="mt-3">
            <textarea
              className="textarea"
              rows={3}
              placeholder="Indication / clinical question"
              value={labIndication}
              onChange={(e) => setLabIndication(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <button className="btn btn-primary" onClick={orderLabs}>
              Order Labs
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <select
            className="select"
            value={imaging.modality}
            onChange={(e) =>
              setImaging((i) => ({ ...i, modality: e.target.value }))
            }
          >
            <option>X-Ray</option>
            <option>CT</option>
            <option>MRI</option>
            <option>Ultrasound</option>
          </select>
          <input
            className="input"
            placeholder="Body part (e.g., Chest)"
            value={imaging.bodyPart}
            onChange={(e) =>
              setImaging((i) => ({ ...i, bodyPart: e.target.value }))
            }
          />
          <select
            className="select"
            value={imaging.priority}
            onChange={(e) =>
              setImaging((i) => ({ ...i, priority: e.target.value }))
            }
          >
            <option>Routine</option>
            <option>Urgent</option>
            <option>Stat</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={imaging.contrast}
              onChange={(e) =>
                setImaging((i) => ({ ...i, contrast: e.target.checked }))
              }
            />{" "}
            Contrast
          </label>
          <textarea
            className="textarea col-span-2"
            rows={3}
            placeholder="Indication / clinical question"
            value={imaging.indicationText}
            onChange={(e) =>
              setImaging((i) => ({ ...i, indicationText: e.target.value }))
            }
          />
          <div className="col-span-2">
            <button className="btn btn-primary" onClick={orderImaging}>
              Order Imaging
            </button>
          </div>
        </div>
      )}
      {message && <p className="text-green-700 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
