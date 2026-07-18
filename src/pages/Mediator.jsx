import { useState } from "react";
import Seal from "../components/Seal";
import ImageUploader from "../components/ImageUploader";
import { addMediatorLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";

const ACCENT = "#2D4373";

export default function Mediator() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    instaRef: "",
    propertyTitle: "",
    location: "",
    price: "",
    message: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.propertyTitle) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await addMediatorLead({ ...form, imageUrl });
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Could not save — check your connection and try again.");
      setStatus("error");
    }
  }

  const waMessage =
    `New mediator lead — ${form.propertyTitle || "(property)"}\n` +
    `From: ${form.name} (${form.phone})\n` +
    `Insta reference: ${form.instaRef || "—"}\n` +
    `Location: ${form.location || "—"}\n` +
    `Price: ${form.price || "—"}\n` +
    `Note: ${form.message || "—"}`;

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <Seal label="Received" color={ACCENT} size={80} rotate={-10} />
        <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
          Saved to our records
        </h1>
        <p className="text-ink/60 mb-7 leading-relaxed">
          Your listing for <strong>{form.propertyTitle}</strong> is logged. Send it to us on
          WhatsApp now so we can start the conversation right away.
        </p>
        <a
          href={whatsappLink(ADMIN_WHATSAPP_NUMBER, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          Message admin on WhatsApp
        </a>
        <a href="/mediator" className="block mt-4 text-sm text-ink/50 hover:text-ink">
          Submit another property
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-20">
      <div className="pt-10 pb-6 flex items-center gap-4">
        <Seal label="Mediator" color={ACCENT} size={64} rotate={-8} />
        <div>
          <p className="field-label mb-0.5">Bring the deal</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Mediator details</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-ledger p-6 space-y-5">
        <div>
          <label className="field-label">Your name</label>
          <input className="field-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" required />
        </div>
        <div>
          <label className="field-label">Your phone / WhatsApp number</label>
          <input className="field-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit number" required />
        </div>
        <div>
          <label className="field-label">Which Instagram video / post?</label>
          <input className="field-input" value={form.instaRef} onChange={(e) => update("instaRef", e.target.value)} placeholder="Paste the reel link or describe it" />
        </div>
        <div>
          <label className="field-label">Property title</label>
          <input className="field-input" value={form.propertyTitle} onChange={(e) => update("propertyTitle", e.target.value)} placeholder="e.g. 2BHK near Anna Nagar" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Location</label>
            <input className="field-input" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Area, city" />
          </div>
          <div>
            <label className="field-label">Price</label>
            <input className="field-input" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="₹ amount" />
          </div>
        </div>
        <div>
          <label className="field-label">Message for admin</label>
          <textarea className="field-input min-h-[90px]" value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Anything admin should know" />
        </div>
        <div>
          <label className="field-label">Property photo</label>
          <ImageUploader accentColor={ACCENT} onUploaded={setImageUrl} />
        </div>

        {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

        <button type="submit" disabled={status === "saving"} className="btn-primary w-full">
          {status === "saving" ? "Saving…" : "Save & continue to WhatsApp"}
        </button>
      </form>
    </div>
  );
}
