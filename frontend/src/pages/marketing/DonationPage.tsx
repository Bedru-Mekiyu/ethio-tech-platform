import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Award,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Heart,
  Laptop2,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

type Currency = "USD" | "ETB" | "EUR" | "GBP";
type Frequency = "one-time" | "monthly";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  ETB: "Br ",
  EUR: "€",
  GBP: "£",
};

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  ETB: 120,
  EUR: 0.92,
  GBP: 0.78,
};

const SCHOLARSHIP_TIERS = [
  {
    id: "student-year",
    baseUSD: 50,
    title: "1 Student Full-Year Sponsorship",
    tagline: "Core Software Engineering Pathway",
    highlight: "Most Popular",
    description:
      "Funds 1 student's full year of verified track curriculum, cloud compute credits, 12 mentored code reviews, and graduation certification.",
    breakdown: [
      "12 months unlimited platform curriculum & automated test suites",
      "Dedicated 1-on-1 mentor code reviews and capstone feedback",
      "Cloud database and API sandbox compute allocations",
      "Verifiable cryptographic graduation certificate",
    ],
    impactQuote: "Enables an ambitious high school or university student to break into tech.",
  },
  {
    id: "student-hub",
    baseUSD: 150,
    title: "Scholarship + Hub Access Pass",
    tagline: "Curriculum + Physical Dedicated Workstation",
    highlight: "High Impact",
    description:
      "Covers 1 student's annual scholarship plus unlimited drop-in workstation access, high-speed fiber internet, and solar power at their regional tech hub.",
    breakdown: [
      "All benefits of the Full-Year Student Scholarship",
      "Unlimited daily workstation pass at any of our 6 regional hubs",
      "High-speed fiber & satellite connectivity allocation",
      "Monthly local student stipend for transit and meals",
    ],
    impactQuote: "Solves both the curriculum and physical computer/internet divide.",
  },
  {
    id: "equip-pod",
    baseUSD: 500,
    title: "Equip a Regional Workstation Pod",
    tagline: "Hardware & Solar Infrastructure",
    highlight: "Hardware Grant",
    description:
      "Funds the purchase or refurbishment of a high-performance developer workstation (Core i7, 16GB RAM, dual monitors) and its share of the hub solar microgrid.",
    breakdown: [
      "Refurbished enterprise developer PC + dual display monitor",
      "Dedicated solar inverter and lithium battery bank capacity",
      "Peripherals kit (mechanical keyboard, precision mouse, headset)",
      "Covers up to 4 rotated student cohorts annually",
    ],
    impactQuote: "Creates a permanent physical workstation benefiting dozens of learners.",
  },
  {
    id: "classroom-node",
    baseUSD: 2500,
    title: "Community Offline Caching Node",
    tagline: "Powers a 10-Student Rural/School Lab",
    highlight: "Institutional Node",
    description:
      "Deploys a complete local LAN caching micro-server and a 5-seat cluster in a rural or regional secondary school with zero ongoing internet costs.",
    breakdown: [
      "Plug-and-play Linux local edge caching micro-server",
      "Full offline mirror of all platform tracks, video lectures & docs",
      "5 refurbished client terminals and local Gigabit networking switch",
      "Solar inverter package for 100% off-grid community operation",
    ],
    impactQuote: "Transforms an entire classroom into a connected tech academy.",
  },
];

const FUND_ALLOCATION = [
  {
    percentage: 72,
    label: "Direct Student Scholarships & Hub Seats",
    description: "Cloud compute sandboxes, verified track access, exam vouchers, and hub passes.",
  },
  {
    percentage: 18,
    label: "Regional Hub Solar, Edge Servers & Hardware",
    description: "Photovoltaic solar panels, battery banks, local caching servers, and refurbished PCs.",
  },
  {
    percentage: 10,
    label: "Mentor Stipends & Community Logistics",
    description: "Honorariums for senior code reviewers, student hackathon prizes, and hub staff.",
  },
  {
    percentage: 0,
    label: "Overhead & Administrative Fluff",
    description: "100% underwritten by our founding institutional partners.",
  },
];

const DONOR_RECOGNITION_TIERS = [
  {
    name: "Student Sponsor",
    range: "$50 – $249",
    perks: "Impact newsletter, digital certificate of gratitude, and donor honor wall mention.",
  },
  {
    name: "Community Champion",
    range: "$250 – $999",
    perks: "All above + direct letters from sponsored student cohorts and quarterly briefing calls.",
  },
  {
    name: "Ecosystem Patron",
    range: "$1,000 – $4,999",
    perks: "All above + engraved recognition plaque at a regional tech hub of your choice.",
  },
  {
    name: "Founding Benefactor",
    range: "$5,000+",
    perks: "All above + named student fellowship cohort and seat on the Advisory Donor Council.",
  },
];

