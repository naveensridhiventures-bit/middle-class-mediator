import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User, Phone, MessageSquareText, Send, Check, MapPin } from "lucide-react";
import useProperties from "../lib/useProperties";
import { isValidPhone } from "../lib/validate";
import { optimizedImageUrl } from "../lib/cloudinary";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import TopBar from "../components/gallery/TopBar";

const fieldWrap = "relative";
const fieldIcon = "absolute left-4 top-4 text-ink/40 pointer-events-none";
const inputCls =
  "w-full rounded-2xl border border-ink/10 bg-surface pl-12 pr-4 text-[15px] text-ink placeholder:text-ink/40 outline-none transition focus:border-[#C99A4A] focus:shadow-[0_0_0_3px_rgba(201,154,74,0.22)]";

/**
 * "Enquiry": a short form about one property. There is no inbox behind it, so
 * Send opens WhatsApp with the whole message already written, and the person
 * only has to press send there.
 */
export default function GalleryEnquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, error } = useProperties();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [opened, setOpened] = useState(false);

  const listing = properties ? properties.find((p) => p.id === id) || null : undefined;
  const back = () => navigate(`/gallery/${id}`);

  if (listing === undefined || listing === null || error) {
    return (
      <div className="min-h-screen bg-canvas">
        <TopBar dark title="Enquiry" onBack={back} />
        <div className="px-5 py-14 text-center">
          {error ? <p className="alert-error max-w-sm mx-auto">{error}</p> : listing === null ? (
            <>
              <p className="font-display font-bold text-xl text-ink">This property isn't available anymore</p>
              <Link to="/gallery" className="inline-block mt-4 text-[14px] font-bold text-[#8A6218]">See all properties</Link>
            </>
          ) : (
            <div className="h-24 max-w-md mx-auto rounded-2xl skeleton" />
          )}
        </div>
      </div>
    );
  }

  const l = listing;
  const nameOk = name.trim().length > 0;
  const phoneOk = isValidPhone(phone);
  const cover = l.images[0] ? optimizedImageUrl(l.images[0], 200) : "";

  function handleSend() {
    setTried(true);
    if (!nameOk || !phoneOk) return;
    const text =
      `Hi, I'd like to enquire about this property:\n${l.title}${l.location ? ` (${l.location})` : ""}${l.price ? ` — ${l.price}` : ""}` +
      `${l.refId ? `\nProperty ref: ${l.refId}` : ""}\n\nName: ${name.trim()}\nPhone: ${phone}` +
      `${message.trim() ? `\n\nMessage: ${message.trim()}` : ""}`;
    window.open(whatsappLink(ADMIN_WHATSAPP_NUMBER, text), "_blank", "noopener");
    setOpened(true);
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar dark title="Enquiry" onBack={back} />

      <div className="max-w-md mx-auto px-4 pt-5 pb-10">
        <Link
          to={`/gallery/${l.id}`}
          className="flex items-center gap-3.5 rounded-2xl bg-surface ring-1 ring-ink/[0.07] p-3 shadow-[0_8px_22px_-16px_rgba(27,42,74,0.5)]"
        >
          {cover ? (
            <img src={cover} alt="" className="w-[4.5rem] h-[4.5rem] rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-ink-dark shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-display font-bold text-[1.05rem] leading-tight text-ink line-clamp-2">{l.title}</p>
            {l.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink/55">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{l.location}</span>
              </p>
            )}
            {l.price && <p className="mt-0.5 font-display font-bold text-[1rem] text-ink">{l.price}</p>}
          </div>
        </Link>

        {l.sold ? (
          <p className="mt-6 rounded-2xl bg-ink/5 px-4 py-4 text-sm text-ink/60 text-center">This property has been sold, so it can't take enquiries any more.</p>
        ) : opened ? (
          <div className="mt-6 rounded-3xl bg-surface ring-1 ring-ink/[0.07] p-6 text-center animate-step">
            <span className="w-14 h-14 rounded-full bg-sage mx-auto flex items-center justify-center">
              <Check size={28} className="text-white" strokeWidth={3} />
            </span>
            <h2 className="mt-4 font-display font-bold text-[1.3rem] text-ink">WhatsApp is open</h2>
            <p className="mt-1.5 text-sm text-ink/60 leading-relaxed">
              Your message is ready. Press send in WhatsApp and our team will reply there.
            </p>
            <div className="mt-5 grid gap-2.5">
              <button type="button" onClick={handleSend} className="h-12 rounded-2xl border border-ink/20 text-ink text-[14px] font-semibold hover:bg-ink/5 transition-colors">
                Open WhatsApp again
              </button>
              <Link to="/gallery" className="h-12 rounded-2xl bg-ink-dark text-white text-[14px] font-semibold flex items-center justify-center">
                Back to properties
              </Link>
            </div>
          </div>
        ) : (
          <form
            className="mt-5 space-y-3.5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className={fieldWrap}>
              <User size={19} className={fieldIcon} />
              <input
                className={`${inputCls} h-[3.4rem]`}
                aria-label="Your name"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={tried && !nameOk ? true : undefined}
              />
              {tried && !nameOk && <p className="text-xs text-coral mt-1.5 ml-1">Please enter your name.</p>}
            </div>
            <div className={fieldWrap}>
              <Phone size={19} className={fieldIcon} />
              <input
                className={`${inputCls} h-[3.4rem]`}
                aria-label="Phone number"
                placeholder="Phone number (10 digits)"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                aria-invalid={tried && !phoneOk ? true : undefined}
              />
              {tried && !phoneOk && <p className="text-xs text-coral mt-1.5 ml-1">Enter all 10 digits of your phone number.</p>}
            </div>
            <div className={fieldWrap}>
              <MessageSquareText size={19} className={fieldIcon} />
              <textarea
                className={`${inputCls} min-h-[8.5rem] py-3.5 resize-none`}
                aria-label="Message (optional)"
                placeholder="Message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-[#A8782A] hover:bg-[#946820] text-white font-display font-semibold text-[1.05rem] flex items-center justify-center gap-2.5 active:scale-[0.99] transition-[transform,background-color]"
            >
              <Send size={19} />
              Send Enquiry
            </button>
            <p className="text-center text-[12.5px] text-ink/50">This opens WhatsApp with your message ready to send.</p>
          </form>
        )}
      </div>
    </div>
  );
}
