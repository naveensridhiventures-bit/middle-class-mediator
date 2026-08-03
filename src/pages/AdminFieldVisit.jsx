import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, MapPin, CheckCircle2 } from "lucide-react";
import { addSellerLead, adminAddVisit, adminUpdateLead } from "../lib/api";
import { uploadImage } from "../lib/cloudinary";

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available on this device/browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Couldn't get your location — check location permission for this site.")),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return data.display_name || "";
}

const emptyForm = { ownerName: "", phone: "", area: "" };

export default function AdminFieldVisit() {
  const [password, setPassword] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { name, at }

  useEffect(() => {
    const pw = sessionStorage.getItem("mcm_admin_pw");
    if (!pw) {
      navigate("/control");
      return;
    }
    setPassword(pw);
  }, [navigate]);

  if (!password) return null;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleCaptureLocation() {
    setLocating(true);
    setError("");
    try {
      const loc = await getCurrentLocation();
      setCoords(loc);
      try {
        const auto = await reverseGeocode(loc.lat, loc.lng);
        if (auto) setAddress(auto);
      } catch {
        // reverse geocoding failed — coords are still captured, admin can type the address manually
      }
    } catch (err) {
      setError(err.message || "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!photo) {
      setError("Take a photo first.");
      return;
    }
    if (!address.trim() && !coords) {
      setError("Capture your live location or type the address manually.");
      return;
    }
    setError("");
    setCreating(true);
    setUploadPct(0);
    try {
      const adminName = localStorage.getItem("mcm_admin_name") || "";
      const photoUrl = await uploadImage(photo, setUploadPct);

      const { id } = await addSellerLead({
        name: form.ownerName.trim() || "Field visit lead",
        phone: form.phone.trim(),
        propertyType: "",
        propertyLocation: address.trim(),
        propertyStatus: "",
        expectedPrice: "",
        ownership: "",
        timeline: "",
      });

      await adminAddVisit(
        password,
        "Sellers",
        id,
        { photoUrl, lat: coords?.lat || "", lng: coords?.lng || "", address: address.trim() },
        adminName
      );

      if (form.area.trim()) {
        await adminUpdateLead(password, "Sellers", id, { area: form.area.trim() });
      }

      setSuccess({ name: form.ownerName.trim() || "Field visit lead", at: new Date() });
      setForm(emptyForm);
      setPhoto(null);
      setPhotoPreview("");
      setCoords(null);
      setAddress("");
    } catch (err) {
      setError(err.message || "Couldn't save this visit.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-md mx-auto px-5 py-10">
        <p className="field-label mb-0.5">Admin · hidden field tool</p>
        <h1 className="font-display font-semibold text-2xl text-ink mb-1">Log a field visit</h1>
        <p className="text-sm text-ink/50 mb-6">
          Fill this in on-site. It creates a new seller lead immediately, with the photo, location,
          and address attached — you can fill in the rest of the details later from the Seller CRM.
        </p>

        <div className="card-ledger p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Property owner name</label>
              <input className="field-input !py-2.5 text-sm" placeholder="Owner's name" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Phone (optional)</label>
              <input className="field-input !py-2.5 text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Area / locality</label>
            <input className="field-input !py-2.5 text-sm" placeholder="e.g. Ambattur" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <label className="btn-ghost !py-2.5 !px-4 text-sm cursor-pointer flex items-center gap-1.5 shrink-0">
              <Camera size={14} strokeWidth={2.25} />
              {photo ? "Retake photo" : "Take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1.5">Location &amp; address</label>
            <button
              onClick={handleCaptureLocation}
              disabled={locating}
              className="btn-ghost w-full !py-2.5 text-sm flex items-center justify-center gap-1.5 mb-2"
            >
              <MapPin size={14} strokeWidth={2.25} />
              {locating ? "Getting live location…" : coords ? "Re-capture live location" : "Capture live location"}
            </button>
            {coords && (
              <p className="text-[11px] text-ink/40 mb-2">
                📍 Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <input
              className="field-input !py-2.5 text-sm"
              placeholder="Address (auto-filled after capture, or type manually)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-buyer">{error}</p>}

          <button onClick={handleSubmit} disabled={!photo || creating} className="btn-primary w-full !py-3">
            {creating ? (uploadPct > 0 && uploadPct < 100 ? `Uploading photo… ${uploadPct}%` : "Saving…") : "Save this visit"}
          </button>
        </div>

        <Link to="/control/dashboard" className="block text-center text-xs text-ink/40 hover:text-ink mt-6">
          ← Back to Command Center
        </Link>
      </div>

      {/* Success popup */}
      {success && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setSuccess(null)}>
          <div className="bg-paper rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CheckCircle2 size={40} className="text-seller mx-auto mb-3" strokeWidth={1.5} />
            <h2 className="font-display font-semibold text-xl text-ink mb-1">Visit logged</h2>
            <p className="text-sm text-ink/60 mb-1">
              <strong>{success.name}</strong> was added to the Seller CRM.
            </p>
            <p className="text-xs text-ink/40 mb-6">
              {success.at.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
              {success.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSuccess(null)} className="btn-ghost flex-1 !py-2.5 text-sm">
                Log another
              </button>
              <Link to="/control/dashboard" className="btn-primary flex-1 !py-2.5 text-sm text-center">
                Go to Seller CRM
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
