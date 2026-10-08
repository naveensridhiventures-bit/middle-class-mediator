import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { parseAbout } from "../../lib/describe";

const SHOW = 6;

/** "About this property": a short intro and a clean checklist, instead of a wall of pasted text. */
export default function AboutProperty({ description, sellerNote }) {
  const { intro, features } = useMemo(() => parseAbout(description, sellerNote), [description, sellerNote]);
  const [allFeatures, setAllFeatures] = useState(false);
  const [moreText, setMoreText] = useState(false);
  if (!intro.length && !features.length) return null;

  const shownIntro = moreText ? intro : intro.slice(0, 2);
  const shownFeatures = allFeatures ? features : features.slice(0, SHOW);

  return (
    <section className="mt-7" aria-label="About this property">
      <h2 className="font-display font-bold text-[1.2rem] text-ink flex items-center gap-2.5">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#E6C173] to-[#A8782A]" />
        About this property
      </h2>

      {shownIntro.length > 0 && (
        <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink/70">
          {shownIntro.map((t) => <p key={t}>{t}</p>)}
          {intro.length > 2 && (
            <button type="button" onClick={() => setMoreText((v) => !v)} className="text-[13px] font-bold text-[#8A6218] underline underline-offset-2">
              {moreText ? "Show less" : `Read ${intro.length - 2} more line${intro.length - 2 === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}

      {features.length > 0 && (
        <>
          <ul className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-4 gap-y-2.5">
            {shownFeatures.map((f, i) => (
              <li key={f} className="fade-up flex items-start gap-2.5 text-[14px] leading-snug text-ink/80" style={{ "--d": `${Math.min(i, 8) * 55}ms` }}>
                <span className="mt-[1px] w-5 h-5 rounded-full bg-[#F6EEDB] ring-1 ring-[#C99A4A]/40 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3.2} className="text-[#A8782A]" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {features.length > SHOW && (
            <button
              type="button"
              onClick={() => setAllFeatures((v) => !v)}
              aria-expanded={allFeatures}
              className="rip relative overflow-hidden mt-4 h-11 px-5 rounded-full border border-ink/15 text-[13px] font-bold text-ink/75 hover:bg-ink/[0.04] flex items-center gap-1.5 active:scale-95 transition"
            >
              {allFeatures ? "Show fewer" : `Show all ${features.length} features`}
              <ChevronDown size={15} className={`transition-transform duration-300 ${allFeatures ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      )}
    </section>
  );
}
