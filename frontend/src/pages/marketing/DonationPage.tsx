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
  const activeAmountUSD = customAmountUSD !== "" ? Number(customAmountUSD) : selectedTierObj ? selectedTierObj.baseUSD : 50;
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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-24">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-6"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Heart size={14} />
          <span>Transparent Impact Philanthropy</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white leading-tight">
          Empower Ethiopian Talent Through <span className="glow-text text-primary">Sovereign Education</span>
        </h1>

        <p className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] md:text-xl">
          Every dollar or birr directly funds student scholarship passes, solar-powered regional tech hubs, and hardware
          distribution to gifted learners across Ethiopia with 100% transparent milestone verification.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-success" /> 100% Auditable Milestones
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <Zap size={14} className="text-primary" /> $50 Sponsors 1 Full Year
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <Laptop2 size={14} className="text-secondary" /> Hardware Donation Drive Active
          </span>
        </div>
      </motion.section>

      {/* ─── Interactive Scholarship Breakdown & Donation Calculator ─── */}
      <section id="donate-now" className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Direct Impact Model</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Choose Your Student Sponsorship Tier
          </h2>
          <p className="text-[var(--text-secondary)]">
            Select a verified outcome tier. Toggle currency and frequency to see your real-world contribution.
          </p>
        </div>

        {/* Currency & Frequency Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-4">
          {/* Frequency Toggle */}
          <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setFrequency("one-time")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                frequency === "one-time"
                  ? "bg-primary text-[var(--bg-base)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              One-Time Contribution
            </button>
            <button
              type="button"
              onClick={() => setFrequency("monthly")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition ${
                frequency === "monthly"
                  ? "bg-secondary text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <Sparkles size={13} />
              Monthly Impact Patron
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Currency:</span>
            <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
              {(["USD", "ETB", "EUR", "GBP"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    currency === c
                      ? "bg-white/20 text-white"
                      : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                className={`relative cursor-pointer flex flex-col justify-between p-6 transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 -translate-y-1"
                    : "border-[var(--border)] bg-[var(--bg-card)]/90 hover:border-primary/40 hover:-translate-y-0.5"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={isSelected ? "default" : "cyan"} className="text-[10px]">
                      {tier.highlight}
                    </Badge>
                    {isSelected && <CheckCircle2 size={18} className="text-primary" />}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">{tier.title}</h3>
                    <p className="text-xs text-primary font-medium mt-0.5">{tier.tagline}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-3xl font-extrabold text-white">
                      {CURRENCY_SYMBOLS[currency]}
                      {tierAmount.toLocaleString()}
                      {frequency === "monthly" && <span className="text-xs font-normal text-[var(--text-muted)]">/mo</span>}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{tier.description}</p>

                  <ul className="space-y-1.5 pt-2 border-t border-white/5 text-[11px] text-[var(--text-secondary)]">
                    {tier.breakdown.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 text-success shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-auto">
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "outline"}
                    className="w-full"
                  >
                    {isSelected ? "Selected" : "Select Tier"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom Amount & Payment Execution Panel */}
        <Card className="border-primary/20 bg-[linear-gradient(180deg,rgba(11,18,32,0.98),rgba(6,10,20,0.98))] p-8 md:p-10 shadow-2xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Summary & Custom Amount */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Contribution Summary</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  You are sponsoring{" "}
                  <strong className="text-primary">
                    {frequency === "monthly" ? "monthly ongoing" : "one-time"}
                  </strong>{" "}
                  technical scholarships with 100% direct allocation.
                </p>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-2">
                <Label>Or Enter a Custom Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                    $
                  </span>
                  <Input
                    type="number"
                    min={5}
                    value={customAmountUSD}
                    onChange={(e) => {
                      setCustomAmountUSD(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)));
                    }}
                    placeholder="Enter custom USD amount (e.g. 250)"
                    className="pl-8 text-base font-semibold"
                  />
                </div>
              </div>

              {/* Live Impact Preview Box */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Calculated Contribution
                  </span>
                  <span className="text-2xl font-bold text-success">
                    {CURRENCY_SYMBOLS[currency]}
                    {convertedAmount.toLocaleString()} {frequency === "monthly" ? "/ month" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Award size={15} className="text-warning shrink-0" />
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
              <label className="flex items-center gap-3 cursor-pointer text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-elevated)] text-primary"
                />
                <span>Make my donation anonymous on the public Wall of Gratitude</span>
              </label>
            </div>

            {/* Right: Multi-Rail Payment Interface */}
            <div className="rounded-2xl border border-[var(--border)] bg-black/40 p-6 space-y-6">
              {/* Payment Rail Tabs */}
              <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentTab("local")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    paymentTab === "local" ? "bg-primary text-black" : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  Telebirr / CBE
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("international")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    paymentTab === "international" ? "bg-primary text-black" : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  Card / Stripe
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("crypto")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    paymentTab === "crypto" ? "bg-primary text-black" : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  Crypto / Web3
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("wire")}
                  className={`rounded-lg py-2 font-semibold transition ${
                    paymentTab === "wire" ? "bg-primary text-black" : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  SWIFT Wire
                </button>
              </div>

              {/* Payment Tab Contents */}
              {paymentSuccess ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center space-y-3">
                  <CheckCircle2 size={36} className="mx-auto text-success" />
                  <h4 className="text-xl font-bold text-white">Thank You for Your Generosity!</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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
                    <div className="space-y-4 text-xs">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                        <p className="font-semibold text-white text-sm flex items-center gap-2">
                          <Smartphone className="text-primary inline" size={16} /> Telebirr / CBE Birr Quick Rails
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          Send directly via Telebirr Merchant Code or CBE Birr Account:
                        </p>
                        <div className="font-mono bg-black/60 p-2.5 rounded-lg border border-white/10 text-white space-y-1">
                          <p>Telebirr Merchant ID: <strong className="text-primary">884920</strong> (EthioTech Foundation)</p>
                          <p>CBE Birr / Account: <strong className="text-primary">1000482910482</strong> (EthioTech Education)</p>
                        </div>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-3">
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
                        <Button type="submit" size="lg" className="w-full">
                          Confirm Telebirr / CBE Contribution
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "international" && (
                    <div className="space-y-4 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <p className="font-semibold text-white text-sm flex items-center gap-2">
                          <CreditCard className="text-primary inline" size={16} /> Credit / Debit Card (Stripe / PayPal)
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          Accepts Visa, MasterCard, American Express, Apple Pay, and Google Pay worldwide.
                        </p>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-3">
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
                        <Button type="submit" size="lg" className="w-full">
                          Proceed to Secure Stripe Gateway
                          <Lock size={14} className="ml-2" />
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "crypto" && (
                    <div className="space-y-4 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <p className="font-semibold text-white text-sm flex items-center gap-2">
                          <CreditCard className="text-secondary inline" size={16} /> Non-Profit Treasury (USDC / USDT / ETH)
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          Direct multichain wallet for decentralized donors (Ethereum & Polygon):
                        </p>
                        <div className="flex items-center justify-between font-mono bg-black/60 p-2.5 rounded-lg border border-white/10 text-white">
                          <span className="truncate">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCrypto("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")}
                            className="ml-2 text-primary hover:text-white"
                          >
                            {copiedAddress ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleDonate} className="space-y-3">
                        <div>
                          <Label>TxHash / Sender Email (Optional for tracking)</Label>
                          <Input
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            placeholder="e.g. donor@domain.com or 0x8f2..."
                          />
                        </div>
                        <Button type="submit" size="lg" className="w-full">
                          Log Web3 Donation Confirmation
                        </Button>
                      </form>
                    </div>
                  )}

                  {paymentTab === "wire" && (
                    <div className="space-y-4 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <p className="font-semibold text-white text-sm flex items-center gap-2">
                          <Building2 className="text-warning inline" size={16} /> Institutional SWIFT Wire Instructions
                        </p>
                        <div className="font-mono bg-black/60 p-3 rounded-lg border border-white/10 text-white space-y-1.5 leading-relaxed">
                          <p>Bank: <strong className="text-primary">Commercial Bank of Ethiopia (CBE)</strong></p>
                          <p>SWIFT Code: <strong className="text-primary">CBETETAA</strong></p>
                          <p>Beneficiary: <strong className="text-white">EthioTech Digital Platform Foundation</strong></p>
                          <p>Account Number (USD): <strong className="text-primary">1000-8849-2910</strong></p>
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
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="success">Hardware Drive</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Donate Laptops & Regional Hub Equipment
          </h2>
          <p className="text-[var(--text-secondary)]">
            Empower Ethiopian students by donating refurbished developer laptops, monitors, Raspberry Pis, and server gear.
            We provide full asset tracking and certified data sanitization.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {ACCEPTED_HARDWARE.map((item, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary border border-secondary/20">
                  <Laptop2 size={20} />
                </div>
                <h3 className="mt-4 font-bold text-white text-base">{item.item}</h3>
                <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">{item.spec}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Hardware Donation Workflow Banner */}
        <Card className="border-primary/20 bg-[linear-gradient(180deg,rgba(13,20,35,0.95),rgba(8,12,22,0.98))] p-8 md:p-10 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <Badge variant="purple">Drop-off & International Freight</Badge>
              <h3 className="text-2xl font-bold text-white">How Hardware Donations Work</h3>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 text-success shrink-0" />
                  <span>
                    <strong className="text-white">Local Drop-off:</strong> Hand over devices at any of our 6 regional
                    hubs in Addis Ababa, Hawassa, Bahir Dar, Dire Dawa, Mekelle, or Jimma.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 text-success shrink-0" />
                  <span>
                    <strong className="text-white">Diaspora Freight:</strong> Free consolidated bulk shipping from our
                    partner collection points in Washington D.C., Atlanta, London, and Frankfurt.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 text-success shrink-0" />
                  <span>
                    <strong className="text-white">DoD 5220.22-M Data Wipe:</strong> Every laptop is sanitized with a
                    certified data erasure certificate provided to donors.
                  </span>
                </li>
              </ul>
              <Button onClick={() => setHardwareModal(true)}>
                Register a Hardware Donation Pledge
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h4 className="text-sm uppercase tracking-wider font-semibold text-white">
                Hardware Drive Impact to Date
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <p className="text-2xl font-bold text-primary">320+</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)] font-semibold mt-0.5">
                    Laptops Deployed
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <p className="text-2xl font-bold text-secondary">6</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)] font-semibold mt-0.5">
                    Hub Labs Equipped
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] italic">
                &ldquo;Receiving a refurbished ThinkPad allowed me to complete my full-stack capstone and land my first
                engineering job.&rdquo; — Mahlet G., Cohort 2
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Transparent Fund Allocation & Governance ─── */}
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="default">Zero Overhead Waste</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Transparent Fund Allocation
          </h2>
          <p className="text-[var(--text-secondary)]">
            We publish quarterly audited reports. Our platform core is independently underwritten so that 100% of your
            gift directly fuels student learning.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FUND_ALLOCATION.map((item, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6"
            >
              <div>
                <p className="text-4xl font-extrabold text-white">{item.percentage}%</p>
                <h3 className="mt-3 font-semibold text-white text-base">{item.label}</h3>
                <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Donor Recognition & Perks Wall ─── */}
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Donor Honor Roll</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Donor Recognition & Stewardship
          </h2>
          <p className="text-[var(--text-secondary)]">
            We honor every patron who invests in the next generation of Ethiopian builders.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {DONOR_RECOGNITION_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/95 p-6"
            >
              <div>
                <Badge variant="default">{tier.range}</Badge>
                <h3 className="mt-3 text-lg font-bold text-white">{tier.name}</h3>
                <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">{tier.perks}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Hardware Pledge Modal ─── */}
      {hardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-primary/30 bg-[var(--bg-card)] p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="purple">Hardware Pledge</Badge>
                <h3 className="text-2xl font-bold text-white mt-1">Register Equipment Donation</h3>
              </div>
              <button
                type="button"
                onClick={() => setHardwareModal(false)}
                className="text-[var(--text-muted)] hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {hardwareSubmitted ? (
              <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-success" />
                <h4 className="text-xl font-bold text-white">Hardware Pledge Logged</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Thank you! Our logistics team will email you shipping labels or local hub drop-off instructions
                  within 24 hours.
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
                className="space-y-4"
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
                <Button type="submit" size="lg" className="w-full">
                  Submit Hardware Pledge
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Have Questions About Institutional Grants?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Our Philanthropy & Grants Committee is available to review multi-year scholarship endowments, CSR budgets,
            and 501(c)(3) fiscal sponsorships.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#donate-now">
            <Button size="lg">Sponsor a Student Today</Button>
          </a>
          <Link to="/partners">
            <Button variant="outline" size="lg">
              Explore Partner Frameworks
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
              Contact Grants Committee
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
