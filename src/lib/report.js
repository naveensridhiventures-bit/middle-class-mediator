// Builds a polished, self-contained HTML report (opens in any browser, and
// can be "Print to PDF" from there) for a set of CRM leads, then triggers a
// download. No external dependencies — everything is inlined.

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatDateTime(iso) {
  if (!iso) return "";
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
      // fall through
    }
  }
  // Legacy single-string "remarks" field from before history existed
  if (log.length === 0 && lead.remarks) {
    log = [{ text: lead.remarks, at: lead.timestamp }];
  }
  return [...log].sort((a, b) => new Date(b.at) - new Date(a.at));
}

function starString(priority) {
  const p = Math.max(0, Math.min(5, Number(priority) || 0));
  return "★".repeat(p) + "☆".repeat(5 - p);
}

export function buildReportHtml({ roleLabel, accent, fields, leads, filterLabel }) {
  const generatedAt = new Date().toLocaleString();
  const rows = leads
    .map((lead) => {
      const remarksLog = parseRemarksLog(lead);
      const detailRows = fields
        .filter(([key]) => lead[key])
        .map(([key, label]) => `<tr><td class="dt-label">${esc(label)}</td><td>${esc(lead[key])}</td></tr>`)
        .join("");
      const remarksRows = remarksLog.length
        ? remarksLog
            .map((r) => `<tr><td class="remark-date">${esc(formatDateTime(r.at))}</td><td>${esc(r.text)}</td></tr>`)
            .join("")
        : `<tr><td colspan="2" class="muted">No remarks logged yet.</td></tr>`;

      return `
        <section class="lead-card">
          <div class="lead-head">
            <div>
              <h3>${esc(lead.name)}</h3>
              <p class="muted">#${esc(lead.id)} · Submitted ${esc(formatDateTime(lead.timestamp))}</p>
            </div>
            <div class="lead-head-right">
              <span class="badge status-${esc((lead.status || "New").replace(/\s+/g, "-").toLowerCase())}">${esc(lead.status || "New")}</span>
              <span class="stars" title="Priority">${starString(lead.priority)}</span>
            </div>
          </div>
          <table class="detail-table">
            <tr><td class="dt-label">Phone</td><td>${esc(lead.phone)}</td></tr>
            ${detailRows}
            ${lead.followUpDate ? `<tr><td class="dt-label">Next follow-up</td><td class="followup">${esc(formatDate(lead.followUpDate))}</td></tr>` : ""}
          </table>
          <p class="remarks-title">Remarks history</p>
          <table class="remarks-table">
            ${remarksRows}
          </table>
        </section>`;
    })
    .join("\n");

  const counts = leads.reduce((acc, l) => {
    const s = l.status || "New";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statBadges = Object.entries(counts)
    .map(([status, count]) => `<span class="stat-pill">${esc(status)}: <strong>${count}</strong></span>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(roleLabel)} CRM Report</title>
<style>
  :root { --accent: ${accent}; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    background: #FAF6EF;
    color: #1B2A4A;
    margin: 0;
    padding: 32px;
  }
  .report-header {
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #1B2A4A));
    color: white;
    border-radius: 20px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }
  .report-header h1 { margin: 0 0 4px; font-size: 26px; }
  .report-header p { margin: 0; opacity: 0.85; font-size: 13px; }
  .stat-row { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; }
  .stat-pill {
    background: rgba(255,255,255,0.18);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .lead-card {
    background: white;
    border: 1px solid rgba(27,42,74,0.1);
    border-left: 5px solid var(--accent);
    border-radius: 16px;
    padding: 18px 22px;
    margin-bottom: 16px;
    box-shadow: 0 1px 0 rgba(27,42,74,0.05);
  }
  .lead-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  .lead-head h3 { margin: 0; font-size: 17px; }
  .lead-head-right { display: flex; align-items: center; gap: 10px; }
  .muted { color: rgba(27,42,74,0.5); font-size: 12px; margin: 2px 0 0; }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    background: rgba(27,42,74,0.08);
  }
  .status-new { background: #C89B3C33; color: #9C7726; }
  .status-contacted { background: #0ea5e933; color: #075985; }
  .status-in-progress { background: #8b5cf633; color: #5b21b6; }
  .status-closed { background: #10b98133; color: #065f46; }
  .status-dropped { background: #1B2A4A22; color: #1B2A4A88; }
  .stars { color: #C89B3C; font-size: 15px; letter-spacing: 1px; }
  .detail-table, .remarks-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  .detail-table td { padding: 4px 8px 4px 0; vertical-align: top; }
  .dt-label { color: rgba(27,42,74,0.45); font-weight: 600; width: 160px; }
  .followup { font-weight: 700; color: var(--accent); }
  .remarks-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(27,42,74,0.4); font-weight: 700; margin: 14px 0 4px; }
  .remarks-table { border-top: 1px solid rgba(27,42,74,0.08); }
  .remarks-table td { padding: 6px 8px 6px 0; border-bottom: 1px dashed rgba(27,42,74,0.08); }
  .remark-date { color: rgba(27,42,74,0.5); width: 170px; white-space: nowrap; font-size: 12px; }
  @media print {
    body { padding: 0; background: white; }
    .lead-card { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1>${esc(roleLabel)} CRM Report${filterLabel ? ` — ${esc(filterLabel)}` : ""}</h1>
    <p>Generated ${esc(generatedAt)} · ${leads.length} lead${leads.length === 1 ? "" : "s"}</p>
    <div class="stat-row">${statBadges}</div>
  </div>
  ${rows || '<p class="muted">No leads in this view.</p>'}
</body>
</html>`;
}

export function downloadReport({ roleLabel, accent, fields, leads, filterLabel }) {
  const html = buildReportHtml({ roleLabel, accent, fields, leads, filterLabel });
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeFilter = (filterLabel || "all").toLowerCase().replace(/\s+/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${roleLabel.toLowerCase()}-crm-report-${safeFilter}-${dateStr}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
