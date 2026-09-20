import { Card } from "@/components/ui/card";

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blog & Resources</h1>
        <p className="mt-1 text-xs text-slate-600">
          Stories and technical updates from learners, mentors, and regional hubs.
        </p>
      </div>
      <Card className="border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs text-slate-500">No posts published yet. Check back soon.</p>
      </Card>
    </div>
  );
}
