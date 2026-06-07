import { EmptyState } from "@/components/composites/EmptyState";
import { Sparkles } from "lucide-react";

interface SessionNote {
  summary?: string;
  actionItems?: string[];
  keyTakeaways?: string[];
}

interface StudentNotesPanelProps {
  notes: SessionNote;
}

export function StudentNotesPanel({ notes }: StudentNotesPanelProps) {
  if (!notes || (!notes.summary && !notes.actionItems?.length && !notes.keyTakeaways?.length)) {
    return (
      <div className="flex flex-col h-full mt-8">
        <EmptyState
          title="No session notes"
          description="AI-generated notes and key takeaways will appear here once the mentor generates them."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 overflow-y-auto space-y-6">
        {notes.summary && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-primary" />
              Session Summary
            </h4>
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
              {notes.summary}
            </div>
          </div>
        )}

        {notes.keyTakeaways && notes.keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Key Takeaways</h4>
            <ul className="space-y-2">
              {notes.keyTakeaways.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.actionItems && notes.actionItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Action Items</h4>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <ul className="space-y-3">
                {notes.actionItems.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border)]" />
                    <span className="text-sm text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
