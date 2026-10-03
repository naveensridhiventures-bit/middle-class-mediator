import Wizard from "../components/wizard/Wizard";
import ChoiceGroup from "../components/wizard/ChoiceGroup";
import TextField, { PhoneField } from "../components/wizard/TextField";
import { isValidPhone } from "../lib/validate";
import { COLORS } from "../lib/theme";
import { addSellerLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { MEDIATOR_WHATSAPP_NUMBER } from "../lib/config";

const PROPERTY_TYPES = ["Home / Independent House", "Apartment / Flat", "Villa", "Plot / Land", "Hotel", "Restaurant", "Saloon", "Shop / Retail", "Office / Commercial Space"];
const PROPERTY_STATUS = ["Brand New", "Resale", "Under Construction"];
const PRICE_RANGES = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const OWNER_TYPE = ["Direct Owner", "Agent / Broker"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];
const PHOTOS_SHARED = ["Shared", "Will Share Later"];
const PURPOSE = ["Own Use", "Investment"];
const PROPERTY_AGE = ["Less than 1 Year", "1–5 Years", "5–10 Years", "Above 10 Years"];
const BUILDING_TYPE = ["Ground Floor", "G+1", "G+2", "G+3 & Above", "Apartment"];
const ROAD_WIDTH = ["20 Feet", "24 Feet", "30 Feet", "40 Feet & Above"];
const FACING = ["North", "South", "East", "West"];
const PROPERTY_USAGE = ["Residential", "Commercial", "Semi-Commercial"];
const PATTA_APPROVAL = ["Online Patta", "CMDA", "DTCP", "Panchayat", "Not Approved"];
const APPROVAL_STATUS = ["Land Approved", "Building Approved", "Both Approved"];
const PARKING = ["Car Parking", "Bike Parking", "Both", "No Parking"];
const RENTAL_STATUS = ["Rented", "Vacant"];
const LOAN_STATUS = ["Loan Running", "Loan Closed", "No Loan"];

const initialForm = {
  name: "", phone: "",
  ownership: "", propertyLocation: "", photosShared: "",
  propertyType: "", purpose: "", propertyStatus: "", propertyAge: "", buildingType: "",
  landArea: "", builtUpArea: "", frontageLength: "", frontageBreadth: "",
  roadWidth: "", facing: "", propertyUsage: "", pattaApproval: "", approvalStatus: "",
  parking: "", rentalStatus: "", loanStatus: "",
  expectedPrice: "", timeline: "", sellerRemarks: "",
};

const landing = {
  title: "Selling a property in Chennai?",
  subtitle: "List it with us and we'll connect you with genuine buyers.",
  note: "Takes about 3 minutes. Only the starred questions are required — skip the rest if you like.",
  cta: "Get started",
  items: [
    { label: "Owner", text: "Who you are and how to reach you", color: COLORS.steel },
    { label: "Property", text: "Type, location, size and approvals", color: COLORS.teal },
    { label: "Price", text: "Your expected price and timeline", color: COLORS.coral },
  ],
};

function NumberField({ label, placeholder, value, onChange, className = "" }) {
  return (
    <TextField
      className={className}
      label={label}
      type="number"
      inputMode="decimal"
      min="0"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

const steps = [
  {
    label: "Owner type",
    title: "Are you the property owner?",
    valid: (f) => f.ownership,
    render: (f, set) => <ChoiceGroup options={OWNER_TYPE} value={f.ownership} onChange={(v) => set("ownership", v)} required />,
  },
  {
    label: "Personal details",
    title: "Who should we contact?",
    hint: "The mediator will message you on WhatsApp.",
    valid: (f) => f.name.trim() && isValidPhone(f.phone),
    render: (f, set) => (
      <>
        <TextField label="Full name" required autoComplete="name" placeholder="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <PhoneField value={f.phone} onChange={(v) => set("phone", v)} />
      </>
    ),
  },
  {
    label: "Property type",
    title: "What are you selling?",
    valid: (f) => f.propertyType,
    render: (f, set) => <ChoiceGroup options={PROPERTY_TYPES} value={f.propertyType} onChange={(v) => set("propertyType", v)} required />,
  },
  {
    label: "Location",
    title: "Where is the property?",
    valid: (f) => f.propertyLocation.trim(),
    render: (f, set) => (
      <>
        <TextField label="Area / locality" required placeholder="e.g. Ambattur, Anna Nagar" value={f.propertyLocation} onChange={(e) => set("propertyLocation", e.target.value)} />
        <ChoiceGroup label="Photos and videos" options={PHOTOS_SHARED} value={f.photosShared} onChange={(v) => set("photosShared", v)} />
      </>
    ),
  },
  {
    label: "Status & age",
    title: "Status and age",
    valid: (f) => f.propertyStatus,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Property status" required options={PROPERTY_STATUS} value={f.propertyStatus} onChange={(v) => set("propertyStatus", v)} />
        <ChoiceGroup label="Property age" options={PROPERTY_AGE} value={f.propertyAge} onChange={(v) => set("propertyAge", v)} />
        <ChoiceGroup label="Purpose" options={PURPOSE} value={f.purpose} onChange={(v) => set("purpose", v)} />
      </>
    ),
  },
  {
    label: "Building",
    title: "About the building",
    optional: true,
    valid: () => true,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Building type" options={BUILDING_TYPE} value={f.buildingType} onChange={(v) => set("buildingType", v)} />
        <ChoiceGroup label="Property usage" options={PROPERTY_USAGE} value={f.propertyUsage} onChange={(v) => set("propertyUsage", v)} />
      </>
    ),
  },
  {
    label: "Size",
    title: "How big is it?",
    optional: true,
    valid: () => true,
    render: (f, set) => (
      <>
        <NumberField label="Land area (sq.ft)" placeholder="e.g. 1200" value={f.landArea} onChange={(v) => set("landArea", v)} />
        <NumberField label="Built-up area (sq.ft)" placeholder="e.g. 1800" value={f.builtUpArea} onChange={(v) => set("builtUpArea", v)} />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <NumberField className="!mt-0" label="Frontage length (ft)" placeholder="Length" value={f.frontageLength} onChange={(v) => set("frontageLength", v)} />
          <NumberField className="!mt-0" label="Frontage breadth (ft)" placeholder="Breadth" value={f.frontageBreadth} onChange={(v) => set("frontageBreadth", v)} />
        </div>
      </>
    ),
  },
  {
    label: "Road & facing",
    title: "Road and facing",
    optional: true,
    valid: () => true,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Road width" options={ROAD_WIDTH} value={f.roadWidth} onChange={(v) => set("roadWidth", v)} />
        <ChoiceGroup label="Facing" options={FACING} value={f.facing} onChange={(v) => set("facing", v)} />
      </>
    ),
  },
  {
    label: "Approvals",
    title: "Patta and approvals",
    optional: true,
    valid: () => true,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Patta / approval" options={PATTA_APPROVAL} value={f.pattaApproval} onChange={(v) => set("pattaApproval", v)} />
        <ChoiceGroup label="Approval status" options={APPROVAL_STATUS} value={f.approvalStatus} onChange={(v) => set("approvalStatus", v)} />
      </>
    ),
  },
  {
    label: "Parking & loan",
    title: "Parking, rental and loan",
    optional: true,
    valid: () => true,
    render: (f, set) => (
      <>
        <ChoiceGroup label="Parking" options={PARKING} value={f.parking} onChange={(v) => set("parking", v)} />
        <ChoiceGroup label="Rental status" options={RENTAL_STATUS} value={f.rentalStatus} onChange={(v) => set("rentalStatus", v)} />
        <ChoiceGroup label="Loan status" options={LOAN_STATUS} value={f.loanStatus} onChange={(v) => set("loanStatus", v)} />
      </>
    ),
  },
  {
    label: "Price",
    title: "What price do you expect?",
    valid: (f) => f.expectedPrice,
    render: (f, set) => <ChoiceGroup options={PRICE_RANGES} value={f.expectedPrice} onChange={(v) => set("expectedPrice", v)} required />,
  },
  {
    label: "Timeline",
    title: "When are you planning to sell?",
    valid: (f) => f.timeline,
    render: (f, set) => (
      <>
        <ChoiceGroup options={TIMELINE} value={f.timeline} onChange={(v) => set("timeline", v)} required />
        <div className="mt-7">
          <TextField
            label="Anything else buyers should know?"
            multiline
            placeholder="Optional — e.g. corner plot, near the metro, owner relocating"
            value={f.sellerRemarks}
            onChange={(e) => set("sellerRemarks", e.target.value)}
          />
        </div>
      </>
    ),
  },
];

