import { useCallback, useEffect, useRef, useState } from "react";

const MIMES = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
const BARS = 40;

function downsample(samples) {
  if (!samples.length) return [];
  const out = [];
  for (let i = 0; i < BARS; i++) {
    const a = Math.floor((i / BARS) * samples.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / BARS) * samples.length));
    let peak = 0;
    for (let j = a; j < b && j < samples.length; j++) peak = Math.max(peak, samples[j]);
    out.push(peak);
  }
  const max = Math.max(...out, 0.001);
  return out.map((v) => Math.round(Math.min(1, v / max) * 99));
}

/**
 * Voice recording with the phone/computer microphone. Small files on purpose
 * (voice-quality Opus, roughly 200 KB a minute). `analyser` can be read each
 * frame to draw a live wave. start() resolves once the mic is open.
 */
export default function useRecorder({ maxSeconds = 180 } = {}) {
  const [state, setState] = useState("idle"); // idle | starting | recording
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const analyserRef = useRef(null);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const chunksRef = useRef([]);
  const samplesRef = useRef([]);
  const timersRef = useRef([]);
  const startedRef = useRef(0);
  const resolveRef = useRef(null);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close?.().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  const start = useCallback(async () => {
    if (!supported) {
      setError("This browser can't record audio. Try Chrome or Safari.");
      return false;
    }
    setError("");
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeType = MIMES.find((m) => MediaRecorder.isTypeSupported?.(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24000 } : undefined);
      recRef.current = rec;
      chunksRef.current = [];
      samplesRef.current = [];
      rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationSec = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
        const peaks = downsample(samplesRef.current);
        cleanup();
        setState("idle");
        resolveRef.current?.({ blob, mime: type, durationSec, peaks });
        resolveRef.current = null;
      };

      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.fftSize);
        timersRef.current.push(
          setInterval(() => {
            analyser.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128;
              sum += v * v;
            }
            samplesRef.current.push(Math.sqrt(sum / buf.length));
          }, 100)
        );
      } catch {
        // no live wave on this browser: recording still works
      }

      startedRef.current = Date.now();
      setSeconds(0);
      rec.start(1000);
      setState("recording");
      timersRef.current.push(
        setInterval(() => {
          const s = Math.floor((Date.now() - startedRef.current) / 1000);
          setSeconds(s);
          if (s >= maxSeconds && recRef.current?.state === "recording") recRef.current.stop();
        }, 250)
      );
      try {
        navigator.vibrate?.(15);
      } catch {
        // ignore
      }
      return true;
    } catch (e) {
      cleanup();
      setState("idle");
      setError(
        e?.name === "NotAllowedError"
          ? "Microphone is blocked. Allow it for this site in the browser's address-bar settings, then try again."
          : "Couldn't open the microphone. Check that another app isn't using it."
      );
      return false;
    }
  }, [supported, maxSeconds, cleanup]);

  /** Stops and resolves with { blob, mime, durationSec, peaks }. */
  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        if (!recRef.current || recRef.current.state !== "recording") return resolve(null);
        resolveRef.current = resolve;
        recRef.current.stop();
      }),
    []
  );

  const cancel = useCallback(() => {
    resolveRef.current = null;
    if (recRef.current?.state === "recording") {
      recRef.current.onstop = null;
      recRef.current.stop();
    }
    cleanup();
    setState("idle");
  }, [cleanup]);

  return { supported, state, seconds, error, analyserRef, start, stop, cancel, maxSeconds };
}
