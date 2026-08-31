import { Card } from "@/components/ui/card";

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Blog & Resources</h1>
        <p className="mt-1 text-xs text-zinc-400">Stories and technical updates from learners, mentors, and regional hubs.</p>
      </div>
      <Card className="border-[#27272A] bg-[#0E0E11] p-8 text-center">
        <p className="text-xs text-zinc-500">No posts published yet. Check back soon.</p>
      </Card>
    </div>
  );
}
