import Wizard from "../components/wizard/Wizard";
import ChoiceGroup from "../components/wizard/ChoiceGroup";
import TextField, { PhoneField } from "../components/wizard/TextField";
import { isValidPhone } from "../lib/validate";
import { COLORS } from "../lib/theme";
import { addMediatorLead } from "../lib/api";

const PROFESSIONS = ["Mediator", "Real Estate Agent", "Builder", "Developer"];
const AREAS = ["North Chennai", "Central Chennai", "South Chennai", "All Over Chennai"];
const CATEGORIES = ["Residential", "Commercial", "Land", "Rental", "All Categories"];
const EXPERIENCE = ["Below 1 Year", "1–3 Years", "3–5 Years", "Above 5 Years"];
const DEAL_TYPES = ["Sale", "Rental", "Lease", "All"];
const YES_NO = ["Yes", "No"];

const initialForm = {
  name: "",
  phone: "",
  profession: "",
  workingArea: "",
  propertyCategory: "",
  experience: "",
  dealType: "",
  genuineLeads: "",
};

const landing = {
  title: "Join Chennai's mediator network",
  subtitle: "Register once and get genuine buyer and seller leads.",
  note: "Takes about a minute. Our team reviews every registration and gets in touch.",
  cta: "Get started",
  items: [
    { label: "You", text: "Your name, number and profession", color: COLORS.steel },
    { label: "Work", text: "Your area and property category", color: COLORS.teal },
    { label: "Experience", text: "Experience, deal types and our genuine-leads promise", color: COLORS.coral },
  ],
};

const steps = [
  {
    label: "Personal details",
    title: "Who should we contact?",
    hint: "We'll reach out on WhatsApp.",
    valid: (f) => f.name.trim() && isValidPhone(f.phone),
    render: (f, set) => (
      <>
        <TextField label="Full name" required autoComplete="name" placeholder="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <PhoneField value={f.phone} onChange={(v) => set("phone", v)} />
      </>
    ),
  },
  {
    label: "Profession",
    title: "What do you do?",
    valid: (f) => f.profession,
    render: (f, set) => <ChoiceGroup options={PROFESSIONS} value={f.profession} onChange={(v) => set("profession", v)} required />,
  },
  {
    label: "Area & category",
    title: "Where and what do you work on?",
    valid: (f) => f.workingArea && f.propertyCategory,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Working area" required options={AREAS} value={f.workingArea} onChange={(v) => set("workingArea", v)} />
        <ChoiceGroup label="Property category" required options={CATEGORIES} value={f.propertyCategory} onChange={(v) => set("propertyCategory", v)} />
      </>
    ),
  },
  {
    label: "Experience & deals",
    title: "Your experience",
    valid: (f) => f.experience && f.dealType,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Experience" required options={EXPERIENCE} value={f.experience} onChange={(v) => set("experience", v)} />
        <ChoiceGroup label="Deal type" required options={DEAL_TYPES} value={f.dealType} onChange={(v) => set("dealType", v)} />
      </>
    ),
  },
  {
    label: "Our promise",
    title: "Do you share only genuine property leads?",
    hint: "Our network only works when every lead is real.",
    valid: (f) => f.genuineLeads,
    render: (f, set) => <ChoiceGroup options={YES_NO} value={f.genuineLeads} onChange={(v) => set("genuineLeads", v)} required />,
  },
];

export default function Mediator() {
  return (
    <Wizard
      role="Mediator"
      initialForm={initialForm}
      landing={landing}
      steps={steps}
      reviewTitle="Review your details"
      reviewNote="Check everything looks right. Tap any row to change it."
      reviewRows={(f) => [
        { label: "Name", value: f.name, step: 1 },
        { label: "Mobile", value: f.phone, step: 1 },
        { label: "Profession", value: f.profession, step: 2 },
        { label: "Area", value: f.workingArea, step: 3 },
        { label: "Category", value: f.propertyCategory, step: 3 },
        { label: "Experience", value: f.experience, step: 4 },
        { label: "Deal type", value: f.dealType, step: 4 },
        { label: "Genuine leads", value: f.genuineLeads, step: 5 },
      ]}
      submit={(f) => addMediatorLead({ ...f, name: f.name.trim() })}
      submitLabel="Submit registration"
      success={{
        title: "Registration submitted successfully",
        text: (f) => `Thanks, ${f.name.trim()}. Our team will review your registration and get in touch with you directly.`,
        againLabel: "Register another",
      }}
    />
  );
}