export default function Seller() {
  return (
    <Wizard
      role="Seller"
      initialForm={initialForm}
      landing={landing}
      steps={steps}
      reviewTitle="Review your listing"
      reviewNote="Check everything looks right. Tap any row to change it."
      reviewRows={(f) => [
        { label: "Owner type", value: f.ownership, step: 1 },
        { label: "Name", value: f.name, step: 2 },
        { label: "Mobile", value: f.phone, step: 2 },
        { label: "Property", value: f.propertyType, step: 3 },
        { label: "Location", value: f.propertyLocation, step: 4 },
        { label: "Photos", value: f.photosShared, step: 4 },
        { label: "Status", value: f.propertyStatus, step: 5 },
        { label: "Age", value: f.propertyAge, step: 5 },
        { label: "Purpose", value: f.purpose, step: 5 },
        { label: "Building", value: f.buildingType, step: 6 },
        { label: "Usage", value: f.propertyUsage, step: 6 },
        { label: "Land area", value: f.landArea ? `${f.landArea} sq.ft` : "", step: 7 },
        { label: "Built-up", value: f.builtUpArea ? `${f.builtUpArea} sq.ft` : "", step: 7 },
        { label: "Frontage", value: f.frontageLength || f.frontageBreadth ? `${f.frontageLength || "–"} × ${f.frontageBreadth || "–"} ft` : "", step: 7 },
        { label: "Road width", value: f.roadWidth, step: 8 },
        { label: "Facing", value: f.facing, step: 8 },
        { label: "Patta", value: f.pattaApproval, step: 9 },
        { label: "Approval", value: f.approvalStatus, step: 9 },
        { label: "Parking", value: f.parking, step: 10 },
        { label: "Rental", value: f.rentalStatus, step: 10 },
        { label: "Loan", value: f.loanStatus, step: 10 },
        { label: "Price", value: f.expectedPrice, step: 11 },
        { label: "Timeline", value: f.timeline, step: 12 },
        { label: "Remarks", value: f.sellerRemarks.trim(), step: 12 },
      ]}
      submit={(f) => addSellerLead({ ...f, name: f.name.trim(), propertyLocation: f.propertyLocation.trim() })}
      submitLabel="Submit listing"
      success={{
        title: "Listing submitted successfully",
        text: (f) =>
          `We've saved your listing in ${f.propertyLocation.trim()}. As the seller, you can message the mediator directly on WhatsApp — they'll follow up with you personally.`,
        primary: (f) => ({
          label: "Message the mediator on WhatsApp",
          href: whatsappLink(
            MEDIATOR_WHATSAPP_NUMBER,
            `New seller registration — ${f.propertyType}\n` +
              `From: ${f.name} (${f.phone})\n` +
              `Location: ${f.propertyLocation}\n` +
              `Status: ${f.propertyStatus}\n` +
              `Expected price: ${f.expectedPrice}\n` +
              `Ownership: ${f.ownership}\n` +
              `Planning to sell: ${f.timeline}`
          ),
        }),
        againLabel: "List another property",
      }}
    />
  );
}
