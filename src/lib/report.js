// Builds a polished, branded PDF report for a set of CRM leads (name,
// contact details, priority, follow-up date, and the full dated remarks
// history) using jsPDF + jspdf-autotable, then triggers a download.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    const photoUrl = visitLog.find((v) => v.photoUrl)?.photoUrl;
    const photoData = photoUrl ? await toDataUrl(photoUrl) : null;
    const cardPhotoH = photoData ? 64 : 0;

    // Rough space check before starting a new lead card
    if (y > pageHeight - 190) {
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

    const textX = margin + 14 + (photoData ? cardPhotoH + 10 : 0);

    if (photoData) {
      try {
        doc.addImage(photoData, "JPEG", margin + 12, cardTop + 6, cardPhotoH - 12, cardPhotoH - 12, undefined, "FAST");
      } catch {
        // unsupported image format — skip silently, text content still renders
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 30);
    doc.text(lead.name || "(no name)", textX, cardTop + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 120);
    doc.text(`#${lead.id}  ·  ${lead.phone || ""}`, textX, cardTop + 28);

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

    // Priority stars
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text("\u2605".repeat(priority) + "", pageWidth - margin - 55, cardTop + 18);
    doc.setTextColor(210, 205, 195);
    doc.text("\u2605".repeat(5 - priority), pageWidth - margin - 55 + doc.getTextWidth("\u2605".repeat(priority)), cardTop + 18);

    y = cardTop + Math.max(34, cardPhotoH + 6) + 8;

    const detailRows = fields
      .filter(([key]) => lead[key])
      .map(([key, label]) => [label, String(lead[key])]);
    if (lead.area) detailRows.push(["Area / locality", lead.area]);
    if (lead.budgetValue) detailRows.push(["Budget (₹)", Number(lead.budgetValue).toLocaleString()]);
    if (lead.sqft) detailRows.push(["Size (sqft)", Number(lead.sqft).toLocaleString()]);
    if (lead.followUpDate) detailRows.push(["Next follow-up", formatDate(lead.followUpDate)]);
    Object.entries(parseCustomFields(lead)).forEach(([key, value]) => {
      if (value) detailRows.push([key, String(value)]);
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
