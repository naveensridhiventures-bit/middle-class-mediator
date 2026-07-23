import { Link } from "react-router-dom";
import Seal from "../components/Seal";
import { APP_NAME } from "../lib/config";

const roles = [
  {
    to: "/mediator",
    label: "Mediator",
    color: "mediator",
    hex: "#2D4373",
    tag: "Bring the deal",
    desc: "Saw a property on our Insta page? Upload the listing with your note and photo — we'll connect on WhatsApp.",
  },
  {
    to: "/seller",
    label: "Seller",
    color: "seller",
    hex: "#1F6F5C",
    tag: "List your property",
    desc: "Share price, location and details of the house or shop you're selling. We follow up directly with you.",
  },
  {
    to: "/buyer",
    label: "Buyer",
    color: "buyer",
    hex: "#B5533C",
    tag: "Register requirement",
    desc: "Tell us your budget, location and property type — we'll contact you with matching properties.",
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-5 pb-20">
      <section className="pt-14 pb-10 text-center">
        <div className="flex justify-center mb-5">
          <Seal label="Est. on trust" size={72} rotate={-6} />
        </div>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-ink tracking-tight leading-[1.1]">
          {APP_NAME}
        </h1>
        <p className="mt-4 text-ink/60 max-w-md mx-auto leading-relaxed">
          One record for every house, shop or property shared on our Instagram —
          from first message to final handshake.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-5">
        {roles.map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="card-ledger group p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <Seal label={r.label} color={r.hex} size={56} rotate={r.color === "mediator" ? -8 : r.color === "seller" ? 5 : -4} />
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ color: r.hex, backgroundColor: `${r.hex}12` }}
              >
                {r.tag}
              </span>
            </div>
            <div>
              <h2 className="font-display font-semibold text-2xl text-ink mb-1.5">
                {r.label}
              </h2>
              <p className="text-sm text-ink/60 leading-relaxed">{r.desc}</p>
            </div>
            <span
              className="mt-auto text-sm font-semibold flex items-center gap-1.5"
              style={{ color: r.hex }}
            >
              Continue as {r.label}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-14 card-ledger p-6 sm:p-8">
        <p className="field-label mb-4">How it works</p>
        <ol className="grid sm:grid-cols-3 gap-6">
          {[
            ["01", "Spot it on Instagram", "You post a property video — a viewer wants in, as mediator, seller or buyer."],
            ["02", "They fill their details", "Right here in the app — property, price, location, and a photo if they have one."],
            ["03", "We take it from WhatsApp", "It lands straight to us, and we follow up directly to close the deal."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3">
              <span className="font-mono text-sm text-gold-dark font-semibold shrink-0">{n}</span>
              <div>
                <p className="font-semibold text-ink text-sm mb-1">{t}</p>
                <p className="text-sm text-ink/55 leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
