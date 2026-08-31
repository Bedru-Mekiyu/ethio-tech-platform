import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  GraduationCap,
  Heart,
  Layers3,
  Mail,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

type PartnerPillar = "employers" | "universities" | "ngos" | "government";

const partnerFrameworks = [
  {
    id: "employers" as PartnerPillar,
    title: "Tech Employers & Industry",
    tagline: "Direct Hiring Pipeline & Sponsored Capstones",
    icon: Code2,
    badgeTone: "default" as const,
    badgeText: "Talent Acquisition",
    description:
      "Bridge the practical skill gap by accessing pre-vetted junior to mid-level software engineers, cloud practitioners, and UI/UX designers trained on real-world stacks.",
    deliverables: [
      "Curated access to top 10% graduating engineers with verified GitHub portfolios",
      "Sponsor real-world capstone challenges tailored to your company's tech stack",
      "Direct technical interview scheduling & rapid 14-day hiring turnaround",
      "Co-branded hackathons, engineering fellowships, and apprenticeship cohorts",
    ],
    metrics: "94% job placement rate across hiring partners within 90 days of graduation.",
    partnerTypes: ["Fintech & Banking", "Telecom & ISP", "Global Outsourcing", "Fast-growth Startups"],
  },
  {
    id: "universities" as PartnerPillar,
    title: "Universities & TVETs",
    tagline: "Practical Engineering Lab Supplement",
    icon: GraduationCap,
    badgeTone: "purple" as const,
    badgeText: "Academic Integration",
    description:
      "Complement theoretical computer science curricula with modern, hands-on software engineering tracks, automated code assessment, and local offline lab caching.",
    deliverables: [
      "Plug-and-play practical lab modules mapped to university semester schedules",
      "Local offline caching servers installed in campus labs to eliminate bandwidth costs",
      "Faculty upskilling programs in modern cloud, microservices, and AI engineering",
      "Accredited micro-credentials and joint diploma verification for graduating students",
    ],
    metrics: "Over 3,500 university students actively completing practical lab projects.",
    partnerTypes: ["Public Universities", "Private Colleges", "TVET Institutes", "Polytechnics"],
  },
  {
    id: "ngos" as PartnerPillar,
    title: "NGOs & Foundations",
    tagline: "Youth Digital Skills & Inclusion Funding",
    icon: Heart,
    badgeTone: "success" as const,
    badgeText: "Social Impact",
    description:
      "Deploy catalytic donor funding into measurable youth livelihood programs with transparent milestone tracking, gender-inclusive cohorts, and regional hub access.",
    deliverables: [
      "Targeted scholarship cohorts for women in tech, rural youth, and vulnerable groups",
      "Audit-ready milestone reporting with real-time student completion verification",
      "Hardware donation deployment (laptops, solar units) with full serial tracking",
      "Standardized Monitoring, Evaluation, and Learning (MEL) export dashboards",
    ],
    metrics: "100% auditable fund allocation with transparent, verifiable student tracking.",
    partnerTypes: ["Multilateral Donors", "Philanthropic Trusts", "Youth Development NGOs", "Diaspora Foundations"],
  },
  {
    id: "government" as PartnerPillar,
    title: "Government & Public Sector",
    tagline: "National Digital Ethiopia 2025 Alignment",
    icon: Building2,
    badgeTone: "warning" as const,
    badgeText: "Public Infrastructure",
    description:
      "Collaborate with municipal and regional administrations to establish sovereign technical education, regional innovation hubs, and civil service digital capacity.",
    deliverables: [
      "Alignment with Ministry of Innovation and Technology (MInT) workforce goals",
      "Public-private regional tech hub deployments equipped with offline sync nodes",
      "Civil servant digital transformation upskilling and civic tech challenge sprints",
      "Data sovereignty compliance with on-premise and hybrid educational hosting",
    ],
    metrics: "6 regional hub nodes established across key economic corridors in Ethiopia.",
    partnerTypes: ["Ministries & Agencies", "Regional Innovation Bureaus", "Municipal Tech Offices", "Public Schools"],
  },
];

