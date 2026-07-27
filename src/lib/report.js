// Builds an attractive PDF report for a set of CRM leads (name, contact
// details, priority, follow-up date, and the full dated remarks history)
// using jsPDF + jspdf-autotable, then triggers a download.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

function starString(priority) {
  const p = Math.max(0, Math.min(5, Number(priority) || 0));
  return "\u2605".repeat(p) + "\u2606".repeat(5 - p);
}

export function downloadReport({ roleLabel, accent, fields, leads, filterLabel }) {
  const [r, g, b] = hexToRgb(accent);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  function drawHeader() {
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 82, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`${roleLabel} CRM Report`, margin, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const generatedAt = new Date().toLocaleString();
    doc.text(
      `${filterLabel || "All leads"}  ·  Generated ${generatedAt}  ·  ${leads.length} lead${leads.length === 1 ? "" : "s"}`,
      margin,
      56
    );
    doc.setTextColor(20, 20, 30);
  }

  drawHeader();
  let y = 110;

  if (leads.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("No leads in this view.", margin, y);
  }

  leads.forEach((lead) => {
    // Rough space check before starting a new lead block
    if (y > pageHeight - 160) {
      doc.addPage();
      y = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 30);
    doc.text(lead.name || "(no name)", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 120);
    doc.text(
      `#${lead.id}  ·  ${lead.phone || ""}  ·  Status: ${lead.status || "New"}  ·  Priority: ${starString(lead.priority)}`,
      margin,
      y + 14
    );
    y += 26;

    const detailRows = fields
      .filter(([key]) => lead[key])
      .map(([key, label]) => [label, String(lead[key])]);
    if (lead.followUpDate) {
      detailRows.push(["Next follow-up", formatDate(lead.followUpDate)]);
    }

    if (detailRows.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: [30, 30, 40] },
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
      margin: { left: margin, right: margin, top: 100 },
      head: [["Date & time", "By", "Remark"]],
      body: remarkRows,
      styles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 30, 40] },
      headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 70 },
      },
      didDrawPage: () => {
        // Redraw the colored header banner on any new page autoTable creates
        drawHeader();
      },
    });
    y = doc.lastAutoTable.finalY + 22;
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilter = (filterLabel || "all").toLowerCase().replace(/\s+/g, "-");
  doc.save(`${roleLabel.toLowerCase()}-crm-report-${safeFilter}-${dateStr}.pdf`);
}
