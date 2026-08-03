// Builds a polished, branded PDF report for a set of CRM leads (name,
// contact details, priority, follow-up date, and the full dated remarks
// history) using jsPDF + jspdf-autotable, then triggers a download.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { whatsappLink } from "./whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "./config";

const INK = [27, 42, 74];
const GOLD = [200, 155, 60];
const PAPER = [250, 246, 239];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function parseRemarksLog(lead) {
  let log = [];
  if (lead.remarksLog) {
    try {
      const parsed = JSON.parse(lead.remarksLog);
      if (Array.isArray(parsed)) log = parsed;
    } catch {
      // fall through to legacy handling below
    }
  }
  if (log.length === 0 && lead.remarks) {
    log = [{ text: lead.remarks, at: lead.timestamp, by: "" }];
  }
  return [...log].sort((a, b) => new Date(b.at) - new Date(a.at));
}

function parseVisitLog(lead) {
  if (!lead.visitLog) return [];
  try {
    const parsed = JSON.parse(lead.visitLog);
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(b.at) - new Date(a.at));
  } catch {
    return [];
  }
}

function parseCustomFields(lead) {
  if (!lead.customFields) return {};
  try {
    const parsed = JSON.parse(lead.customFields);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parsePhotos(lead) {
  if (!lead.photos) return [];
  try {
    const parsed = JSON.parse(lead.photos);
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 4) : [];
  } catch {
    return [];
  }
}

// Turns an internal field name like "galleryId" into "Gallery ID" for
// display — jsPDF's core fonts can only render plain Latin text reliably,
// so keep this ASCII-only too.
function prettifyKey(key) {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced
    .split(" ")
    .map((w) => (w.toLowerCase() === "id" ? "ID" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// Prefers a manually pasted Google Maps link; then exact GPS coordinates
// from the most recent site visit; then a text-based map search on the
// address, then the general area.
function buildMapUrl(lead, visitLog) {
  if (lead.mapLink && /^https?:\/\//i.test(lead.mapLink.trim())) return lead.mapLink.trim();
  const withCoords = visitLog.find((v) => v.lat && v.lng);
  if (withCoords) return `https://www.google.com/maps?q=${withCoords.lat},${withCoords.lng}`;
  const withAddress = visitLog.find((v) => v.address);
  const query = lead.exactAddress || withAddress?.address || lead.propertyLocation || lead.area;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const STATUS_COLOR = {
  New: [200, 155, 60],
  Contacted: [14, 165, 233],
  "In progress": [139, 92, 246],
  Closed: [16, 185, 129],
  Dropped: [148, 163, 184],
};

// Best-effort image fetch → data URL, for embedding lead photos. Never
// throws — a failed/blocked image just means the report skips it.
async function toDataUrl(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadBrochure(property) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const accent = [31, 111, 92]; // seller green — brand accent for buyer-facing docs

  // Banner
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 84, pageWidth, 2.5, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.1);
  doc.circle(margin + 15, 30, 15, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("MCM", margin + 15, 33, { align: "center" });
  doc.setFontSize(19);
  doc.text(property.title || "Property", margin + 40, 32, { maxWidth: pageWidth - margin * 2 - 40 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("MIDDLE CLASS MEDIATOR  ·  PROPERTY BROCHURE", margin + 40, 50);
  if (property.price) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(property.price, margin + 40, 68);
  }

  let y = 104;

  // Collect + preload images
  let images = [];
  if (property.images) {
    try {
      const parsed = JSON.parse(property.images);
      if (Array.isArray(parsed)) images = parsed.filter(Boolean);
    } catch {
      // fall through
    }
  }
  if (images.length === 0 && property.imageUrl) images = [property.imageUrl];

  const photoDatas = [];
  for (const url of images.slice(0, 4)) {
    const d = await toDataUrl(url);
    if (d) photoDatas.push(d);
  }

  // Big hero photo, full content width
  if (photoDatas.length > 0) {
    const heroW = pageWidth - margin * 2;
    const heroH = 240;
    try {
      doc.setDrawColor(230, 225, 215);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, heroW, heroH, 6, 6, "S");
      doc.addImage(photoDatas[0], "JPEG", margin, y, heroW, heroH, undefined, "FAST");
    } catch {
      // unsupported format — skip, rest of brochure still renders
    }
    y += heroH + 10;

    // Thumbnail filmstrip for any additional photos
    if (photoDatas.length > 1) {
      const thumbs = photoDatas.slice(1);
      const gap = 8;
      const thumbW = (heroW - gap * (thumbs.length - 1)) / thumbs.length;
      const thumbH = 74;
      thumbs.forEach((d, i) => {
        const x = margin + i * (thumbW + gap);
        try {
          doc.setDrawColor(230, 225, 215);
          doc.setLineWidth(0.5);
          doc.roundedRect(x, y, thumbW, thumbH, 4, 4, "S");
          doc.addImage(d, "JPEG", x, y, thumbW, thumbH, undefined, "FAST");
        } catch {
          // skip
        }
      });
      y += thumbH + 18;
    } else {
      y += 8;
    }
  }

  // "Property Details" section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text("Property Details", margin, y);
  doc.setDrawColor(...accent);
  doc.setLineWidth(1);
  doc.line(margin, y + 4, margin + doc.getTextWidth("Property Details"), y + 4);
  y += 18;

  // Key facts, cleanly aligned two-column table
  const facts = [];
  if (property.type) facts.push(["Property type", property.type]);
  if (property.location) facts.push(["Area", property.location]);
  if (property.sqft) facts.push(["Size", `${Number(property.sqft).toLocaleString()} sqft`]);
  if (property.description) facts.push(["Status", property.description]);

  let attributes = {};
  if (property.attributes) {
    try {
      const parsed = JSON.parse(property.attributes);
      if (parsed && typeof parsed === "object") attributes = parsed;
    } catch {
      // fall through
    }
  }
  Object.entries(attributes).forEach(([k, v]) => {
    if (v) facts.push([prettifyKey(k), String(v)]);
  });

  if (facts.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "striped",
      styles: { fontSize: 10.5, cellPadding: 7, textColor: [30, 30, 40] },
      alternateRowStyles: { fillColor: [250, 246, 239] },
      columnStyles: { 0: { fontStyle: "bold", textColor: [80, 80, 90], cellWidth: 160 } },
      body: facts,
    });
    y = doc.lastAutoTable.finalY + 24;
  }

  // Space check before the WhatsApp CTA button
  if (y > pageHeight - 100) {
    doc.addPage();
    y = 60;
  }

  // Prominent clickable "Message us on WhatsApp" button
  const btnH = 40;
  const btnW = pageWidth - margin * 2;
  doc.setFillColor(...accent);
  doc.roundedRect(margin, y, btnW, btnH, 10, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const btnLabel = "Message us on WhatsApp about this property";
  doc.text(btnLabel, margin + btnW / 2, y + btnH / 2 + 4, { align: "center" });
  const waUrl = whatsappLink(
    ADMIN_WHATSAPP_NUMBER,
    `Hi, I'm interested in this property: ${property.title || ""}${property.location ? ` (${property.location})` : ""} — ${property.price || ""}${property.refId ? `\n\nProperty ref: ${property.refId}` : ""}\n\nCan you share more details?`
  );
  doc.link(margin, y, btnW, btnH, { url: waUrl });
  y += btnH + 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 160);
  doc.text("Middle Class Mediator", margin, pageHeight - 20);

  const safeTitle = (property.title || "property").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  doc.save(`${safeTitle}-brochure.pdf`);
}

export async function downloadReport({ roleLabel, accent, fields, leads, filterLabel }) {
  const [r, g, b] = hexToRgb(accent);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const generatedAt = new Date().toLocaleString();

  const counts = leads.reduce((acc, l) => {
    const s = l.status || "New";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  function drawBanner() {
    // Role-colored banner with a subtle depth overlay and a gold accent stripe
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 96, "F");
    doc.setFillColor(0, 0, 0);
    doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.rect(0, 60, pageWidth, 36, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));
    doc.setFillColor(...GOLD);
    doc.rect(0, 96, pageWidth, 2.5, "F");

    // Circular MCM badge
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.1);
    doc.circle(margin + 15, 32, 15, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("MCM", margin + 15, 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(`${roleLabel} CRM Report`, margin + 40, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(
      `${filterLabel || "All leads"}  ·  ${leads.length} lead${leads.length === 1 ? "" : "s"}  ·  Generated ${generatedAt}`,
      margin + 40,
      44
    );

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("MIDDLE CLASS MEDIATOR  ·  CONFIDENTIAL CRM REPORT", margin + 40, 58);

    // Status summary pills
    let px = margin;
    const py = 72;
    doc.setFontSize(7.5);
    Object.entries(counts).forEach(([status, count]) => {
      const label = `${status}: ${count}`;
      const w = doc.getTextWidth(label) + 14;
      doc.setFillColor(255, 255, 255);
      doc.setGState(new doc.GState({ opacity: 0.18 }));
      doc.roundedRect(px, py, w, 16, 8, 8, "F");
      doc.setGState(new doc.GState({ opacity: 1 }));
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(label, px + w / 2, py + 11, { align: "center" });
      px += w + 6;
    });

    doc.setTextColor(20, 20, 30);
  }

  function drawFooter(pageNum, totalPages) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 160);
    doc.text("Middle Class Mediator", margin, pageHeight - 20);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: "right" });
    doc.setDrawColor(230, 225, 215);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
  }

  drawBanner();
  let y = 128;

  if (leads.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 130);
    doc.text("No leads in this view.", margin, y);
  }

  for (const lead of leads) {
    const visitLog = parseVisitLog(lead);
    const photoUrls = parsePhotos(lead).length ? parsePhotos(lead) : (visitLog.find((v) => v.photoUrl)?.photoUrl ? [visitLog.find((v) => v.photoUrl).photoUrl] : []);
    const photoDatas = [];
    for (const url of photoUrls) {
      const d = await toDataUrl(url);
      if (d) photoDatas.push(d);
    }
    const hasPhotos = photoDatas.length > 0;
    const thumbSize = 62;
    const photoRowH = hasPhotos ? thumbSize + 12 : 0;

    // Rough space check before starting a new lead card
    if (y > pageHeight - 190 - photoRowH) {
      doc.addPage();
      drawBanner();
      y = 128;
    }

    const cardTop = y;
    const status = lead.status || "New";
    const sColor = STATUS_COLOR[status] || STATUS_COLOR.New;
    const priority = Math.max(0, Math.min(5, Number(lead.priority) || 0));

    // Card background + left accent bar
    doc.setFillColor(...PAPER);
    doc.roundedRect(margin, cardTop, pageWidth - margin * 2, 34, 6, 6, "F");
    doc.setFillColor(r, g, b);
    doc.rect(margin, cardTop, 4, 34, "F");

    const textX = margin + 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 30);
    doc.text(lead.name || "(no name)", textX, cardTop + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 120);
    doc.text(`#${lead.id}`, textX, cardTop + 28);

    // Status pill
    const statusLabel = status;
    doc.setFontSize(8);
    const pillW = doc.getTextWidth(statusLabel) + 16;
    const pillX = pageWidth - margin - pillW - 70;
    doc.setFillColor(...sColor);
    doc.roundedRect(pillX, cardTop + 8, pillW, 15, 7.5, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, pillX + pillW / 2, cardTop + 18, { align: "center" });

    // Priority — drawn as filled/outline circle pips, not star glyphs (jsPDF's
    // core fonts can't render ★/☆ or emoji reliably; vector shapes always work)
    const pipR = 3;
    const pipGap = 9;
    let pipX = pageWidth - margin - pipR - (5 - 1) * pipGap;
    for (let i = 0; i < 5; i++) {
      if (i < priority) {
        doc.setFillColor(...GOLD);
        doc.circle(pipX, cardTop + 16, pipR, "F");
      } else {
        doc.setDrawColor(210, 205, 195);
        doc.setLineWidth(0.7);
        doc.circle(pipX, cardTop + 16, pipR, "S");
      }
      pipX += pipGap;
    }

    y = cardTop + 34 + 10;

    // Clickable owner phone (→ WhatsApp) and map location links
    if (lead.phone) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      const phoneLabel = `${lead.phone} — Message on WhatsApp`;
      doc.textWithLink(phoneLabel, textX, y, { url: whatsappLink(lead.phone, `Hi ${lead.name || ""}, following up on your property`) });
      const phoneW = doc.getTextWidth(phoneLabel);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.6);
      doc.line(textX, y + 2, textX + phoneW, y + 2);
    }

    const mapUrl = buildMapUrl(lead, visitLog);
    if (mapUrl) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      const mapLabel = "View exact location on map";
      const mapX = pageWidth - margin - doc.getTextWidth(mapLabel);
      doc.textWithLink(mapLabel, mapX, y, { url: mapUrl });
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.6);
      doc.line(mapX, y + 2, mapX + doc.getTextWidth(mapLabel), y + 2);
    }

    if (lead.phone || mapUrl) y += 16;

    // Photo strip (up to 4)
    if (hasPhotos) {
      let px = textX;
      photoDatas.forEach((d) => {
        try {
          doc.setDrawColor(230, 225, 215);
          doc.setLineWidth(0.5);
          doc.roundedRect(px, y, thumbSize, thumbSize, 4, 4, "S");
          doc.addImage(d, "JPEG", px + 1, y + 1, thumbSize - 2, thumbSize - 2, undefined, "FAST");
        } catch {
          // unsupported image format — skip silently, rest of the report still renders
        }
        px += thumbSize + 8;
      });
      y += thumbSize + 12;
    }

    const detailRows = fields
      .filter(([key]) => lead[key])
      .map(([key, label]) => [label, String(lead[key])]);
    if (lead.area) detailRows.push(["Area / locality", lead.area]);
    const visitAddress = visitLog.find((v) => v.address)?.address;
    const exactAddress = lead.exactAddress || visitAddress;
    const alreadyShownAsLocation = fields.some(([key]) => key === "propertyLocation") && lead.propertyLocation === exactAddress;
    if (exactAddress && !alreadyShownAsLocation) detailRows.push(["Exact address", exactAddress]);
    if (lead.budgetValue) detailRows.push(["Budget (₹)", Number(lead.budgetValue).toLocaleString()]);
    if (lead.sqft) detailRows.push(["Size (sqft)", Number(lead.sqft).toLocaleString()]);
    if (lead.followUpDate) detailRows.push(["Next follow-up", formatDate(lead.followUpDate)]);
    Object.entries(parseCustomFields(lead)).forEach(([key, value]) => {
      if (key === "galleryId") return; // internal linkage, not useful in a lead report
      if (value) detailRows.push([prettifyKey(key), String(value)]);
    });

    if (detailRows.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "plain",
        styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 }, textColor: [30, 30, 40] },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [110, 110, 120], cellWidth: 130 },
        },
        body: detailRows,
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    const remarksLog = parseRemarksLog(lead);
    const remarkRows = remarksLog.length
      ? remarksLog.map((rm) => [formatDateTime(rm.at), rm.by || "—", rm.text])
      : [["—", "—", "No remarks logged yet."]];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, top: 130 },
      head: [["Date & time", "By", "Remark"]],
      body: remarkRows,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 5, textColor: [30, 30, 40] },
      alternateRowStyles: { fillColor: [250, 246, 239] },
      headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 70 },
      },
      didDrawPage: () => {
        drawBanner();
      },
    });
    y = doc.lastAutoTable.finalY + 24;

    // Divider between lead cards
    doc.setDrawColor(230, 225, 215);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 12, pageWidth - margin, y - 12);
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilter = (filterLabel || "all").toLowerCase().replace(/\s+/g, "-");
  doc.save(`${roleLabel.toLowerCase()}-crm-report-${safeFilter}-${dateStr}.pdf`);
}
