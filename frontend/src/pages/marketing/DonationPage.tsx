import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DonationPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8 py-12 text-center">
      <h1 className="text-3xl font-bold">Support the mission</h1>
      <p className="text-[var(--text-secondary)]">
        EthioTech is impact-first. Donations fund hubs, devices, and mentor stipends for underserved
        learners.
      </p>
      <Card className="p-6">
        <p className="text-sm text-[var(--text-muted)]">Payment integration coming soon.</p>
        <a href="/contact" className="mt-4 inline-block">
          <Button>Contact us to contribute</Button>
        </a>
      </Card>
    </div>
  );
}
