import { useMemo, useState } from "react";
import { Search, Check, X, MessageCircle, Sparkles, MapPin } from "lucide-react";
import { matchesForBuyer, matchesForSeller, isClosed, formatINR, getCustom } from "../../lib/insights";
import { whatsappLink } from "../../lib/whatsapp";
import { ROLE_META } from "../../lib/roles";
import { Panel, ScoreRing, CopyButton, SkeletonBlock, EmptyNote } from "./insightUi";
import { adminInputCls, btnGreen } from "./styles";

const first = (n) => String(n || "").trim().split(/\s+/)[0] || "there";

function priceText(seller) {
  const exact = Number(String(seller.exactPrice || "").replace(/[^\d.]/g, ""));
  if (exact > 0) return formatINR(exact);
  return seller.expectedPrice || "Price on request";
}

function titleOf(seller) {
  return `${seller.propertyType || "Property"}${seller.propertyLocation || seller.area ? ` · ${seller.propertyLocation || seller.area}` : ""}`;
}

/** Message to the BUYER about a property — never includes the owner's phone or exact address. */
function pitchFor(buyer, seller, adminName) {
  const gid = getCustom(seller).galleryId;
  const link = gid ? `\nPhotos & details: ${window.location.origin}/gallery/${gid}` : "";
  const size = seller.landArea || seller.builtUpArea;
  return (
    `Hi ${first(buyer.name)}, I have a ${seller.propertyType || "property"} in ${seller.propertyLocation || seller.area || "your preferred area"}` +
    `${size ? ` (${size} sqft)` : ""} at ${priceText(seller)} that matches what you're looking for.${link}\n` +
    `Would you like to see it this week?\n\n— ${adminName || "Middle Class Mediator"}`
  );
}

const scoreColor = (s) => (s >= 80 ? "#1F7352" : s >= 60 ? "#C89B3C" : "#6B7A99");

