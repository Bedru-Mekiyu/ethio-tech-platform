import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
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

function Code2(props: { size?: number; className?: string }) {
  return <Cpu {...props} />;
}

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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-24">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-6"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles size={14} />
          <span>Institutional Alliances & Ecosystem</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white leading-tight">
          Empowering Ethiopia&apos;s Digital Economy Through{" "}
          <span className="glow-text text-primary">Strategic Alliances</span>
        </h1>

        <p className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] md:text-xl">
          We partner with forward-thinking tech employers, universities, multilateral development agencies, and
          government bodies to build a sovereign, world-class technical workforce across Ethiopia.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a href="#partner-inquiry">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              Initiate Partnership
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>
          <a href="#frameworks">
            <Button variant="outline" size="lg">
              Explore Frameworks
            </Button>
          </a>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-4 pt-10 sm:grid-cols-4">
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center">
            <p className="text-3xl font-extrabold text-primary md:text-4xl">94%</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Placement Rate
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Within 90 days of graduation</p>
          </Card>
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center">
            <p className="text-3xl font-extrabold text-white md:text-4xl">35+</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Partner Entities
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Academic, corporate & NGO</p>
          </Card>
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center">
            <p className="text-3xl font-extrabold text-secondary md:text-4xl">6</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Regional Hubs
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Across Ethiopia&apos;s corridors</p>
          </Card>
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center">
            <p className="text-3xl font-extrabold text-success md:text-4xl">10K+</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Engineers Target
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Practical mastery by 2026</p>
          </Card>
        </div>
      </motion.section>

      {/* ─── 4 Collaboration Frameworks Section ─── */}
      <section id="frameworks" className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Collaboration Pillars</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            Tailored Frameworks for Every Stakeholder
          </h2>
          <p className="text-[var(--text-secondary)]">
            Whether you are hiring software talent, modernizing campus labs, deploying donor grants, or driving public
            policy, we have a structured framework.
          </p>
        </div>

        {/* Pillar Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {partnerFrameworks.map((framework) => {
            const Icon = framework.icon;
            const isSelected = selectedPillar === framework.id;
            return (
              <button
                key={framework.id}
                type="button"
                onClick={() => setSelectedPillar(framework.id)}
                className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/10"
                    : "border-[var(--border)] bg-[var(--bg-card)]/80 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{framework.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Framework Detailed View */}
        <motion.div
          key={activeFramework.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="border-primary/20 bg-[linear-gradient(180deg,rgba(13,20,35,0.95),rgba(8,12,22,0.98))] p-8 md:p-10 shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30">
                    <activeFramework.icon size={24} />
                  </div>
                  <div>
                    <Badge variant={activeFramework.badgeTone}>{activeFramework.badgeText}</Badge>
                    <h3 className="text-2xl font-bold text-white mt-1">{activeFramework.title}</h3>
                  </div>
                </div>

                <p className="text-base leading-relaxed text-[var(--text-secondary)]">
                  {activeFramework.description}
                </p>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                    Key Value Deliverables
                  </p>
                  <ul className="space-y-2.5">
                    {activeFramework.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                  <Award size={22} className="text-warning shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    <strong className="text-white">Impact Metric:</strong> {activeFramework.metrics}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-white/[0.03] p-6 space-y-6">
                <div>
                  <h4 className="text-sm uppercase tracking-wider font-semibold text-white">
                    Target Organizations
                  </h4>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeFramework.partnerTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)] font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    Ready to collaborate?
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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
      <section className="space-y-12">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="default">Structured Delivery</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            The Partnership Lifecycle
          </h2>
          <p className="text-[var(--text-secondary)]">
            A frictionless, transparent 4-phase framework designed for rapid execution and accountable outcomes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {partnershipProcess.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.step}
                className="relative flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      <Icon size={20} />
                    </div>
                    <span className="text-2xl font-black text-white/20">{step.step}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Partner Testimonials & Institutional Trust ─── */}
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Institutional Voices</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            Trusted by Leaders Across the Ecosystem
          </h2>
          <p className="text-[var(--text-secondary)]">
            Hear from corporate executives, university deans, and development specialists accelerating impact with us.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {partnerTestimonials.map((t, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/95 p-6"
            >
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="font-semibold text-white text-sm">{t.author}</p>
                <p className="text-xs text-primary font-medium">{t.role}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.organization}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Interactive Partnership Inquiry Form ─── */}
      <section id="partner-inquiry" className="scroll-mt-16">
        <Card className="relative overflow-hidden border-primary/30 bg-[linear-gradient(180deg,rgba(11,18,32,0.98),rgba(6,10,20,0.98))] p-8 md:p-12 shadow-2xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <Mail size={14} />
                <span>Institutional Relations</span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Let&apos;s Build Together
              </h2>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Submit your partnership requirements. Our Institutional Alliances team will prepare a tailored
                collaboration prospectus and schedule a discovery briefing within 24–48 business hours.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-primary border border-white/10">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Direct Email</p>
                    <p className="font-medium text-white">partnerships@ethiotech.org</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-secondary border border-white/10">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">HQ Hotline</p>
                    <p className="font-medium text-white">+251 11 668 5400 (Addis Ababa)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-success border border-white/10">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Data Governance</p>
                    <p className="font-medium text-white">ISO & GDPR aligned partner privacy</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success border border-success/40">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Partnership Inquiry Logged</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-md mx-auto">
                    Thank you, <strong className="text-white">{contactName || "partner"}</strong> from{" "}
                    <strong className="text-white">{orgName || "your organization"}</strong>. Our institutional
                    team has received your inquiry for <strong className="text-primary">{inquiryType}</strong> and
                    will follow up within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      Partnership Category
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
                      {partnerFrameworks.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setInquiryType(f.id)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            inquiryType === f.id
                              ? "border-primary bg-primary text-[var(--bg-base)]"
                              : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          {f.badgeText}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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

                  <div className="grid gap-4 sm:grid-cols-2">
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

                  <div className="grid gap-4 sm:grid-cols-2">
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

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting Inquiry..." : "Submit Institutional Partnership Inquiry"}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Institutional FAQ Section ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="default">Institutional FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-[var(--border)] bg-[var(--bg-card)]/90 p-6 space-y-2">
              <h3 className="font-semibold text-white text-base">{faq.q}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to shape Ethiopia&apos;s digital workforce?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Download our institutional partnership one-pager or connect directly with our partnerships lead.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#partner-inquiry">
            <Button size="lg">Initiate Collaboration</Button>
          </a>
          <Link to="/how-it-works">
            <Button variant="outline" size="lg">
              Explore Learning Engine
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
              Contact Platform Team
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
