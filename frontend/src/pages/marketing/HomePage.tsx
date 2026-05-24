import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "10K+", label: "Lessons completed" },
  { value: "2.5K", label: "Active learners" },
  { value: "120+", label: "Global mentors" },
  { value: "92%", label: "Placement rate" },
];

const pathways = [
  {
    title: "Full-Stack Engineering",
    desc: "Build modern web apps with React, Node, and databases.",
    tags: ["React", "Node.js", "MongoDB", "AWS"],
  },
  {
    title: "AI & Data Science",
    desc: "Master Python, ML workflows, and data pipelines.",
    tags: ["Python", "TensorFlow", "Pandas", "SQL"],
  },
  {
    title: "Cyber Defense",
    desc: "Learn networks, Linux hardening, and ethical hacking.",
    tags: ["Linux", "Networks", "Crypto", "Pen Testing"],
  },
];

const mentors = [
  { name: "Elias M.", role: "Senior Software Engineer", company: "Google" },
  { name: "Betelihem A.", role: "Staff Engineer", company: "Netflix" },
  { name: "Yonas D.", role: "Security Architect", company: "Microsoft" },
];

export function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8">
        {reduceMotion ? (
          <div>
            <Badge className="mb-4">Starting January 2026</Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Code the Future of <span className="text-primary">Ethiopia</span>
            </h1>
            <p className="mt-6 max-w-lg text-[var(--text-secondary)]">
              An AI-powered virtual campus for software engineers and IT innovators — hands-on,
              gamified, and mentorship-driven from Grade 8 upward.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg">Get Learning</Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="outline" size="lg">
                  Become a Mentor
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4">Starting January 2026</Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Code the Future of <span className="text-primary">Ethiopia</span>
            </h1>
            <p className="mt-6 max-w-lg text-[var(--text-secondary)]">
              An AI-powered virtual campus for software engineers and IT innovators — hands-on,
              gamified, and mentorship-driven from Grade 8 upward.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg">Get Learning</Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="outline" size="lg">
                  Become a Mentor
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
        {reduceMotion ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
              Immersive virtual campus
            </div>
            <Card className="absolute right-4 top-4 border-primary/40 p-3 text-sm">
              <p className="text-[var(--text-muted)]">Active users</p>
              <p className="text-xl font-bold">2,584</p>
              <p className="text-xs text-success">+12% this week</p>
            </Card>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10"
          >
            <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
              Immersive virtual campus
            </div>
            <Card className="absolute right-4 top-4 border-primary/40 p-3 text-sm">
              <p className="text-[var(--text-muted)]">Active users</p>
              <p className="text-xl font-bold">2,584</p>
              <p className="text-xs text-success">+12% this week</p>
            </Card>
          </motion.div>
        )}
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--bg-elevated)] py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 md:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <p className="text-center text-xs uppercase tracking-widest text-primary">Learning pathways</p>
        <h2 className="mt-2 text-center text-3xl font-bold">Master the Tech of Tomorrow</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-secondary)]">
          Structured tracks from foundations to job-ready engineering skills.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pathways.map((p) => (
            <Card key={p.title} className="flex flex-col hover:border-primary/40">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{p.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <Badge key={t} variant="purple">
                    {t}
                  </Badge>
                ))}
              </div>
              <Link to="/how-it-works" className="mt-4 text-sm text-primary hover:underline">
                Explore pathway →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-primary">Expert mentors</p>
            <h2 className="text-2xl font-bold">Learn from Global Industry Leaders</h2>
          </div>
          <Link to="/register?role=mentor">
            <Button variant="outline">View All Mentors</Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {mentors.map((m) => (
            <Card key={m.name} className="text-center">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary ring-4 ring-primary/30" />
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-primary">{m.role}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{m.company}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
