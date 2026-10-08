import { useEffect, useRef, useState } from "react";
import { MessageCircle, ChevronDown, Phone, Copy, Check } from "lucide-react";
import { whatsappLink, callLink } from "../../lib/whatsapp";
import { templatesFor } from "../../lib/insights";
import { ROLE_META } from "../../lib/roles";
import { btnGreen, btnOutline } from "./styles";

/** Circular 0–100 heat score. `title` carries the "why" for hover / long-press. */
export function ScoreRing({ score, color, size = 44, label }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} title={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
          className="mcm-ring"
        />
      </svg>
      <span className="absolute font-bold tabular-nums text-ink" style={{ fontSize: size * 0.3 }}>{score}</span>
    </span>
  );
}

/** Pill showing Hot / Warm / Cold with the score, used on lead cards. */
export function ScoreBadge({ result }) {
  if (!result || result.tier === "Closed") return null;
  const why = result.reasons.map((r) => `+${r.pts} ${r.why}`).join("\n");
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: `${result.color}1F`, color: result.color }}
      title={`Lead score ${result.score}/100\n${why}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: result.color }} />
      {result.tier} · {result.score}
    </span>
  );
}

export function RolePill({ role }) {
  const m = ROLE_META[role];
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: m.color }}>
      {m.label}
    </span>
  );
}

/**
 * WhatsApp button with a template picker: one tap sends the best template,
 * the chevron opens the others. Messages are pre-filled, never auto-sent.
 */
export function WhatsAppMenu({ role, lead, adminName, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const has = Boolean(String(lead.phone || "").replace(/\D/g, ""));
  const templates = templatesFor(role, lead, adminName);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const h = compact ? "!h-10" : "";
  if (!has) {
    return (
      <span aria-disabled="true" className={`${btnGreen} ${h} opacity-40 pointer-events-none`}>
        <MessageCircle size={14} /> WhatsApp
      </span>
    );
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <div className="flex min-w-0">
        <a
          href={whatsappLink(lead.phone, templates[0].text)}
          target="_blank"
          rel="noreferrer"
          className={`${btnGreen} ${h} !rounded-r-none flex-1 min-w-0 whitespace-nowrap ${compact ? "!px-3" : ""}`}
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Choose a message template"
          aria-expanded={open}
          className={`${btnGreen} ${h} !rounded-l-none !px-2.5 shrink-0 border-l border-white/30`}
        >
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 min-w-[15rem] rounded-2xl bg-surface border border-ink/10 shadow-[0_18px_40px_-12px_rgba(27,42,74,0.35)] p-1.5 mcm-pop">
          {templates.map((t) => (
            <a
              key={t.id}
              href={whatsappLink(lead.phone, t.text)}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 hover:bg-ink/5"
            >
              <span className="block text-[12px] font-bold text-ink">{t.label}</span>
              <span className="block text-[11px] text-ink/55 leading-snug line-clamp-2 mt-0.5">{t.text.split("\n")[0]}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function CallButton({ phone, compact = false }) {
  const has = Boolean(String(phone || "").replace(/\D/g, ""));
  const h = compact ? "!h-10" : "";
  if (!has) {
    return (
      <span aria-disabled="true" className={`${btnOutline} ${h} opacity-40 pointer-events-none`}>
        <Phone size={14} /> Call
      </span>
    );
  }
  return (
    <a href={callLink(phone)} className={`${btnOutline} ${h}`}>
      <Phone size={14} /> Call
    </a>
  );
}

export function CopyButton({ text, label = "Copy", className = "" }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      window.prompt("Copy this message", text);
    }
  }
  return (
    <button type="button" onClick={copy} className={`${btnOutline} !h-10 ${className}`}>
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? "Copied" : label}
    </button>
  );
}

export function Panel({ title, subtitle, right, children, className = "", delay = 0 }) {
  return (
    <section
      className={`rounded-3xl bg-surface border border-ink/10 p-5 mcm-rise ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h3 className="font-display font-bold text-[1.05rem] leading-tight text-ink">{title}</h3>}
            {subtitle && <p className="text-[12px] text-ink/50 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function EmptyNote({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 p-8 text-center">
      <p className="font-display font-bold text-lg text-ink">{title}</p>
      {text && <p className="text-sm text-ink/55 mt-1 max-w-sm mx-auto">{text}</p>}
    </div>
  );
}
