import Wizard from "../components/wizard/Wizard";
import ChoiceGroup from "../components/wizard/ChoiceGroup";
import TextField, { PhoneField } from "../components/wizard/TextField";
import { isValidPhone } from "../lib/validate";
import { COLORS } from "../lib/theme";
import { addBuyerLead } from "../lib/api";

const PROPERTY_TYPES = ["Home / Independent House", "Apartment / Flat", "Villa", "Plot / Land", "Hotel", "Restaurant", "Saloon", "Shop / Retail", "Office / Commercial Space"];
const PURPOSE = ["Own Use", "Investment"];
const BUDGET = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "No Specific Preference"];
const YES_NO = ["Yes", "No"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

const initialForm = {
  name: "",
  phone: "",
  propertyType: "",
  purpose: "",
  budget: "",
  preferredLocation: "",
  loanRequirement: "",
  timeline: "",
};

const landing = {
  title: "Looking to buy in Chennai?",
  subtitle: "Tell us what you're looking for.",
  note: "Takes about a minute. We'll contact you on WhatsApp with matching properties.",
  cta: "Get started",
  items: [
    { label: "Buyer", text: "Your name and WhatsApp number", color: COLORS.steel },
    { label: "Property", text: "The type of property and where", color: COLORS.teal },
    { label: "Budget", text: "Your budget, loan and timeline", color: COLORS.coral },
  ],
};

const short = (t) => (t ? t.split(" / ")[0] : "");

const steps = [
  {
    label: "Personal details",
    title: "Who should we contact?",
    hint: "We'll reach out on WhatsApp.",
    valid: (f) => f.name.trim() && isValidPhone(f.phone),
    render: (f, set) => (
      <>
        <TextField label="Full name" required valid={f.name.trim().length > 1} autoComplete="name" placeholder="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <PhoneField value={f.phone} onChange={(v) => set("phone", v)} />
      </>
    ),
  },
  {
    label: "Property type",
    title: "What property are you looking for?",
    auto: true,
    valid: (f) => f.propertyType,
    render: (f, set) => <ChoiceGroup options={PROPERTY_TYPES} value={f.propertyType} onChange={(v) => set("propertyType", v)} required />,
  },
  {
    label: "Purpose & budget",
    title: "Purpose and budget",
    valid: (f) => f.purpose && f.budget,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Purpose" required options={PURPOSE} value={f.purpose} onChange={(v) => set("purpose", v)} />
        <ChoiceGroup label="Budget" required options={BUDGET} value={f.budget} onChange={(v) => set("budget", v)} />
      </>
    ),
  },
  {
    label: "Location & loan",
    title: "Where, and will you need a loan?",
    valid: (f) => f.preferredLocation && f.loanRequirement,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Preferred location" required options={LOCATIONS} value={f.preferredLocation} onChange={(v) => set("preferredLocation", v)} />
        <ChoiceGroup label="Loan requirement" required options={YES_NO} value={f.loanRequirement} onChange={(v) => set("loanRequirement", v)} />
      </>
    ),
  },
  {
    label: "Timeline",
    title: "When are you planning to buy?",
    auto: true,
    valid: (f) => f.timeline,
    render: (f, set) => <ChoiceGroup options={TIMELINE} value={f.timeline} onChange={(v) => set("timeline", v)} required />,
  },
];

export default function Buyer() {
  return (
    <Wizard
      role="Buyer"
      initialForm={initialForm}
      landing={landing}
      steps={steps}
      chips={(f) => [f.name.trim() && f.name.trim().split(" ")[0], short(f.propertyType), f.purpose, f.budget, f.preferredLocation && f.preferredLocation.replace(" Chennai", "")]}
      reviewTitle="Review your requirements"
      reviewNote="Check everything looks right. Tap any row to change it."
      reviewRows={(f) => [
        { label: "Name", value: f.name, step: 1 },
        { label: "Mobile", value: f.phone, step: 1 },
        { label: "Property", value: f.propertyType, step: 2 },
        { label: "Purpose", value: f.purpose, step: 3 },
        { label: "Budget", value: f.budget, step: 3 },
        { label: "Location", value: f.preferredLocation, step: 4 },
        { label: "Loan", value: f.loanRequirement, step: 4 },
        { label: "Timeline", value: f.timeline, step: 5 },
      ]}
      submit={(f) => addBuyerLead({ ...f, name: f.name.trim() })}
      submitLabel="Submit requirement"
      success={{
        title: "We have your requirement",
        text: (f) => `Thanks, ${f.name.trim()}. Our team will review your requirements and contact you with matching properties.`,
        next: [
          { title: "Our team reads your requirements", text: "We look at your budget, area and timeline." },
          { title: "We match properties to you", text: "You'll hear from us on WhatsApp with options that fit." },
          { title: "Visit and decide", text: "Book a visit to the ones you like, with a real person to help." },
        ],
        againLabel: "Register another",
      }}
    />
  );
}
