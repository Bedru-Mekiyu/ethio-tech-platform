import { Card } from "@/components/ui/card";

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <h1 className="text-3xl font-bold">Blog & resources</h1>
      <p className="text-[var(--text-secondary)]">Stories from learners, mentors, and hubs across Ethiopia.</p>
      <Card className="p-8 text-center">
        <p className="text-[var(--text-muted)]">No posts published yet. Check back soon.</p>
      </Card>
    </div>
  );
}
