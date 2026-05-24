import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CodingWorkspacePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coding workspace</h1>
      <Card className="p-6">
        <p className="text-[var(--text-secondary)]">
          In-browser coding exercises and project sandboxes will launch here. For now, open lesson
          sandboxes from your track modules.
        </p>
        <a href="/app/tracks" className="mt-4 inline-block">
          <Button>Go to tracks</Button>
        </a>
      </Card>
    </div>
  );
}
