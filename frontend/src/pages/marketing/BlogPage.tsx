import { Card } from "@/components/ui/card";

const posts = [
  { title: "Why Ethiopia needs more builders", date: "2026-01-12" },
  { title: "From Grade 8 to full-stack in 18 months", date: "2026-02-03" },
  { title: "Mentor spotlight: teaching with purpose", date: "2026-03-01" },
];

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <h1 className="text-3xl font-bold">Blog & resources</h1>
      <p className="text-[var(--text-secondary)]">Stories from learners, mentors, and hubs across Ethiopia.</p>
      <div className="space-y-4">
        {posts.map((p) => (
          <Card key={p.title} className="p-4">
            <p className="text-xs text-[var(--text-muted)]">{p.date}</p>
            <h2 className="mt-1 font-semibold">{p.title}</h2>
          </Card>
        ))}
      </div>
    </div>
  );
}
