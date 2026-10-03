import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Pencil } from "lucide-react";
import BrandHeader from "./BrandHeader";
import { STEP_COLORS, COLORS, textShade } from "../../lib/theme";

const pad = (n) => String(n).padStart(2, "0");

const primaryBtn =
  "flex-1 h-14 rounded-full text-white text-[12px] font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2 " +
  "transition active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none";

/**
 * One-question-at-a-time flow shared by Buyer, Seller and Mediator.
 *
 * Screens run: landing → each step → review → success.
 *   - Each step has its own validity rule; Continue stays off until it passes.
 *   - The review screen lists every answer; tapping a row jumps back to that
 *     step and returns straight to the review when you save.
 *   - The brand chip, progress bar and highlight colour all follow the step.
 *
 * Props
 *   role          "Buyer" | "Seller" | "Mediator"
 *   initialForm   starting form values (same keys the backend already expects)
 *   landing       { title, subtitle, note, items: [{ label, text, color }], cta }
 *   steps         [{ label, title, hint, optional, valid(form), render(form, set) }]
 *   reviewTitle, reviewNote
 *   reviewRows    (form) => [{ label, value, step }]   (empty values are hidden)
 *   submit        async (form) => void
 *   submitLabel   text on the final button
 *   success       { title, text(form), primary(form) → { href, label } | null, againLabel }
 */