function Reason({ ok, text }) {
  return (
    <li className={`flex items-start gap-1.5 text-[12px] leading-snug ${ok ? "text-ink/70" : "text-ink/50"}`}>
      <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-teal/15 text-teal" : "bg-coral/15 text-coral"}`}>
        {ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
      </span>
      {text}
    </li>
  );
}

export default function MatchesBoard({ data, loading, error, adminName }) {
  const [mode, setMode] = useState("buyer"); // buyer → properties | seller → buyers
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const sellers = useMemo(() => data.seller || [], [data.seller]);
  const buyers = useMemo(() => data.buyer || [], [data.buyer]);

  const subjects = useMemo(() => {
    if (loading) return [];
    const list = mode === "buyer" ? buyers.filter((b) => !isClosed("buyer", b)) : sellers.filter((s) => !isClosed("seller", s));
    return list
      .map((lead) => {
        const top = mode === "buyer" ? matchesForBuyer(lead, sellers, 3) : matchesForSeller(lead, buyers, 3);
        return { lead, best: top[0]?.score || 0, count: top.length };
      })
      .sort((a, b) => b.best - a.best);
  }, [mode, buyers, sellers, loading]);

  const q = query.trim().toLowerCase();
  const shown = subjects.filter(({ lead }) => !q || `${lead.name} ${lead.phone} ${lead.propertyType} ${lead.propertyLocation || ""}`.toLowerCase().includes(q));
  const current = subjects.find((s) => s.lead.id === selectedId) || shown[0] || null;

  const results = useMemo(() => {
    if (!current) return [];
    return mode === "buyer" ? matchesForBuyer(current.lead, sellers, 8) : matchesForSeller(current.lead, buyers, 8);
  }, [current, mode, sellers, buyers]);

  if (loading && !error) {
    return (
      <div className="grid lg:grid-cols-[22rem_1fr] gap-4">
        <SkeletonBlock className="h-96" />
        <SkeletonBlock className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="alert-error">{error}</p>}

      <Panel
        title="Smart matches"
        subtitle="Pairs buyers with properties on type, budget, area and how soon both sides can move"
        right={
          <div className="flex gap-1 p-1 rounded-full bg-ink/5" role="tablist" aria-label="Match direction">
            {[["buyer", "Buyer → Properties"], ["seller", "Property → Buyers"]].map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={mode === k}
                onClick={() => { setMode(k); setSelectedId(null); setQuery(""); }}
                className={`h-8 px-3.5 rounded-full text-[12px] font-semibold transition-colors ${mode === k ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid lg:grid-cols-[22rem_1fr] gap-5">
          {/* Subject list */}
          <div className="min-w-0">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === "buyer" ? "Search buyers" : "Search properties"}
                aria-label="Search"
                className={`${adminInputCls} !pl-10 !bg-surface`}
              />
            </div>
            <ul className="mt-3 space-y-1.5 max-h-80 lg:max-h-[34rem] overflow-y-auto pr-1">
              {shown.length === 0 && <li className="text-sm text-ink/50 px-2 py-6 text-center">Nobody to match yet.</li>}
              {shown.map(({ lead, best, count }) => {
                const on = current?.lead.id === lead.id;
                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(lead.id)}
                      className={`w-full text-left rounded-2xl border px-3.5 py-3 flex items-center gap-3 transition-colors ${on ? "border-ink bg-ink text-white" : "border-ink/10 bg-white/60 hover:border-ink/30"}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[14px] truncate">{mode === "buyer" ? lead.name : titleOf(lead)}</p>
                        <p className={`text-[11.5px] truncate ${on ? "text-white/65" : "text-ink/50"}`}>
                          {mode === "buyer"
                            ? `${lead.propertyType || "Any type"} · ${lead.budget || "no budget"}`
                            : `${lead.name} · ${priceText(lead)}`}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full"
                        style={best ? { backgroundColor: on ? "rgba(255,255,255,0.18)" : `${scoreColor(best)}1F`, color: on ? "#fff" : scoreColor(best) } : { color: on ? "#ffffff90" : "#1B2A4A60" }}
                      >
                        {best ? `${best}% · ${count}` : "No match"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Results */}
          <div className="min-w-0">
            {!current ? (
              <EmptyNote title="Pick someone on the left" text="Their best matches appear here, ranked." />
            ) : (
              <>
                <div className="rounded-2xl bg-ink text-white p-4 flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Sparkles size={18} className="text-gold-light" /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">{mode === "buyer" ? "Matches for buyer" : "Buyers for property"}</p>
                    <p className="font-display font-bold text-[1.1rem] leading-tight truncate">{mode === "buyer" ? current.lead.name : titleOf(current.lead)}</p>
                    <p className="text-[12px] text-white/65 truncate">
                      {mode === "buyer"
                        ? `${current.lead.propertyType || "Any type"} · ${current.lead.budget || "no budget"} · ${current.lead.preferredLocation || "any area"}`
                        : `${priceText(current.lead)} · ${current.lead.timeline || "timeline not set"}`}
                    </p>
                  </div>
                </div>

                {results.length === 0 ? (
                  <EmptyNote
                    title="No strong match yet"
                    text={mode === "buyer" ? "No listing fits this buyer's type and budget. Keep them warm — new sellers arrive daily." : "No buyer is looking for this at this price yet. Share it on the gallery to attract some."}
                  />
                ) : (
                  <ul className="space-y-3">
                    {results.map((m, i) => {
                      const buyer = mode === "buyer" ? current.lead : m.lead;
                      const seller = mode === "buyer" ? m.lead : current.lead;
                      const pitch = pitchFor(buyer, seller, adminName);
                      const hasPhone = Boolean(String(buyer.phone || "").replace(/\D/g, ""));
                      return (
                        <li key={m.lead.id} className="rounded-2xl border border-ink/10 bg-surface p-4 mcm-rise" style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-start gap-3.5">
                            <ScoreRing score={m.score} color={scoreColor(m.score)} size={54} label={`${m.score}% match`} />
                            <div className="min-w-0 flex-1">
                              <p className="font-display font-bold text-[15.5px] text-ink leading-snug">
                                {mode === "buyer" ? titleOf(m.lead) : m.lead.name}
                              </p>
                              <p className="text-[12.5px] text-ink/55 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                {mode === "buyer" ? (
                                  <>
                                    <span className="font-semibold text-ink/75">{priceText(m.lead)}</span>
                                    <span className="text-ink/25">·</span>
                                    <span>{m.lead.name}</span>
                                    <span className="text-ink/25">·</span>
                                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{m.lead.propertyLocation || m.lead.area || "area not set"}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold" style={{ color: ROLE_META.buyer.color }}>{m.lead.propertyType || "Any type"}</span>
                                    <span className="text-ink/25">·</span>
                                    <span>{m.lead.budget || "no budget"}</span>
                                    <span className="text-ink/25">·</span>
                                    <span>{m.lead.preferredLocation || "any area"}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            {m.reasons.map((r) => <Reason key={r.text} {...r} />)}
                          </ul>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {hasPhone ? (
                              <a href={whatsappLink(buyer.phone, pitch)} target="_blank" rel="noreferrer" className={`${btnGreen} !h-10`}>
                                <MessageCircle size={14} /> Send to {first(buyer.name)}
                              </a>
                            ) : (
                              <span aria-disabled="true" className={`${btnGreen} !h-10 opacity-40 pointer-events-none`}><MessageCircle size={14} /> No phone</span>
                            )}
                            <CopyButton text={pitch} label="Copy pitch" />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-4 text-[11.5px] text-ink/45 leading-snug">
                  Messages go to the buyer and never include the owner's name, phone or exact address. Area matching uses the lead's “area” when you've set it, otherwise a best guess from the locality.
                </p>
              </>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
