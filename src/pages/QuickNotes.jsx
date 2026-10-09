import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone as PhoneIcon, User, Plus, Check, Undo2, ListMusic, Square, Loader2, CloudOff, CloudCheck, Lock, Gauge, Inbox, NotebookPen } from "lucide-react";
import BrandHeader from "../components/wizard/BrandHeader";
import Burst from "../components/gallery/Burst";
import Recorder from "../components/quick/Recorder";
import NoteCard from "../components/quick/NoteCard";
import { fmtPhone } from "../lib/quickStore";
import useRecorder from "../lib/useRecorder";
import useQuickNotes from "../lib/useQuickNotes";
import { fetchAudio } from "../lib/quickSync";
import { adminLogin } from "../lib/api";
import { isValidPhone } from "../lib/validate";
import { COLORS } from "../lib/theme";

const PW_KEY = "mcm_quick_pw";
const RATES = [1, 1.5, 2];

function readPw() {
  try {
    return localStorage.getItem(PW_KEY) || sessionStorage.getItem("mcm_admin_pw") || "";
  } catch {
    return "";
  }
}

const inputCls =
  "w-full rounded-2xl border border-ink/10 bg-[#F7F5F1] h-[3.4rem] text-[17px] text-ink placeholder:text-ink/35 outline-none transition " +
  "focus:bg-white focus:border-[color:var(--accent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_16%,transparent)]";

