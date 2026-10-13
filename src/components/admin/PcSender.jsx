import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Send, Square, Check, AlertTriangle, Loader2, FlaskConical, Terminal } from "lucide-react";
import { renderMessage, SHEET, logSent } from "../../lib/broadcast";
import { adminQueueBroadcast, adminListBroadcasts, adminGetBroadcast, adminCancelBroadcast, adminUpdateLead } from "../../lib/api";
import { btnGreen, btnOutline, adminInputCls } from "./styles";

const ACCENT = "#1E9E5A";
const LIVE = new Set(["queued", "running"]);
const ONLINE_MS = 45000;

const STATUS_LABEL = { queued: "Waiting for your PC", running: "Sending…", done: "Finished", failed: "Failed", cancelled: "Cancelled" };
const ITEM_LABEL = { pending: "Waiting", sending: "Sending", sent: "Sent", failed: "Failed", skipped: "Skipped" };

/**
 * Hands the ticked people to the Adverzo Dispatch Console running on the admin's
 * PC. The console picks the job up and sends every message through WhatsApp Web
 * automatically — this panel just queues it and shows live progress.
 */
export default function PcSender({ queue, template, adminName, password, audience, markContacted }) {
  const [info, setInfo] = useState(null); // { jobs, agentSeen, agentNote, now }
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [openJob, setOpenJob] = useState(null); // job id whose people are shown
  const [detail, setDetail] = useState(null);
  const [watched, setWatched] = useState(null); // last job we saw running, so we can wrap it up when it ends
  const [skewMs, setSkewMs] = useState(0);
  const handled = useRef(new Set());
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const d = await adminListBroadcasts(password);
      if (!mounted.current) return;
      setInfo(d);
      setSkewMs(Date.now() - Number(d.now || Date.now()));
      setErr("");
    } catch (e) {
      if (mounted.current) setErr(e.message || "Could not reach the server.");
    }
  }, [password]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  const jobs = info?.jobs || [];
  const live = jobs.find((j) => LIVE.has(j.status));

  // Poll faster while something is being sent.
  useEffect(() => {
    const t = setInterval(load, live ? 4000 : 12000);
    return () => clearInterval(t);
  }, [load, live]);

  // Per-person results for the job being watched.
  useEffect(() => { if (live) setWatched(live.id); }, [live]);
  const watchId = openJob || live?.id || watched;
  useEffect(() => {
    if (!watchId) { setDetail(null); return; }
    let stop = false;
    adminGetBroadcast(password, watchId).then((d) => !stop && setDetail(d)).catch(() => {});
    return () => { stop = true; };
  }, [watchId, password, info]);

  // When a job ends, remember who got it and move "New" leads to "Contacted".
  useEffect(() => {
    if (!detail || LIVE.has(detail.job.status) || handled.current.has(detail.job.id)) return;
    handled.current.add(detail.job.id);
    detail.items.filter((i) => i.status === "sent" && i.role && i.leadId).forEach((i) => {
      logSent(`${i.role}:${i.leadId}`, detail.job.message);
      const lead = queue.find((r) => r.key === `${i.role}:${i.leadId}`)?.lead;
      if (markContacted && lead && (lead.status || "New") === "New" && SHEET[i.role]) {
        adminUpdateLead(password, SHEET[i.role], i.leadId, { status: "Contacted" }).catch(() => {});
      }
    });
  }, [detail, queue, markContacted, password]);

  const seen = Number(info?.agentSeen || 0);
  const online = seen > 0 && Date.now() - skewMs - seen < ONLINE_MS;
  const agentNote = online ? info?.agentNote || "" : "";

  async function queueNow(items, name, audienceText) {
    setBusy(true);
    setNotice("");
    try {
      const out = await adminQueueBroadcast(password, { name, message: template, audience: audienceText, items });
      setNotice(`Queued ${out.total} ${out.total === 1 ? "person" : "people"}${out.skipped ? ` (${out.skipped} skipped: no valid number or duplicate)` : ""}.`);
      setOpenJob(null);
      await load();
    } catch (e) {
      setNotice(e.message || "Could not queue the broadcast.");
    } finally {
      setBusy(false);
    }
  }

  const toItem = (r) => ({ role: r.role, leadId: r.lead.id, name: r.lead.name || "", phone: r.wa, text: renderMessage(template, r.lead, adminName) });

  const start = () => {
    if (!queue.length || live) return;
    const big = queue.length > 40 ? `\n\nThat is a big batch — WhatsApp can restrict accounts that message many people quickly.` : "";
    if (!window.confirm(`Queue ${queue.length} message${queue.length === 1 ? "" : "s"} for your PC?\n\nYour Dispatch Console will take over the mouse and keyboard and send them one by one.${big}`)) return;
    queueNow(queue.map(toItem), `${audience} (${queue.length})`.slice(0, 120), audience);
  };

  const startTest = () => {
    const phone = testPhone.replace(/\D/g, "");
    if (phone.length < 10) { setNotice("Enter a 10-digit number to test with."); return; }
    const sample = queue[0]?.lead || { name: "Test" };
    queueNow([{ role: "", leadId: "", name: "Test", phone, text: renderMessage(template, sample, adminName) }], "Test message", "Test to one number");
  };

  async function cancel(id) {
    if (!window.confirm("Stop this broadcast? People not yet messaged will be skipped.")) return;
    try { await adminCancelBroadcast(password, id); await load(); } catch (e) { setNotice(e.message || "Could not cancel."); }
  }

  const pct = (j) => (j.total ? Math.round(((Number(j.sent) + Number(j.failed)) / j.total) * 100) : 0);

  return (
    <div>
      {/* connection */}
      <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${online ? "border-whatsapp/30 bg-whatsapp/[0.07]" : "border-ink/10 bg-white"}`}>
        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${online ? "bg-whatsapp animate-pulse" : "bg-ink/25"}`} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink flex items-center gap-2">
            <Monitor size={15} className="text-ink/50" /> {online ? "Your PC is connected" : info ? "Your PC is not connected" : "Checking your PC…"}
          </p>
          <p className="text-[12px] text-ink/60 leading-snug mt-0.5">
            {online
              ? agentNote || "The Dispatch Console is running and ready to send."
              : "Start the Adverzo Dispatch Console (start.bat) on your PC, unlock it with your access key, and turn on Admin sync. You can still queue a broadcast — it will send as soon as the PC connects."}
          </p>
          {err && <p className="text-[12px] text-coral mt-1">{err}</p>}
        </div>
      </div>

      {/* live job */}
      {live && (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">{live.name}</p>
              <p className="text-[12px] text-ink/55">{STATUS_LABEL[live.status]}</p>
            </div>
            <button type="button" onClick={() => cancel(live.id)} className="shrink-0 h-8 px-3 rounded-full text-[12px] font-bold text-coral border border-coral/40 hover:bg-coral/10 flex items-center gap-1">
              <Square size={11} /> Stop
            </button>
          </div>
          <p className="font-display font-bold text-[1.6rem] leading-none text-ink mt-3">
            {live.sent}<span className="text-ink/35"> / {live.total}</span>
            {Number(live.failed) > 0 && <span className="text-[13px] font-semibold text-coral ml-3">{live.failed} failed</span>}
          </p>
          <div className="mt-3 h-2 rounded-full bg-ink/[0.08] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={live.total} aria-valuenow={Number(live.sent) + Number(live.failed)}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct(live)}%`, backgroundColor: ACCENT }} />
          </div>
          <p className="mt-2 text-[12px] text-ink/55 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Keep your hands off the mouse while it sends. Press F9 twice on the PC to stop.
          </p>
        </div>
      )}

      {/* start */}
      {!live && (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
          <button type="button" onClick={start} disabled={busy || !queue.length} className={`${btnGreen} w-full !h-14 !text-[13px]`}>
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {queue.length ? `Send ${queue.length} ${queue.length === 1 ? "message" : "messages"} automatically from my PC` : "Tick at least one person below"}
          </button>
          <p className="mt-2 text-[12px] text-ink/55 leading-snug">
            Each person gets their own message with their name and details filled in. Safe limits (daily cap, sending hours, countdown) are set on the PC.
          </p>

          <div className="mt-4 pt-4 border-t border-ink/[0.07]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2 flex items-center gap-1.5"><FlaskConical size={12} /> Try it on one number first</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input className={adminInputCls} inputMode="numeric" placeholder="Your own 10-digit number" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} aria-label="Test number" />
              <button type="button" onClick={startTest} disabled={busy || !template.trim()} className={`${btnOutline} sm:w-44 shrink-0`}>Send test</button>
            </div>
          </div>
        </div>
      )}

      {notice && <p className="mt-3 text-[12.5px] text-ink/75 bg-ink/[0.05] rounded-xl px-3 py-2" role="status">{notice}</p>}

      {/* people in the watched job */}
      {detail && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">{detail.job.name} · {STATUS_LABEL[detail.job.status] || detail.job.status}</p>
          <ul className="divide-y divide-ink/[0.07] rounded-2xl border border-ink/10 bg-white overflow-hidden max-h-72 overflow-y-auto">
            {detail.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{i.name || "Unnamed"}</p>
                  <p className="text-[11.5px] text-ink/50 truncate">{String(i.phone).replace(/\D/g, "")}{i.error ? ` · ${i.error}` : ""}</p>
                </div>
                <span className={`shrink-0 text-[11.5px] font-bold rounded-full px-2.5 py-1 flex items-center gap-1 ${i.status === "sent" ? "text-whatsapp bg-whatsapp/10" : i.status === "failed" ? "text-coral bg-coral/10" : "text-ink/60 bg-ink/[0.06]"}`}>
                  {i.status === "sent" && <Check size={12} strokeWidth={3} />}
                  {i.status === "failed" && <AlertTriangle size={12} />}
                  {ITEM_LABEL[i.status] || i.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* history */}
      {jobs.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">Sent from your PC</p>
          <ul className="divide-y divide-ink/[0.07] rounded-2xl border border-ink/10 bg-white overflow-hidden">
            {jobs.slice(0, 6).map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => setOpenJob(openJob === j.id ? null : j.id)} className="w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-ink/[0.03]">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink truncate">{j.name}</span>
                    <span className="block text-[11.5px] text-ink/50 truncate">
                      {new Date(j.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {STATUS_LABEL[j.status] || j.status}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-ink/70 bg-ink/[0.06] rounded-full px-2.5 py-1">{j.sent}/{j.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-[11.5px] text-ink/50 leading-snug flex items-start gap-1.5">
        <Terminal size={12} className="shrink-0 mt-0.5" />
        “Sent” means the console finished its click-and-paste steps for that person. It can't see WhatsApp's delivery ticks.
      </p>
    </div>
  );
}