const partnershipProcess = [
  {
    step: "01",
    title: "Strategic Discovery & Needs Assessment",
    description:
      "We conduct an institutional audit to align objectives—whether hiring 50 engineers, upskilling 1,000 university students, or funding a regional hub.",
    icon: Layers3,
  },
  {
    step: "02",
    title: "Framework Agreement & MoU",
    description:
      "We formalize governance, data sharing protocols, milestone schedules, and measurable KPI benchmarks in a clear partnership MoU.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Integration & Cohort Onboarding",
    description:
      "We deploy offline lab servers, configure custom curriculum tracks, or open verified talent pipeline dashboards for your team.",
    icon: Cpu,
  },
  {
    step: "04",
    title: "Execution, Verification & Scaled Impact",
    description:
      "Continuous tracking with live analytics, regular milestone reviews, capstone showcase days, and post-program talent placement.",
    icon: Rocket,
  },
];

const partnerTestimonials = [
  {
    quote:
      "EthioTech's graduates arrived with battle-tested experience in modern microservices and React. They contributed to our production codebase in their second week.",
    author: "Dawit Haile",
    role: "VP of Engineering",
    organization: "Fintech Innovation Labs (Addis Ababa)",
  },
  {
    quote:
      "The offline caching server deployed in our computer lab allowed 400+ engineering students to write and test code without relying on unpredictable internet connections.",
    author: "Dr. Aster Tadesse",
    role: "Dean of Computing & Informatics",
    organization: "Regional Technology Institute",
  },
  {
    quote:
      "The milestone tracking on EthioTech is unmatched. Every single dollar we grant can be traced directly to verified student project completion and certification.",
    author: "Elena Rostova",
    role: "Programs Director",
    organization: "Digital Opportunity Africa Trust",
  },
];

const faqs = [
  {
    q: "How does EthioTech ensure the technical competency of graduates?",
    a: "Every student must complete multi-week capstone projects that undergo strict automated test evaluation and live code review by senior mentors with 2+ years of industry experience.",
  },
  {
    q: "What is required to deploy an offline caching server in our university or school?",
    a: "We provide an optimized lightweight micro-server image that runs on standard campus hardware or low-power mini-PCs. It caches all video lectures, interactive coding sandboxes, and documentation locally.",
  },
  {
    q: "Can international organizations and diaspora firms hire directly through the platform?",
    a: "Yes. We support remote global hiring pipelines, hybrid co-op models, and direct contractor onboarding with verified identity and tax-compliant documentation.",
  },
  {
    q: "How are grant funds governed and audited?",
    a: "All scholarship funding is linked to verified student progression milestones. We provide quarterly audited financial statements and downloadable MEL data exports.",
  },
];

