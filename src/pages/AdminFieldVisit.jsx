import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, MapPin, Check } from "lucide-react";
import { addSellerLead, adminAddVisit, adminUpdateLead } from "../lib/api";
import { uploadImage } from "../lib/cloudinary";
import { COLORS } from "../lib/theme";
import BrandHeader from "../components/wizard/BrandHeader";
import { TextInput } from "../components/admin/ui";
import { btnDark, btnOutline } from "../components/admin/styles";

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
    <div className="min-h-screen bg-canvas sm:py-8">
      <div
        className="mx-auto max-w-md min-h-[100dvh] sm:min-h-0 bg-surface sm:rounded-[2rem] sm:ring-8 sm:ring-[#EDE7DF] sm:shadow-[0_28px_60px_-24px_rgba(27,42,74,0.35)]"
        style={{ "--accent": COLORS.teal }}
      >
        <BrandHeader color={COLORS.teal} className="sm:rounded-t-[2rem]" />

        <div className="px-5 pt-6 pb-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: COLORS.teal }}>Field visit</p>
          <h1 className="mt-2 font-display font-bold text-[1.6rem] leading-tight text-ink">Log a field visit</h1>
          <p className="mt-2 text-sm text-ink/60 leading-relaxed">
            Fill this in on site. It creates a new seller lead right away, with the photo and location attached. Add the rest of the details later from the Sellers tab.
          </p>

          <div className="mt-6 grid gap-4">
            <TextInput label="Property owner name" placeholder="Owner's name" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            <TextInput label="Phone (optional)" type="tel" inputMode="tel" placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <TextInput label="Area / locality" placeholder="e.g. Ambattur" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <label className={`${btnOutline} cursor-pointer shrink-0`}>
              <Camera size={15} strokeWidth={2.25} />
              {photo ? "Retake photo" : "Take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover" />}
          </div>

          <div className="mt-6">
            <button onClick={handleCaptureLocation} disabled={locating} className={`${btnOutline} w-full`}>
              <MapPin size={15} strokeWidth={2.25} />
              {locating ? "Getting live location…" : coords ? "Re-capture live location" : "Capture live location"}
            </button>
            {coords && (
              <p className="text-[11px] text-ink/50 mt-2">
                Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <div className="mt-3">
              <TextInput label="Address" placeholder="Auto-filled after capture, or type it" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {error && <p className="alert-error mt-5">{error}</p>}

          <button onClick={handleSubmit} disabled={!photo || creating} className={`${btnDark} w-full !h-14 mt-6`}>
            {creating ? (uploadPct > 0 && uploadPct < 100 ? `Uploading photo… ${uploadPct}%` : "Saving…") : "Save this visit"}
          </button>

          <Link to="/control/dashboard" className="block text-center text-xs text-ink/55 hover:text-ink mt-6">
            ← Back to command center
          </Link>
        </div>
      </div>

      {/* Success popup */}
      {success && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-5" onClick={() => setSuccess(null)}>
          <div role="dialog" aria-modal="true" aria-label="Visit logged" className="bg-surface rounded-[1.75rem] max-w-sm w-full p-7 text-center shadow-2xl animate-step" onClick={(e) => e.stopPropagation()}>
            <span className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: COLORS.sage }}>
              <Check size={30} className="text-white" strokeWidth={3} />
            </span>
            <h2 className="font-display font-bold text-[1.3rem] text-ink mt-4">Visit logged</h2>
            <p className="text-sm text-ink/65 mt-1.5">
              <strong>{success.name}</strong> was added to the Sellers tab.
            </p>
            <p className="text-xs text-ink/50 mt-1 mb-6">
              {success.at.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
              {success.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setSuccess(null)} className={`${btnOutline} flex-1`}>Log another</button>
              <Link to="/control/dashboard" className={`${btnDark} flex-1`}>Open Sellers</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