export default function Wizard({
  role,
  initialForm,
  landing,
  steps,
  reviewTitle,
  reviewNote,
  reviewRows,
  submit,
  submitLabel,
  success,
}) {
  const [form, setForm] = useState(initialForm);
  const [pos, setPos] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");
  const [fromReview, setFromReview] = useState(false);
  const titleRef = useRef(null);

  const n = steps.length;
  const reviewPos = n + 1;
  const successPos = n + 2;
  const atLanding = pos === 0;
  const atReview = pos === reviewPos;
  const atSuccess = pos === successPos;
  const step = pos >= 1 && pos <= n ? steps[pos - 1] : null;

  const color = STEP_COLORS[pos % STEP_COLORS.length];
  const textColor = textShade(color);
  const allValid = steps.every((s) => Boolean(s.valid(form)));
  const canContinue = atLanding ? true : atReview ? allValid : step ? Boolean(step.valid(form)) : true;

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // New screen → back to the top, and move focus to the heading so screen
  // readers announce the change.
  useEffect(() => {
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  }, [pos]);

  function goNext() {
    if (!canContinue) return;
    if (fromReview) {
      setFromReview(false);
      setPos(reviewPos);
      return;
    }
    setPos((p) => p + 1);
  }

  function goBack() {
    if (fromReview) {
      setFromReview(false);
      setPos(reviewPos);
      return;
    }
    setPos((p) => Math.max(0, p - 1));
  }

  function editStep(i) {
    setFromReview(true);
    setPos(i);
  }

  async function handleSubmit() {
    if (!allValid || status === "saving") return;
    setStatus("saving");
    setError("");
    try {
      await submit(form);
      setStatus("done");
      setPos(successPos);
    } catch (err) {
      setError(err.message || "Could not save — check your connection and try again.");
      setStatus("error");
    }
  }

  function reset() {
    setForm(initialForm);
    setPos(0);
    setStatus("idle");
    setError("");
    setFromReview(false);
  }

  function onFormSubmit(e) {
    e.preventDefault();
    if (atReview) handleSubmit();
    else goNext();
  }

  const eyebrow = atLanding
    ? `${role} landing`
    : atReview
    ? "Review / submit"
    : atSuccess
    ? "Success"
    : step.label;

  const title = atLanding ? landing.title : atReview ? reviewTitle : atSuccess ? success.title : step.title;
  const subtitle = atLanding ? landing.subtitle : atReview ? reviewNote : atSuccess ? "" : step?.hint;

  const rows = atReview ? reviewRows(form).filter((r) => r.value !== "" && r.value != null) : [];
  const successAction = atSuccess && success.primary ? success.primary(form) : null;

  return (
    <div className="min-h-screen bg-canvas sm:py-8">
      <div
        className="mx-auto max-w-md min-h-[100dvh] sm:min-h-0 bg-surface sm:rounded-[2rem] sm:ring-8 sm:ring-[#EDE7DF] sm:shadow-[0_28px_60px_-24px_rgba(27,42,74,0.35)] flex flex-col"
        style={{ "--accent": color }}
      >
        <BrandHeader color={color} className="sm:rounded-t-[2rem]" />

        <form onSubmit={onFormSubmit} noValidate className="flex-1 flex flex-col">
          <div key={pos} className="flex-1 px-5 pt-6 pb-8 animate-step">
            {/* Progress — one segment per step plus the review */}
            {!atLanding && !atSuccess && (
              <div
                className="flex gap-1.5 mb-5"
                role="progressbar"
                aria-label={`${role} form progress`}
                aria-valuemin={1}
                aria-valuemax={n + 1}
                aria-valuenow={pos}
              >
                {Array.from({ length: n + 1 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: i < pos ? color : "rgba(27,42,74,0.1)" }}
                  />
                ))}
              </div>
            )}

            {atSuccess ? (
              <div className="flex flex-col items-center text-center pt-4">
                <span className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sage }}>
                  <Check size={38} className="text-white" strokeWidth={3} />
                </span>
                <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: textColor }}>
                  <span className="mr-2">{pad(pos + 1)}</span>
                  {eyebrow}
                </p>
                <h1 ref={titleRef} tabIndex={-1} className="mt-2 font-display font-bold text-[1.6rem] leading-tight text-ink outline-none">
                  {title}
                </h1>
                <p className="mt-3 text-sm text-ink/60 leading-relaxed max-w-xs">{success.text(form)}</p>

                <div className="w-full mt-8 space-y-3">
                  {successAction && (
                    <a
                      href={successAction.href}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-14 rounded-full bg-whatsapp text-white text-[12px] font-bold uppercase tracking-[0.14em] flex items-center justify-center"
                    >
                      {successAction.label}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full h-14 rounded-full border border-ink/80 text-ink text-[12px] font-bold uppercase tracking-[0.14em] hover:bg-ink hover:text-white transition-colors"
                  >
                    {success.againLabel || "Register another"}
                  </button>
                  <Link to="/" className="block text-xs text-ink/50 hover:text-ink pt-2">
                    ← Back to home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: textColor }}>
                  <span className="mr-2">{pad(pos + 1)}</span>
                  {eyebrow}
                </p>
                <h1 ref={titleRef} tabIndex={-1} className="mt-2 font-display font-bold text-[1.6rem] leading-tight text-ink outline-none">
                  {title}
                </h1>
                {subtitle && <p className="mt-2 text-sm text-ink/55 leading-relaxed">{subtitle}</p>}
                {step?.optional && (
                  <p className="mt-2 inline-block text-[11px] font-semibold text-ink/55 bg-ink/5 rounded-full px-2.5 py-1">
                    Optional — skip if you like
                  </p>
                )}

                {atLanding && (
                  <div className="mt-7 space-y-3">
                    {landing.items.map((it) => (
                      <div
                        key={it.label}
                        className="rounded-xl border-2 px-4 py-3.5 bg-white"
                        style={{ borderColor: it.color, backgroundColor: `color-mix(in srgb, ${it.color} 5%, white)` }}
                      >
                        <p className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: textShade(it.color) }}>
                          {it.label}
                        </p>
                        <p className="text-[13px] text-ink/65 mt-0.5">{it.text}</p>
                      </div>
                    ))}
                    {landing.note && <p className="text-xs text-ink/45 pt-1">{landing.note}</p>}
                  </div>
                )}

                {step && <div className="mt-6">{step.render(form, update)}</div>}

                {atReview && (
                  <ul className="mt-5 divide-y divide-ink/[0.07]">
                    {rows.map((r) => (
                      <li key={r.label}>
                        <button
                          type="button"
                          onClick={() => editStep(r.step)}
                          aria-label={`Edit ${r.label}`}
                          className="w-full flex items-start justify-between gap-4 py-3.5 text-left"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/55 pt-[3px] shrink-0">
                            {r.label}
                          </span>
                          <span className="flex items-start gap-2 min-w-0 text-sm font-medium text-ink text-right">
                            <span className="break-words min-w-0">{r.value}</span>
                            <Pencil size={12} className="text-ink/30 mt-1 shrink-0" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Footer — stays pinned to the bottom of the screen on phones */}
          {!atSuccess && (
            <div
              className="sticky bottom-0 bg-surface border-t border-ink/5 px-5 pt-3 sm:rounded-b-[2rem]"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {error && (
                <p className="alert-error mb-3">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </p>
              )}
              {!canContinue && !atLanding && (
                <p className="text-xs text-ink/50 text-center mb-2.5">
                  {atReview ? "Some required answers are missing — tap Back to fill them in." : "Fill in the starred fields to continue."}
                </p>
              )}
              <div className="flex gap-3">
                {!atLanding && (
                  <button
                    type="button"
                    onClick={goBack}
                    aria-label="Back"
                    className="w-14 h-14 rounded-full border border-ink/15 text-ink flex items-center justify-center shrink-0 hover:bg-ink/5 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                {atReview ? (
                  <button type="submit" disabled={!allValid || status === "saving"} className={`${primaryBtn} bg-coral`}>
                    {status === "saving" ? "Saving…" : submitLabel}
                  </button>
                ) : (
                  <button type="submit" disabled={!canContinue} className={`${primaryBtn} bg-ink`}>
                    {atLanding ? landing.cta || "Get started" : fromReview ? "Save changes" : "Continue"}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
              {atLanding && (
                <Link to="/" className="block text-center text-xs text-ink/50 hover:text-ink mt-3">
                  ← Back to home
                </Link>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
