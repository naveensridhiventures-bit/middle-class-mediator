import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./config";

/**
 * Rewrites a Cloudinary secure_url to request an optimized, resized
 * version on the fly (smaller file size, auto format/quality) instead of
 * the full-resolution original — this is what actually makes the gallery
 * and CRM load quickly, since photos straight from a phone camera can be
 * several MB each. Safe no-op if the URL isn't a recognizable Cloudinary
 * upload URL (e.g. an external or already-transformed link).
 */
export function optimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== "string") return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}w_${width},q_auto,f_auto,c_limit/${url.slice(insertAt)}`;
}

/**
 * Uploads a File to Cloudinary using an unsigned upload preset
 * and returns the public secure URL.
 */
export async function uploadImage(file, onProgress) {
  if (!file) return null;

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "middle-class-mediator");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || "Image upload failed"));
        }
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Network error during image upload"));
    xhr.send(formData);
  });
}
