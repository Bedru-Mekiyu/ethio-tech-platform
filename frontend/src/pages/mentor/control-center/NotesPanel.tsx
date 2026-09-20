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
    <Card className="border-slate-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 text-zinc-900 border border-zinc-200 p-1.5 rounded-lg">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Interactive Session Notes</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
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
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              {autosaveError ? (
                <>
                  <Save size={12} className="text-red-500" />
                  <span className="text-red-500">Autosave failed — changes not saved</span>
                </>
              ) : (
                <>
                  <Save size={12} className={saving ? "animate-pulse text-zinc-600" : "text-zinc-900"} />
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
            className="min-h-[250px] text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        {showHistory && (
          <div className="w-60 border-l border-slate-200 pl-4 space-y-3 shrink-0 animate-slide-in">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1">
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
                      className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100 transition-all text-[10px]"
                    >
                      <div className="flex justify-between text-slate-900 font-medium">
                        <span>Version {version.version}</span>
                        <span>{new Date(version.createdAt ?? version.updatedAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-500 truncate mt-1">{version.changeSummary || "Auto-saved backup"}</p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">No version backups logged yet.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
