import { Card } from "@/components/ui/card";

export function PartnersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <h1 className="text-3xl font-bold">Partner schools</h1>
      <p className="text-[var(--text-secondary)]">
        EthioTech partners with schools and community hubs to reach learners nationwide.
      </p>
      <Card className="p-8 text-center">
        <p className="text-[var(--text-muted)]">No partner schools listed yet. Check back soon.</p>
      </Card>
    </div>
  );
}
