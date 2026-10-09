import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";
import { LiveWave, Wave } from "./Wave";

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** The big record button, the live wave while talking, and a preview afterwards. */
export default function Recorder({ recorder, audio, onRecorded, onClear }) {
  const { state, seconds, error, analyserRef, start, stop, supported, maxSeconds } = recorder;
  const url = useMemo(() => (audio?.blob ? URL.createObjectURL(audio.blob) : ""), [audio]);
  const el = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  async function toggleRecord() {
    if (state === "recording") {
      const res = await stop();
      if (res) onRecorded(res);
    } else if (state === "idle") {
      onClear();
      await start();
    }
  }

  function togglePreview() {
    const a = el.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  }

  if (!supported) {
    return <p className="alert-error"><AlertTriangle size={15} className="shrink-0 mt-0.5" />This browser can't record audio. Open this page in Chrome or Safari, or just save the number and name.</p>;
  }

  // Preview after recording
  if (audio?.blob && state === "idle") {
    return (
      <div className="rounded-2xl bg-[#F7F5F1] ring-1 ring-ink/[0.06] p-3.5 flex items-center gap-3 chip-pop">
        <audio
          ref={el}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setPct(0); }}
          onTimeUpdate={(e) => setPct(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        />
        <button type="button" onClick={togglePreview} aria-label={playing ? "Pause preview" : "Play preview"} className="rip w-12 h-12 shrink-0 rounded-full bg-ink text-white flex items-center justify-center active:scale-95 transition-transform">
          {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <Wave peaks={audio.peaks} progress={pct} height={34} />
          <p className="mt-1 text-[12px] font-semibold text-ink/50">Voice note · {clock(audio.durationSec)}</p>
        </div>
        <button type="button" onClick={() => { onClear(); }} aria-label="Record again" className="rip w-11 h-11 shrink-0 rounded-full border border-ink/15 text-ink/70 flex items-center justify-center hover:bg-ink/5 active:scale-95 transition">
          <RotateCcw size={17} />
        </button>
      </div>
    );
  }

  const rec = state === "recording";
  return (
    <div>
      <button
        type="button"
        onClick={toggleRecord}
        disabled={state === "starting"}
        aria-label={rec ? "Stop recording" : "Record a voice note"}
        className={`rip relative w-full rounded-2xl flex items-center gap-4 px-4 py-4 text-left transition-colors active:scale-[0.99] ${rec ? "bg-[#FDECEA] ring-2 ring-[#D0584B]" : "bg-[#F7F5F1] ring-1 ring-ink/[0.08] hover:bg-[#F1EDE6]"}`}
      >
        <span className="relative shrink-0 w-16 h-16 flex items-center justify-center">
          {rec && <span className="rec-ring absolute inset-0 rounded-full bg-[#D0584B]/30" aria-hidden="true" />}
          {rec && <span className="rec-ring absolute inset-0 rounded-full bg-[#D0584B]/30" style={{ animationDelay: "0.7s" }} aria-hidden="true" />}
          <span className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-[0_12px_24px_-10px_rgba(208,88,75,0.9)] ${rec ? "bg-[#D0584B]" : "bg-[#D0584B]"}`}>
            {rec ? <Square size={22} fill="currentColor" /> : <Mic size={28} />}
          </span>
        </span>
        <span className="flex-1 min-w-0">
          {rec ? (
            <>
              <LiveWave analyserRef={analyserRef} height={44} />
              <span className="mt-1 flex items-center justify-between text-[12.5px] font-bold text-[#B94A3D] tabular-nums">
                <span>Recording {clock(seconds)}</span>
                <span className="text-ink/40 font-semibold">tap to stop · max {clock(maxSeconds)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="block font-display font-bold text-[1.1rem] text-ink leading-tight">Record a voice note</span>
              <span className="block text-[13px] text-ink/55 mt-0.5">Tap, speak about the call, tap again.</span>
            </>
          )}
        </span>
      </button>
      {error && <p className="alert-error mt-3"><AlertTriangle size={15} className="shrink-0 mt-0.5" />{error}</p>}
    </div>
  );
}
