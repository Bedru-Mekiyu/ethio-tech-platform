import { Card } from "@/components/ui/card";

export function PartnersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <h1 className="text-3xl font-bold">Partner schools</h1>
      <p className="text-[var(--text-secondary)]">
        EthioTech partners with schools and community hubs to reach learners nationwide.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {["Addis STEM Academy", "Bahir Dar Youth Hub", "Hawassa Code Club"].map((name) => (
          <Card key={name} className="p-4">
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Pilot partner · 2026</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
