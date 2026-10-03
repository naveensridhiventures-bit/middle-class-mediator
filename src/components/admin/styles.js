/** Shared look for admin form fields (same family as the public wizard). */
export const adminInputCls =
  "w-full rounded-xl border border-ink/10 bg-[#F7F5F1] px-3.5 py-3 text-[14px] text-ink placeholder:text-ink/35 outline-none transition " +
  "focus:bg-white focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

export const pillBtn =
  "h-11 px-5 rounded-full text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 transition active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none";

export const btnDark = `${pillBtn} bg-ink text-white hover:bg-ink-light`;
export const btnOutline = `${pillBtn} border border-ink/20 text-ink hover:bg-ink/5`;
export const btnGreen = `${pillBtn} bg-whatsapp text-white hover:brightness-95`;
export const btnDanger = `${pillBtn} bg-coral text-white hover:brightness-110`;