function AuthBox({ onAuthed }) {
  const [pw, setPw] = useState("");
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await adminLogin(pw);
      try {
        sessionStorage.setItem("mcm_admin_pw", pw);
        if (keep) localStorage.setItem(PW_KEY, pw);
      } catch {
        // storage blocked: works for this visit
      }
      onAuthed(pw);
    } catch (ex) {
      setErr(/wrong password/i.test(ex.message) ? "Wrong password." : "Couldn't check it. Are you online?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-[#F6EEDB] ring-1 ring-[#C99A4A]/40 p-4">
      <p className="font-display font-bold text-[1.05rem] text-ink flex items-center gap-2"><Lock size={16} className="text-[#A8782A]" /> Sign in to sync</p>
      <p className="text-[13.5px] text-ink/60 mt-1">You can keep saving calls right now. They upload once you sign in.</p>
      <div className="mt-3 flex gap-2.5">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin password" aria-label="Admin password" autoComplete="current-password" className="flex-1 min-w-0 h-12 rounded-2xl border border-ink/12 bg-white px-4 text-[15px] outline-none focus:border-[#C99A4A]" />
        <button type="submit" disabled={busy || !pw} className="rip h-12 px-5 rounded-2xl bg-ink text-white text-[14px] font-bold disabled:opacity-40 active:scale-95 transition">{busy ? "Checking" : "Sign in"}</button>
      </div>
      <label className="mt-2.5 flex items-center gap-2 text-[13px] text-ink/60"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="accent-[#A8782A] w-4 h-4" /> Keep me signed in on this phone</label>
      {err && <p className="text-[13px] text-coral mt-2">{err}</p>}
    </form>
  );
}

export default function QuickNotes() {
  const navigate = useNavigate();
  const [password, setPassword] = useState(readPw);
  const q = useQuickNotes(password);
  const recorder = useRecorder();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(false);
  const [audio, setAudio] = useState(null);
  const [shake, setShake] = useState(0);
  const [msg, setMsg] = useState("");
  const [burst, setBurst] = useState(0);
  const [just, setJust] = useState(null);
  const [tab, setTab] = useState("todo");
  const [rate, setRate] = useState(1);
  const [player, setPlayer] = useState({ id: null, playing: false, pct: 0, loading: false });
  const [playAll, setPlayAll] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [playError, setPlayError] = useState("");
  const phoneRef = useRef(null);
  const audioRef = useRef(null);
  const urlRef = useRef("");
  const stateRef = useRef({});

  const { notes } = q;
  const todo = useMemo(() => notes.filter((n) => n.status !== "done").sort((a, b) => a.createdAt - b.createdAt), [notes]);
  const done = useMemo(() => notes.filter((n) => n.status === "done").sort((a, b) => b.createdAt - a.createdAt), [notes]);
  const list = tab === "todo" ? todo : done;
  const waiting = notes.filter((n) => n.op).length;

  useEffect(() => {
    stateRef.current = { notes, password, rate, list, playAll, player };
  });

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!just) return undefined;
    const t = setTimeout(() => setJust(null), 9000);
    return () => clearTimeout(t);
  }, [just]);

  function onPhone(v) {
    let d = v.replace(/\D/g, "");
    if (d.length > 10) d = d.slice(-10); // pasted with +91 / 0
    setPhone(d);
    setMsg("");
  }

  async function save() {
    let a = audio;
    if (recorder.state === "recording") {
      a = await recorder.stop();
      if (a) setAudio(a);
    }
    if (!isValidPhone(phone)) {
      setShake((s) => s + 1);
      setMsg(phone ? "Enter all 10 digits of the number." : "Enter the number first.");
      phoneRef.current?.focus();
      return;
    }
    const n = await q.addNote({ name, phone, note: text, audio: a });
    setJust({ id: n.id, phone, name: name.trim() });
    setBurst((b) => b + 1);
    try {
      navigator.vibrate?.([20, 40, 20]);
    } catch {
      // ignore
    }
    setPhone("");
    setName("");
    setText("");
    setShowText(false);
    setAudio(null);
    setMsg("");
    phoneRef.current?.focus();
  }

  async function undo() {
    if (!just) return;
    await q.deleteNote(just.id);
    setJust(null);
  }

  // ---------- playback ----------
  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) a.pause();
    setPlayer((p) => ({ ...p, playing: false }));
  }, []);

  const play = useCallback(
    async (note) => {
      const a = audioRef.current;
      if (!a) return;
      setPlayError("");
      if (stateRef.current.player.id === note.id && a.src) {
        if (a.paused) a.play().catch(() => {});
        else a.pause();
        return;
      }
      a.pause();
      setPlayer({ id: note.id, playing: false, pct: 0, loading: true });
      try {
        const blob = await fetchAudio(stateRef.current.password, note);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);
        a.src = urlRef.current;
        a.playbackRate = stateRef.current.rate;
        await a.play();
        q.markPlayed(note.id);
        setPlayer((p) => ({ ...p, loading: false }));
      } catch (e) {
        setPlayer({ id: null, playing: false, pct: 0, loading: false });
        setPlayError(/wrong password/i.test(e?.message || "") ? "Sign in again to play recordings saved on another device." : "Couldn't load that recording. Check your signal and try again.");
        setPlayAll(false);
      }
    },
    [q]
  );

  function onEnded() {
    const s = stateRef.current;
    setPlayer((p) => ({ ...p, playing: false, pct: 0 }));
    if (!s.playAll) return;
    const queue = s.list.filter((n) => n.hasAudio);
    const i = queue.findIndex((n) => n.id === s.player.id);
    const next = queue[i + 1];
    if (next) play(next);
    else setPlayAll(false);
  }

  function startPlayAll() {
    if (playAll) {
      setPlayAll(false);
      stopAudio();
      return;
    }
    const queue = list.filter((n) => n.hasAudio);
    if (!queue.length) return;
    setPlayAll(true);
    play(queue.find((n) => !n.played) || queue[0]);
  }

  function cycleRate() {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function findInCrm(n) {
    try {
      sessionStorage.setItem("mcm_admin_pw", password);
    } catch {
      // ignore
    }
    navigate(`/control/dashboard?find=${n.phone}`);
  }

  function signOut() {
    try {
      localStorage.removeItem(PW_KEY);
      sessionStorage.removeItem("mcm_admin_pw");
    } catch {
      // ignore
    }
    setPassword("");
  }

  const phoneOk = isValidPhone(phone);
  const syncPill =
    q.sync === "auth" || !password ? { Icon: Lock, text: "Sign in to sync", cls: "bg-[#F6EEDB] text-[#8A6218]" }
    : !online || q.sync === "offline" ? { Icon: CloudOff, text: waiting ? `Offline, ${waiting} waiting` : "Offline", cls: "bg-white/15 text-white" }
    : q.sync === "syncing" || waiting ? { Icon: Loader2, text: "Syncing", cls: "bg-white/15 text-white", spin: true }
    : { Icon: CloudCheck, text: "All saved", cls: "bg-white/15 text-white" };
  const hasAudioInList = list.some((n) => n.hasAudio);

  return (
    <div className="min-h-screen bg-canvas" style={{ "--accent": COLORS.steel }}>
      <BrandHeader
        color={COLORS.steel}
        right={
          <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold rounded-full px-3 py-1.5 ${syncPill.cls}`} role="status">
            <syncPill.Icon size={14} className={syncPill.spin ? "animate-spin" : ""} /> {syncPill.text}
          </span>
        }
      />

      <main className="max-w-xl mx-auto px-4 pt-6 pb-24">
        <h1 className="font-display font-bold text-[1.8rem] leading-tight text-ink">Call notes</h1>
        <p className="mt-1.5 text-[14.5px] text-ink/55 leading-relaxed">Save the number, name and a voice note in seconds. Listen and update the CRM when you're free.</p>

        {(!password || q.sync === "auth") && <div className="mt-5"><AuthBox onAuthed={setPassword} /></div>}

        {/* ---------- Capture ---------- */}
        <section className="relative mt-5 rounded-[1.75rem] bg-surface ring-1 ring-ink/[0.07] p-4 sm:p-5 shadow-[0_24px_50px_-30px_rgba(27,42,74,0.6)]" aria-label="Save a call">
          <span className="absolute inset-x-6 top-0 h-[2px] rounded-b-full bg-gradient-to-r from-transparent via-[#C99A4A] to-transparent" aria-hidden="true" />
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
            <label className="block">
              <span className="block text-[13px] font-semibold text-ink/60 mb-1.5 ml-0.5">Phone number</span>
              <span className={`relative block ${shake ? "shake" : ""}`} key={shake}>
                <PhoneIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  ref={phoneRef}
                  autoFocus
                  value={phone}
                  onChange={(e) => onPhone(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit number"
                  aria-invalid={msg ? true : undefined}
                  className={`${inputCls} pl-11 pr-12 tabular-nums tracking-wide font-semibold ${msg ? "!border-coral" : ""}`}
                />
                {phoneOk && <span className="tick-pop absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-[#1F7352]"><Check size={14} className="text-white" strokeWidth={3.5} /></span>}
                {!phoneOk && phone && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-ink/35 tabular-nums">{phone.length}/10</span>}
              </span>
              {msg && <span className="block text-[13px] text-coral mt-1.5 ml-0.5" role="alert">{msg}</span>}
            </label>

            <label className="block mt-3.5">
              <span className="block text-[13px] font-semibold text-ink/60 mb-1.5 ml-0.5">Name <span className="font-normal text-ink/35">(optional)</span></span>
              <span className="relative block">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Who called?" className={`${inputCls} pl-11`} />
              </span>
            </label>

            <div className="mt-3.5">
              <Recorder recorder={recorder} audio={audio} onRecorded={setAudio} onClear={() => setAudio(null)} />
            </div>

            {showText ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Short text note" aria-label="Text note" autoFocus className="mt-3.5 w-full rounded-2xl border border-ink/10 bg-[#F7F5F1] px-4 py-3 text-[15px] outline-none focus:bg-white focus:border-[color:var(--accent)] resize-none" />
            ) : (
              <button type="button" onClick={() => setShowText(true)} className="mt-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-ink/55 hover:text-ink"><Plus size={15} /> Add a text note</button>
            )}

            <button type="submit" className="rip btn-shine relative mt-4 w-full h-[3.6rem] rounded-full bg-ink text-white text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_14px_28px_-14px_rgba(27,42,74,0.9)]">
              Save call
              <Burst fire={burst} count={14} spread={70} big />
            </button>
          </form>

          {just && (
            <div className="saved-flash mt-3.5 flex items-center gap-3 rounded-2xl bg-[#E8F3EE] ring-1 ring-[#1F7352]/25 px-3.5 py-2.5" role="status">
              <span className="tick-pop w-7 h-7 rounded-full bg-[#1F7352] flex items-center justify-center shrink-0"><Check size={15} className="text-white" strokeWidth={3.5} /></span>
              <p className="flex-1 min-w-0 text-[14px] leading-snug text-ink/80 line-clamp-2"><b className="tabular-nums">{fmtPhone(just.phone)}</b>{just.name ? ` · ${just.name}` : ""} saved. Ready for the next call.</p>
              <button type="button" onClick={undo} className="rip shrink-0 h-9 px-3 rounded-full text-[13px] font-bold text-[#1F7352] flex items-center gap-1.5 hover:bg-[#1F7352]/10 active:scale-95 transition"><Undo2 size={14} /> Undo</button>
            </div>
          )}
        </section>

        {/* ---------- Saved calls ---------- */}
        <section className="mt-9" aria-label="Saved calls">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="flex gap-1.5 rounded-full bg-ink/[0.06] p-1">
              {[["todo", `To update (${todo.length})`], ["done", `Updated (${done.length})`]].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rip h-10 px-4 rounded-full text-[13.5px] font-bold whitespace-nowrap transition-colors ${tab === k ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}>{label}</button>
              ))}
            </div>
            {hasAudioInList && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={cycleRate} aria-label={`Playback speed ${rate} times`} className="rip h-10 px-3 rounded-full border border-ink/15 text-[13px] font-bold text-ink/70 flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition"><Gauge size={14} /> {rate}×</button>
                <button type="button" onClick={startPlayAll} className={`rip h-10 px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition ${playAll ? "bg-coral text-white" : "bg-[#F6EEDB] text-[#6B4C14] ring-1 ring-[#C99A4A]/40"}`}>
                  {playAll ? <><Square size={13} fill="currentColor" /> Stop</> : <><ListMusic size={15} /> Play all</>}
                </button>
              </div>
            )}
          </div>
          {tab === "todo" && todo.length > 1 && <p className="mt-2.5 text-[12.5px] text-ink/45">Oldest first, so you can work from the top down. Tap the circle once a call is updated in the CRM.</p>}
          {playError && <p className="alert-error mt-3">{playError}</p>}

          {!q.ready ? (
            <div className="mt-4 space-y-3">{[0, 1].map((i) => <div key={i} className="h-40 rounded-3xl skeleton" />)}</div>
          ) : list.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-ink/20 p-9 text-center">
              {tab === "todo" ? <NotebookPen size={30} className="mx-auto text-ink/30" /> : <Inbox size={30} className="mx-auto text-ink/30" />}
              <p className="mt-3 font-display font-bold text-[1.1rem] text-ink">{tab === "todo" ? "Nothing waiting" : "Nothing updated yet"}</p>
              <p className="mt-1 text-[14px] text-ink/50">{tab === "todo" ? "Calls you save appear here, ready to review." : "Notes you tick off move here."}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {list.map((n, i) => (
                <NoteCard
                  key={n.id}
                  index={i}
                  note={n}
                  player={player}
                  rate={rate}
                  online={online}
                  onPlay={() => play(n)}
                  onDone={() => q.patchNote(n.id, { status: n.status === "done" ? "new" : "done" })}
                  onDelete={() => q.deleteNote(n.id)}
                  onSave={(patch) => q.patchNote(n.id, patch)}
                  onFind={() => findInCrm(n)}
                />
              ))}
            </ul>
          )}
        </section>

        {password && (
          <p className="mt-10 text-center text-[12.5px] text-ink/40">
            Saved on this phone first, then to your sheet. <button type="button" onClick={signOut} className="underline underline-offset-2 hover:text-ink">Sign out</button>
          </p>
        )}
      </main>

      <audio
        ref={audioRef}
        onPlay={() => setPlayer((p) => ({ ...p, playing: true }))}
        onPause={() => setPlayer((p) => ({ ...p, playing: false }))}
        onEnded={onEnded}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setPlayer((p) => ({ ...p, pct: a.duration ? a.currentTime / a.duration : 0 }));
        }}
      />
    </div>
  );
}