const ACCEPTED_HARDWARE = [
  { item: "Laptops & MacBooks", spec: "Core i5 / Ryzen 5+, 8GB+ RAM, functional battery & charger" },
  { item: "Monitors & Displays", spec: "1080p Full HD, HDMI / DisplayPort capable, 21-inch+" },
  { item: "Raspberry Pis & Mini-PCs", spec: "Raspberry Pi 4/5 (4GB+), Intel NUCs for offline servers" },
  { item: "Networking & Storage", spec: "Gigabit switches, enterprise Wi-Fi 6 routers, 500GB+ SSDs" },
];

export function DonationPage() {
  const reduceMotion = useReducedMotion();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [selectedTier, setSelectedTier] = useState<string>("student-year");
  const [customAmountUSD, setCustomAmountUSD] = useState<number | "">("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"local" | "international" | "crypto" | "wire">("local");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [hardwareModal, setHardwareModal] = useState(false);
  const [hardwareSubmitted, setHardwareSubmitted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const selectedTierObj = SCHOLARSHIP_TIERS.find((t) => t.id === selectedTier);
  const activeAmountUSD =
    customAmountUSD !== "" ? Number(customAmountUSD) : selectedTierObj ? selectedTierObj.baseUSD : 50;
  const convertedAmount = Math.round(activeAmountUSD * EXCHANGE_RATES[currency]);

  const handleCopyCrypto = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const handleDonate = (e: FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-20 text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-5"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400">
          <Heart size={13} />
          <span>Transparent Impact Philanthropy</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Empower Ethiopian Talent Through <span className="text-indigo-400">Sovereign Education</span>
        </h1>

        <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
          Every dollar or birr directly funds student scholarship passes, solar-powered regional tech hubs, and hardware
          distribution to gifted learners across Ethiopia with 100% transparent milestone verification.
        </p>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <span className="rounded-md border border-[#27272A] bg-[#0E0E11] px-3 py-1 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" /> 100% Auditable Milestones
          </span>
          <span className="rounded-md border border-[#27272A] bg-[#0E0E11] px-3 py-1 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Zap size={13} className="text-indigo-400" /> $50 Sponsors 1 Full Year
          </span>
          <span className="rounded-md border border-[#27272A] bg-[#0E0E11] px-3 py-1 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Laptop2 size={13} className="text-zinc-300" /> Hardware Donation Drive Active
          </span>
        </div>
      </motion.section>

      {/* ─── Interactive Scholarship Breakdown & Donation Calculator ─── */}
      <section id="donate-now" className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Direct Impact Model</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Choose Your Student Sponsorship Tier
          </h2>
          <p className="text-xs text-zinc-400">
            Select a verified outcome tier. Toggle currency and frequency to see your real-world contribution.
          </p>
        </div>

        {/* Currency & Frequency Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#27272A] bg-[#0E0E11] p-3">
          {/* Frequency Toggle */}
          <div className="flex rounded-lg border border-[#27272A] bg-[#141418] p-0.5">
            <button
              type="button"
              onClick={() => setFrequency("one-time")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                frequency === "one-time"
                  ? "border border-indigo-500 bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              One-Time Contribution
            </button>
            <button
              type="button"
              onClick={() => setFrequency("monthly")}
              className={`rounded-md px-3 py-1 text-xs font-medium flex items-center gap-1.5 transition ${
                frequency === "monthly"
                  ? "border border-indigo-500 bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles size={12} />
              Monthly Impact Patron
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Currency:</span>
            <div className="flex rounded-lg border border-[#27272A] bg-[#141418] p-0.5">
              {(["USD", "ETB", "EUR", "GBP"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    currency === c
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SCHOLARSHIP_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id && customAmountUSD === "";
            const tierAmount = Math.round(tier.baseUSD * EXCHANGE_RATES[currency]);

            return (
              <Card
                key={tier.id}
                onClick={() => {
                  setSelectedTier(tier.id);
                  setCustomAmountUSD("");
                }}
                className={`relative cursor-pointer flex flex-col justify-between p-5 transition-all duration-150 rounded-xl ${
                  isSelected
                    ? "border-indigo-500 bg-[#141418] shadow-md shadow-indigo-500/10"
                    : "border-[#27272A] bg-[#0E0E11] hover:border-zinc-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isSelected ? "default" : "cyan"} size="sm">
                      {tier.highlight}
                    </Badge>
                    {isSelected && <CheckCircle2 size={16} className="text-indigo-400" />}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{tier.title}</h3>
                    <p className="text-[11px] text-indigo-400 font-medium mt-0.5">{tier.tagline}</p>
                  </div>

                  <div className="py-1">
                    <p className="text-2xl font-bold font-mono text-white">
                      {CURRENCY_SYMBOLS[currency]}
                      {tierAmount.toLocaleString()}
                      {frequency === "monthly" && <span className="text-xs font-normal text-zinc-500">/mo</span>}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{tier.description}</p>

                  <ul className="space-y-1 pt-2 border-t border-[#27272A] text-[11px] text-zinc-400">
                    {tier.breakdown.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={11} className="mt-0.5 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 mt-auto">
                  <Button size="sm" variant={isSelected ? "primary" : "outline"} className="w-full">
                    {isSelected ? "Selected" : "Select Tier"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom Amount & Payment Execution Panel */}
        <Card className="border-[#27272A] bg-[#0E0E11] p-6 md:p-8 shadow-lg space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Summary & Custom Amount */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Contribution Summary</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  You are sponsoring{" "}
                  <strong className="text-indigo-400">
                    {frequency === "monthly" ? "monthly ongoing" : "one-time"}
                  </strong>{" "}
                  technical scholarships with 100% direct allocation.
                </p>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-1.5">
                <Label>Or Enter a Custom Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
                  <Input
                    type="number"
                    min={5}
                    value={customAmountUSD}
                    onChange={(e) => {
                      setCustomAmountUSD(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)));
                    }}
                    placeholder="Enter custom USD amount (e.g. 250)"
                    className="pl-8 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Live Impact Preview Box */}
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Calculated Contribution
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {CURRENCY_SYMBOLS[currency]}
                    {convertedAmount.toLocaleString()} {frequency === "monthly" ? "/ month" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Award size={14} className="text-amber-400 shrink-0" />
                  <span>
                    Equivalent to full-year scholarships for{" "}
                    <strong className="text-white">
                      {Math.max(1, Math.floor(activeAmountUSD / 50))} student{activeAmountUSD >= 100 ? "s" : ""}
                    </strong>
                    .
                  </span>
                </div>
              </div>

              {/* Anonymous Giving Option */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-[#27272A] bg-[#0E0E11] text-indigo-600"
                />
                <span>Make my donation anonymous on the public Wall of Gratitude</span>
              </label>
            </div>

            {/* Right: Multi-Rail Payment Interface */}
            <div className="rounded-xl border border-[#27272A] bg-[#141418] p-5 space-y-4">
              {/* Payment Rail Tabs */}
              <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#27272A] bg-[#0E0E11] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentTab("local")}
                  className={`rounded-md py-1.5 text-[11px] font-medium transition ${
                    paymentTab === "local"
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Telebirr / CBE
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("international")}
                  className={`rounded-md py-1.5 text-[11px] font-medium transition ${
                    paymentTab === "international"
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Card / Stripe
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("crypto")}
                  className={`rounded-md py-1.5 text-[11px] font-medium transition ${
                    paymentTab === "crypto"
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Crypto / Web3
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("wire")}
                  className={`rounded-md py-1.5 text-[11px] font-medium transition ${
                    paymentTab === "wire"
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  SWIFT Wire
                </button>
              </div>

              {/* Payment Tab Contents */}
              {paymentSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center space-y-2.5">
                  <CheckCircle2 size={30} className="mx-auto text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">Thank You for Your Generosity!</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your contribution of{" "}
                    <strong className="text-white">
                      {CURRENCY_SYMBOLS[currency]}
                      {convertedAmount.toLocaleString()}
                    </strong>{" "}
                    has been recorded. A tax receipt and student milestone tracking link have been dispatched to{" "}
                    <strong className="text-white">{donorEmail || "your email"}</strong>.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setPaymentSuccess(false)}>
                    Submit Another Gift
                  </Button>
                </div>
              ) : (
                <>
                  {paymentTab === "local" && (
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 space-y-1.5">
                        <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <Smartphone className="text-indigo-400 inline" size={14} /> Telebirr / CBE Birr Quick Rails
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          Send directly via Telebirr Merchant Code or CBE Birr Account:
                        </p>
                        <div className="font-mono bg-[#141418] p-2 rounded border border-[#27272A] text-zinc-200 text-[11px] space-y-0.5">
                          <p>
                            Telebirr Merchant ID: <strong className="text-indigo-400">884920</strong> (EthioTech
                            Foundation)
                          </p>
                          <p>
                            CBE Birr / Account: <strong className="text-indigo-400">1000482910482</strong> (EthioTech
                            Education)
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-2.5">
                        <div>
                          <Label required>Your Full Name</Label>
                          <Input
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            required
                            placeholder="e.g. Almaz Tadesse"
                          />
                        </div>
                        <div>
                          <Label required>Email for Tax & Milestone Receipt</Label>
                          <Input
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            type="email"
                            required
                            placeholder="e.g. almaz@example.com"
                          />
                        </div>
                        <Button type="submit" size="md" className="w-full font-medium">
                          Confirm Telebirr / CBE Contribution
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "international" && (
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 space-y-1.5">
                        <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <CreditCard className="text-indigo-400 inline" size={14} /> Credit / Debit Card (Stripe /
                          PayPal)
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          Accepts Visa, MasterCard, American Express, Apple Pay, and Google Pay worldwide.
                        </p>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-2.5">
                        <div>
                          <Label required>Cardholder Name</Label>
                          <Input
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            required
                            placeholder="e.g. Michael Chen"
                          />
                        </div>
                        <div>
                          <Label required>Email for 501(c)(3) Receipt</Label>
                          <Input
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            type="email"
                            required
                            placeholder="e.g. michael@example.com"
                          />
                        </div>
                        <Button type="submit" size="md" className="w-full font-medium">
                          Proceed to Secure Stripe Gateway
                          <Lock size={13} className="ml-1.5" />
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "crypto" && (
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 space-y-1.5">
                        <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <CreditCard className="text-indigo-400 inline" size={14} /> Non-Profit Treasury (USDC / USDT /
                          ETH)
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          Direct multichain wallet for decentralized donors (Ethereum & Polygon):
                        </p>
                        <div className="flex items-center justify-between font-mono bg-[#141418] p-2 rounded border border-[#27272A] text-zinc-200 text-[11px]">
                          <span className="truncate">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCrypto("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")}
                            className="ml-2 text-indigo-400 hover:text-white"
                          >
                            {copiedAddress ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-2.5">
                        <div>
                          <Label>TxHash / Sender Email (Optional for tracking)</Label>
                          <Input
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            placeholder="e.g. donor@domain.com or 0x8f2..."
                          />
                        </div>
                        <Button type="submit" size="md" className="w-full font-medium">
                          Log Web3 Donation Confirmation
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "wire" && (
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 space-y-1.5">
                        <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <Building2 className="text-amber-400 inline" size={14} /> Institutional SWIFT Wire
                          Instructions
                        </p>
                        <div className="font-mono bg-[#141418] p-2.5 rounded border border-[#27272A] text-zinc-200 space-y-1 text-[11px] leading-relaxed">
                          <p>
                            Bank: <strong className="text-indigo-400">Commercial Bank of Ethiopia (CBE)</strong>
                          </p>
                          <p>
                            SWIFT Code: <strong className="text-indigo-400">CBETETAA</strong>
                          </p>
                          <p>
                            Beneficiary: <strong className="text-white">EthioTech Digital Platform Foundation</strong>
                          </p>
                          <p>
                            Account Number (USD): <strong className="text-indigo-400">1000-8849-2910</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <Link to="/contact">
                          <Button variant="outline" size="sm">
                            Request Official Wire Invoice & W-9
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Hardware Donation Drive Section ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="success">Hardware Drive</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Donate Laptops & Regional Hub Equipment
          </h2>
          <p className="text-xs text-zinc-400">
            Empower Ethiopian students by donating refurbished developer laptops, monitors, Raspberry Pis, and server
            gear. We provide full asset tracking and certified data sanitization.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ACCEPTED_HARDWARE.map((item, idx) => (
            <Card key={idx} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                  <Laptop2 size={18} />
                </div>
                <h3 className="mt-3.5 font-semibold text-white text-sm">{item.item}</h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.spec}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Hardware Donation Workflow Banner */}
        <Card className="border-[#27272A] bg-[#0E0E11] p-6 md:p-8 shadow-lg">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <div className="space-y-3.5">
              <Badge variant="purple">Drop-off & International Freight</Badge>
              <h3 className="text-xl font-bold text-white">How Hardware Donations Work</h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">Local Drop-off:</strong> Hand over devices at any of our 6 regional
                    hubs in Addis Ababa, Hawassa, Bahir Dar, Dire Dawa, Mekelle, or Jimma.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">Diaspora Freight:</strong> Free consolidated bulk shipping from our
                    partner collection points in Washington D.C., Atlanta, London, and Frankfurt.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">DoD 5220.22-M Data Wipe:</strong> Every laptop is sanitized with a
                    certified data erasure certificate provided to donors.
                  </span>
                </li>
              </ul>
              <Button size="sm" onClick={() => setHardwareModal(true)}>
                Register a Hardware Donation Pledge
              </Button>
            </div>

            <div className="rounded-xl border border-[#27272A] bg-[#141418] p-5 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-white">
                Hardware Drive Impact to Date
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-[#0E0E11] border border-[#27272A] text-center">
                  <p className="text-xl font-bold text-indigo-400 font-mono">320+</p>
                  <p className="text-[9px] uppercase text-zinc-500 font-semibold mt-0.5">Laptops Deployed</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0E0E11] border border-[#27272A] text-center">
                  <p className="text-xl font-bold text-white font-mono">6</p>
                  <p className="text-[9px] uppercase text-zinc-500 font-semibold mt-0.5">Hub Labs Equipped</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 italic">
                &ldquo;Receiving a refurbished ThinkPad allowed me to complete my full-stack capstone and land my first
                engineering job.&rdquo; — Mahlet G., Cohort 2
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Transparent Fund Allocation & Governance ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="default">Zero Overhead Waste</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Transparent Fund Allocation</h2>
          <p className="text-xs text-zinc-400">
            We publish quarterly audited reports. Our platform core is independently underwritten so that 100% of your
            gift directly fuels student learning.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FUND_ALLOCATION.map((item, idx) => (
            <Card key={idx} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
              <div>
                <p className="text-3xl font-bold font-mono text-white">{item.percentage}%</p>
                <h3 className="mt-2.5 font-semibold text-white text-sm">{item.label}</h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Donor Recognition & Perks Wall ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Donor Honor Roll</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Donor Recognition & Stewardship</h2>
          <p className="text-xs text-zinc-400">
            We honor every patron who invests in the next generation of Ethiopian builders.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {DONOR_RECOGNITION_TIERS.map((tier) => (
            <Card key={tier.name} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
              <div>
                <Badge variant="default" size="sm">
                  {tier.range}
                </Badge>
                <h3 className="mt-2.5 text-sm font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{tier.perks}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Hardware Pledge Modal ─── */}
      {hardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-[#27272A] bg-[#0E0E11] p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="purple" size="sm">
                  Hardware Pledge
                </Badge>
                <h3 className="text-xl font-bold text-white mt-1">Register Equipment Donation</h3>
              </div>
              <button
                type="button"
                onClick={() => setHardwareModal(false)}
                className="text-zinc-500 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            {hardwareSubmitted ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center space-y-2.5">
                <CheckCircle2 size={30} className="mx-auto text-emerald-400" />
                <h4 className="text-lg font-bold text-white">Hardware Pledge Logged</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Thank you! Our logistics team will email you shipping labels or local hub drop-off instructions within
                  24 hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setHardwareModal(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setHardwareSubmitted(true);
                }}
                className="space-y-3.5"
              >
                <div>
                  <Label required>Donor / Organization Name</Label>
                  <Input required placeholder="e.g. Diaspora Tech Guild" />
                </div>
                <div>
                  <Label required>Email Address</Label>
                  <Input type="email" required placeholder="e.g. donor@domain.com" />
                </div>
                <div>
                  <Label required>Equipment Details (Quantity & Model)</Label>
                  <Textarea
                    required
                    placeholder="e.g. 5x Lenovo ThinkPad T480 (i5, 16GB RAM), 2x 24-inch Dell Monitors"
                    rows={3}
                  />
                </div>
                <div>
                  <Label required>Location / Drop-off Preference</Label>
                  <Input required placeholder="Addis Ababa Hub, Washington D.C., or DHL Freight" />
                </div>
                <Button type="submit" size="md" className="w-full font-medium">
                  Submit Hardware Pledge
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-8 md:p-10 text-center space-y-5 shadow-lg">
        <div className="mx-auto max-w-2xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Have Questions About Institutional Grants?</h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            Our Philanthropy & Grants Committee is available to review multi-year scholarship endowments, CSR budgets,
            and 501(c)(3) fiscal sponsorships.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#donate-now">
            <Button size="lg" className="font-medium">
              Sponsor a Student Today
            </Button>
          </a>
          <Link to="/partners">
            <Button variant="outline" size="lg">
              Explore Partner Frameworks
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-indigo-400 hover:text-white">
              Contact Grants Committee
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