export function PartnersPage() {
  const reduceMotion = useReducedMotion();
  const [selectedPillar, setSelectedPillar] = useState<PartnerPillar>("employers");
  const [inquiryType, setInquiryType] = useState<PartnerPillar>("employers");
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [region, setRegion] = useState("Addis Ababa");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeFramework = partnerFrameworks.find((f) => f.id === selectedPillar) || partnerFrameworks[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
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
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-0.5 text-xs font-medium text-violet-400">
          <Sparkles size={13} />
          <span>Institutional Alliances & Ecosystem</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Empowering Ethiopia&apos;s Digital Economy Through{" "}
          <span className="text-violet-400">Strategic Alliances</span>
        </h1>

        <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
          We partner with forward-thinking tech employers, universities, multilateral development agencies, and
          government bodies to build a sovereign, world-class technical workforce across Ethiopia.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a href="#partner-inquiry">
            <Button size="md" className="font-medium">
              Initiate Partnership
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </a>
          <a href="#frameworks">
            <Button variant="outline" size="md">
              Explore Frameworks
            </Button>
          </a>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-violet-400 font-mono md:text-2xl">94%</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Placement Rate</p>
            <p className="mt-0.5 text-xs text-zinc-400">Within 90 days</p>
          </Card>
          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-white font-mono md:text-2xl">35+</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Partner Entities</p>
            <p className="mt-0.5 text-xs text-zinc-400">Academic & NGO</p>
          </Card>
          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-emerald-400 font-mono md:text-2xl">6</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Regional Hubs</p>
            <p className="mt-0.5 text-xs text-zinc-400">Across Ethiopia</p>
          </Card>
          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-white font-mono md:text-2xl">10K+</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Engineers Target</p>
            <p className="mt-0.5 text-xs text-zinc-400">By 2026</p>
          </Card>
        </div>
      </motion.section>

      {/* ─── 4 Collaboration Frameworks Section ─── */}
      <section id="frameworks" className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Collaboration Pillars</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Tailored Frameworks for Every Stakeholder
          </h2>
          <p className="text-xs text-zinc-400">
            Whether you are hiring software talent, modernizing campus labs, deploying donor grants, or driving public
            policy, we have a structured framework.
          </p>
        </div>

        {/* Pillar Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          {partnerFrameworks.map((framework) => {
            const Icon = framework.icon;
            const isSelected = selectedPillar === framework.id;
            return (
              <button
                key={framework.id}
                type="button"
                onClick={() => setSelectedPillar(framework.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{framework.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Framework Detailed View */}
        <motion.div
          key={activeFramework.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-[#27272A] bg-[#0E0E11] p-6 md:p-8 shadow-lg">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#141418] text-violet-400 border border-[#27272A]">
                    <activeFramework.icon size={20} />
                  </div>
                  <div>
                    <Badge variant={activeFramework.badgeTone} size="sm">
                      {activeFramework.badgeText}
                    </Badge>
                    <h3 className="text-lg font-bold text-white mt-0.5">{activeFramework.title}</h3>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-zinc-400">{activeFramework.description}</p>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                    Key Value Deliverables
                  </p>
                  <ul className="space-y-1.5">
                    {activeFramework.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 flex items-center gap-2.5">
                  <Award size={18} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-zinc-400 font-medium">
                    <strong className="text-white">Impact Metric:</strong> {activeFramework.metrics}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#141418] p-5 space-y-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-white">Target Organizations</h4>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {activeFramework.partnerTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-md border border-[#27272A] bg-[#0E0E11] px-2.5 py-1 text-[11px] text-zinc-400 font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-[#27272A] bg-[#0E0E11] p-4">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Zap size={14} className="text-violet-400" />
                    Ready to collaborate?
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set up a 20-minute alignment consultation with our institutional partnership lead to review cohort
                    timelines and resource deployment.
                  </p>
                  <a href="#partner-inquiry" className="block">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setInquiryType(activeFramework.id);
                      }}
                    >
                      Partner as {activeFramework.title}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ─── Partnership Process / Lifecycle ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="default">Structured Delivery</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">The Partnership Lifecycle</h2>
          <p className="text-xs text-zinc-400">
            A frictionless, transparent 4-phase framework designed for rapid execution and accountable outcomes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {partnershipProcess.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.step}
                className="relative flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418] text-violet-400 border border-[#27272A]">
                      <Icon size={16} />
                    </div>
                    <span className="text-xl font-bold font-mono text-zinc-600">{step.step}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Partner Testimonials & Institutional Trust ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Institutional Voices</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Trusted by Leaders Across the Ecosystem
          </h2>
          <p className="text-xs text-zinc-400">
            Hear from corporate executives, university deans, and development specialists accelerating impact with us.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {partnerTestimonials.map((t, idx) => (
            <Card key={idx} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
              <p className="text-xs leading-relaxed text-zinc-300 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-[#27272A]">
                <p className="font-semibold text-white text-xs">{t.author}</p>
                <p className="text-xs text-violet-400 font-medium">{t.role}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t.organization}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Interactive Partnership Inquiry Form ─── */}
      <section id="partner-inquiry" className="scroll-mt-16">
        <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-6 md:p-10 shadow-lg">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-0.5 text-xs font-medium text-violet-400">
                <Mail size={13} />
                <span>Institutional Relations</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Let&apos;s Build Together</h2>

              <p className="text-xs leading-relaxed text-zinc-400">
                Submit your partnership requirements. Our Institutional Alliances team will prepare a tailored
                collaboration prospectus and schedule a discovery briefing within 24–48 business hours.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-violet-400 border border-[#27272A]">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Direct Email</p>
                    <p className="font-medium text-white">partnerships@ethiotech.org</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-violet-400 border border-[#27272A]">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">HQ Hotline</p>
                    <p className="font-medium text-white">+251 11 668 5400 (Addis Ababa)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-emerald-400 border border-[#27272A]">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Data Governance</p>
                    <p className="font-medium text-white">ISO & GDPR aligned partner privacy</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Partnership Inquiry Logged</h3>
                  <p className="text-xs leading-relaxed text-zinc-400 max-w-md mx-auto">
                    Thank you, <strong className="text-white">{contactName || "partner"}</strong> from{" "}
                    <strong className="text-white">{orgName || "your organization"}</strong>. Our institutional team has
                    received your inquiry for <strong className="text-violet-400">{inquiryType}</strong> and will follow
                    up within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSubmitted(false);
                      setOrgName("");
                      setContactName("");
                      setEmail("");
                      setPhone("");
                      setMessage("");
                    }}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                      Partnership Category
                    </Label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 sm:grid-cols-4">
                      {partnerFrameworks.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setInquiryType(f.id)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                            inquiryType === f.id
                              ? "border-violet-500 bg-violet-600 text-white"
                              : "border-[#27272A] bg-[#141418] text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          {f.badgeText}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label required>Organization / Institution Name</Label>
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        placeholder="e.g. Telebirr Labs / Addis Ababa University"
                      />
                    </div>
                    <div>
                      <Label required>Contact Person & Title</Label>
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        placeholder="e.g. Bethlehem Bekele (Head of HR)"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label required>Official Email Address</Label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        placeholder="e.g. b.bekele@organization.com"
                      />
                    </div>
                    <div>
                      <Label>Phone / WhatsApp</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        placeholder="+251 91 234 5678"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Website / Link</Label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        type="url"
                        placeholder="https://organization.com"
                      />
                    </div>
                    <div>
                      <Label>Primary Region of Focus</Label>
                      <Input
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="Addis Ababa, Hawassa, Nationwide..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label required>Partnership Objectives & Scope</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Outline your target goals (e.g. hire 20 junior React engineers, sponsor 200 high school girls in coding, or deploy offline lab servers in 3 campus locations)."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" size="md" className="w-full font-medium" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting Inquiry..." : "Submit Institutional Partnership Inquiry"}
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Institutional FAQ Section ─── */}
      <section className="space-y-6">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="default">Institutional FAQ</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Frequently Asked Questions</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-[#27272A] bg-[#0E0E11] p-5 space-y-1.5 shadow-md">
              <h3 className="font-semibold text-white text-xs">{faq.q}</h3>
              <p className="text-xs leading-relaxed text-zinc-400">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 text-center space-y-4 shadow-lg">
        <div className="mx-auto max-w-2xl space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Ready to shape Ethiopia&apos;s digital workforce?
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            Download our institutional partnership one-pager or connect directly with our partnerships lead.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a href="#partner-inquiry">
            <Button size="md" className="font-medium">
              Initiate Collaboration
            </Button>
          </a>
          <Link to="/how-it-works">
            <Button variant="outline" size="md">
              Explore Learning Engine
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="md" className="text-violet-400 hover:text-white">
              Contact Leadership
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
