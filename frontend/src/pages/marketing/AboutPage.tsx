import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "5,000+", label: "Active students" },
  { value: "120+", label: "Expert mentors" },
  { value: "500k", label: "Lines of code" },
  { value: "85%", label: "Job placement" },
];

const roadmap = [
  { year: "2022", title: "The Genesis", desc: "Founded to bridge Ethiopia's practical tech education gap." },
  { year: "2023", title: "Platform Launch", desc: "First immersive learning tracks and mentor network." },
  { year: "2024", title: "Gamified Experience", desc: "XP, badges, leaderboards, and virtual classrooms." },
  { year: "2025", title: "Scaling Nationally", desc: "Hubs across major cities and nationwide partnerships." },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <p className="text-center text-xs uppercase tracking-widest text-primary">About EthioTech</p>
      <h1 className="mt-4 text-center text-4xl font-bold md:text-5xl">
        Empowering the Next Generation of{" "}
        <span className="glow-text">Ethiopian Tech Leaders</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-center text-[var(--text-secondary)]">
        A non-profit organization bridging the gap in software engineering and IT education through
        immersive, gamified learning environments.
      </p>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Card>
          <Badge variant="default" className="mb-3">
            Our Mission
          </Badge>
          <p className="text-[var(--text-secondary)]">
            Deliver free, hands-on tech education with mentorship from Ethiopian professionals
            worldwide.
          </p>
        </Card>
        <Card>
          <Badge variant="purple" className="mb-3">
            Our Vision
          </Badge>
          <p className="text-[var(--text-secondary)]">
            Make Ethiopia one of Africa's most technologically capable nations through youth
            empowerment.
          </p>
        </Card>
      </div>

      <div className="mt-20 grid gap-12 lg:grid-cols-2">
        <div className="aspect-video rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/10" />
        <div>
          <Badge variant="purple">The problem</Badge>
          <h2 className="mt-4 text-2xl font-bold">Bridging the Tech Education Gap</h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Theory-heavy curricula leave students without practical skills. EthioTech combines
            project-based learning, gamification, and live mentorship.
          </p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs uppercase text-primary">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-20 text-center text-2xl font-bold">Our Roadmap</h2>
      <div className="relative mx-auto mt-12 max-w-2xl border-l border-primary/40 pl-8">
        {roadmap.map((item) => (
          <div key={item.year} className="relative mb-10">
            <span className="absolute -left-[33px] flex h-4 w-4 rounded-full bg-primary" />
            <p className="text-sm text-primary">{item.year}</p>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <Card className="mt-16 text-center">
        <h2 className="text-2xl font-bold">Ready to shape the future?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link to="/register?role=student">
            <Button size="lg">Join as Student</Button>
          </Link>
          <Link to="/register?role=mentor">
            <Button variant="secondary" size="lg">
              Become a Mentor
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
