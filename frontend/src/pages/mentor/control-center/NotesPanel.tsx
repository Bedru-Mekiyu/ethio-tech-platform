import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FileText, Eye, History, Save } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionNotes, updateSessionNotes, publishSessionNotes } from "@/services/mentorControlService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/composites/ToastProvider";

interface NotesPanelProps {
  sessionId: string;
}

export default function NotesPanel({ sessionId }: NotesPanelProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: notes, isLoading } = useQuery({
    queryKey: ["session-notes", sessionId],
    queryFn: () => getSessionNotes(sessionId),
    enabled: !!sessionId,
  });

  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (notes?.content) setContent(notes.content);
  }, [notes?.content]);

  const handleSave = useCallback(
    async (newContent: string) => {
      setContent(newContent);
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateSessionNotes(sessionId, newContent);
          setAutosaveError(false);
        } catch (err) {
          console.error("Autosave notes failed", err);
          toast.error("Failed to save notes");
          setAutosaveError(true);
        }
        setSaving(false);
        queryClient.invalidateQueries({ queryKey: ["session-notes", sessionId] });
      }, 1500);
    },
    [sessionId, queryClient],
  );

  const handlePublish = async () => {
    try {
      await publishSessionNotes(sessionId);
      queryClient.invalidateQueries({ queryKey: ["session-notes", sessionId] });
    } catch (err) {
      console.error("Publish notes failed", err);
      toast.error("Failed to publish notes");
    }
  };

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary p-1.5 rounded-lg">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Interactive Session Notes</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-white/10 hover:bg-white/5 text-white"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={12} /> {showHistory ? "Hide History" : "Version History"}
          </Button>
          <Button size="sm" variant="primary" className="h-8 text-xs gap-1.5 text-white" onClick={handlePublish}>
            <Eye size={12} /> {notes?.isPublished ? "Published to Class" : "Publish to Class"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              {autosaveError ? (
                <>
                  <Save size={12} className="text-red-400" />
                  <span className="text-red-400">Autosave failed — changes not saved</span>
                </>
              ) : (
                <>
                  <Save size={12} className={saving ? "animate-pulse text-primary" : "text-success"} />
                  {saving ? "Saving changes..." : "Autosaved successfully"}
                </>
              )}
            </span>
            <span>Version: {notes?.currentVersion || 1}</span>
          </div>

          <Textarea
            value={content}
            onChange={(e) => handleSave(e.target.value)}
            placeholder="Write session outlines, class notes, or markdown instructions here. Autosaves automatically..."
            className="min-h-[250px] text-sm bg-white/5 border-white/5 text-white placeholder-white/30 rounded-xl focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {showHistory && (
          <div className="w-60 border-l border-white/10 pl-4 space-y-3 shrink-0 animate-slide-in">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1">
              <History size={12} /> Version Logs
            </h4>
            {notes?.versionHistory && notes.versionHistory.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto mcc-scrollbar pr-1">
                {notes.versionHistory.map(
                  (
                    version: {
                      version: number;
                      updatedAt: string;
                      savedBy: string;
                      createdAt?: string;
                      changeSummary?: string;
                    },
                    idx: number,
                  ) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all text-[10px]"
                    >
                      <div className="flex justify-between text-white font-medium">
                        <span>Version {version.version}</span>
                        <span>{new Date(version.createdAt ?? version.updatedAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] truncate mt-1">
                        {version.changeSummary || "Auto-saved backup"}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">No version backups logged yet.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
