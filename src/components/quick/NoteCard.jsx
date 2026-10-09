import { useState } from "react";
import { Play, Pause, Phone, MessageCircle, Copy, Check, Trash2, Pencil, Search, Cloud, CloudOff, Loader2, CircleCheck, Circle, X, Save } from "lucide-react";
import { Wave } from "./Wave";
import { timeAgo } from "../../lib/insights";
import { fmtPhone } from "../../lib/quickStore";
import { callLink, whatsappLink } from "../../lib/whatsapp";

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const act =
  "rip h-10 px-3 rounded-full border border-ink/12 text-[12.5px] font-semibold text-ink/75 flex items-center gap-1.5 hover:bg-ink/[0.04] active:scale-95 transition";

function SyncBadge({ note, online }) {
  if (note.op) {
    return (
      <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#8A6218]" title={online ? "Uploading…" : "Saved on this phone. Uploads when there's signal."}>
        {online ? <Loader2 size={12} className="animate-spin" /> : <CloudOff size={12} />} {online ? "Saving" : "On phone"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#1F7352]" title="Saved to your sheet">
      <Cloud size={12} /> Synced
    </span>
  );
}

export default function NoteCard({ note, player, rate, online, onPlay, onDone, onDelete, onSave, onFind, index }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(note.name);
  const [phone, setPhone] = useState(note.phone);
  const [text, setText] = useState(note.note);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const mine = player.id === note.id;
  const done = note.status === "done";

  async function copy() {
    try {
      await navigator.clipboard.writeText(note.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this number", note.phone);
    }
  }

  function save() {
    const digits = phone.replace(/\D/g, "").slice(-10);
    onSave({ name: name.trim(), phone: digits, note: text.trim() });
    setEditing(false);
  }

  return (
    <li
      className={`note-in rounded-3xl bg-surface ring-1 ring-ink/[0.07] p-4 shadow-[0_10px_28px_-22px_rgba(27,42,74,0.55)] transition-opacity ${done ? "opacity-70" : ""}`}
      style={{ "--i": Math.min(index, 8) }}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onDone}
          aria-pressed={done}
          aria-label={done ? "Mark as not updated" : "Mark as updated in CRM"}
          className="rip shrink-0 w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-ink/35 hover:text-[#1F7352] active:scale-90 transition"
        >
          {done ? <CircleCheck size={28} className="text-[#1F7352] tick-pop" /> : <Circle size={28} />}
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" className="w-full h-11 rounded-xl border border-ink/12 bg-[#F7F5F1] px-3 text-[15px] outline-none focus:border-[color:var(--accent)] focus:bg-white" />
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))} inputMode="numeric" placeholder="10-digit number" aria-label="Phone number" className="w-full h-11 rounded-xl border border-ink/12 bg-[#F7F5F1] px-3 text-[15px] tabular-nums outline-none focus:border-[color:var(--accent)] focus:bg-white" />
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Text note (optional)" aria-label="Text note" rows={2} className="w-full rounded-xl border border-ink/12 bg-[#F7F5F1] px-3 py-2.5 text-[14.5px] outline-none focus:border-[color:var(--accent)] focus:bg-white resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={save} className="rip h-10 px-4 rounded-full bg-ink text-white text-[13px] font-bold flex items-center gap-1.5 active:scale-95 transition"><Save size={14} /> Save</button>
                <button type="button" onClick={() => { setEditing(false); setName(note.name); setPhone(note.phone); setText(note.note); }} className={act}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-display font-bold text-[1.35rem] leading-none text-ink tabular-nums tracking-tight">{note.phone ? fmtPhone(note.phone) : "No number"}</p>
              <p className="mt-1.5 text-[14px] text-ink/65 truncate">{note.name || <span className="text-ink/35">No name</span>}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink/45">
                <span>{timeAgo(note.createdAt)}</span>
                <SyncBadge note={note} online={online} />
                {!note.played && note.hasAudio && <span className="flex items-center gap-1 font-bold text-[#3F5F8F]"><span className="w-1.5 h-1.5 rounded-full bg-[#3F5F8F]" />Not heard yet</span>}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit name, number or note" className="rip shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/5 active:scale-90 transition">
            <Pencil size={16} />
          </button>
        )}
      </div>

      {note.note && !editing && <p className="mt-3 text-[14px] leading-snug text-ink/75 bg-[#F7F5F1] rounded-xl px-3 py-2.5 whitespace-pre-line">{note.note}</p>}

      {note.hasAudio && (
        <div className="mt-3.5 flex items-center gap-3 rounded-2xl bg-[#F7F5F1] ring-1 ring-ink/[0.05] p-2.5 pr-3.5">
          <button
            type="button"
            onClick={onPlay}
            aria-label={mine && player.playing ? "Pause voice note" : "Play voice note"}
            className="rip shrink-0 w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_8px_18px_-8px_rgba(27,42,74,0.8)]"
          >
            {mine && player.loading ? <Loader2 size={20} className="animate-spin" /> : mine && player.playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <Wave peaks={note.peaks} progress={mine ? player.pct : 0} height={32} />
          </div>
          <span className="shrink-0 text-right text-[12px] font-bold text-ink/50 tabular-nums leading-tight">
            {clock(note.durationSec || 0)}
            {mine && player.playing && rate !== 1 && <span className="block text-[#A8782A]">{rate}×</span>}
          </span>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        {note.phone && (
          <>
            <a href={callLink(note.phone)} className={act}><Phone size={14} /> Call</a>
            <a href={whatsappLink(`91${note.phone}`, "")} target="_blank" rel="noreferrer" className={act}><MessageCircle size={14} /> WhatsApp</a>
            <button type="button" onClick={copy} className={act}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
            <button type="button" onClick={onFind} className={`${act} !border-[#C99A4A]/60 !text-[#8A6218] bg-[#F6EEDB]/60`}><Search size={14} /> Find in CRM</button>
          </>
        )}
        {confirmDel ? (
          <button type="button" onClick={onDelete} onBlur={() => setConfirmDel(false)} autoFocus className={`${act} !border-coral !text-coral shake`}><Trash2 size={14} /> Tap again to delete</button>
        ) : (
          <button type="button" onClick={() => setConfirmDel(true)} aria-label="Delete note" className={`${act} ml-auto !px-3 text-ink/45`}><Trash2 size={14} /></button>
        )}
      </div>
    </li>
  );
}
