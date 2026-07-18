import { useRef, useState } from "react";
import { uploadImage } from "../lib/cloudinary";

export default function ImageUploader({ onUploaded, accentColor = "#1B2A4A" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setProgress(0);
    try {
      const url = await uploadImage(file, setProgress);
      onUploaded(url);
      setProgress(null);
    } catch (err) {
      setError(err.message || "Upload failed — check your Cloudinary settings.");
      setProgress(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border-2 border-dashed border-ink/25 hover:border-ink/50 transition bg-white/50 p-4 flex items-center gap-4 text-left"
      >
        {preview ? (
          <img src={preview} alt="Selected property" className="w-16 h-16 rounded-lg object-cover border border-ink/10" />
        ) : (
          <span
            className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
          >
            📷
          </span>
        )}
        <span className="text-sm">
          <span className="font-semibold text-ink block">
            {preview ? "Change photo" : "Add a property photo"}
          </span>
          <span className="text-ink/50">JPG or PNG, tap to choose</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {progress !== null && (
        <div className="mt-2 h-1.5 rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: accentColor }}
          />
        </div>
      )}
      {error && <p className="text-xs text-buyer mt-2">{error}</p>}
    </div>
  );
}
