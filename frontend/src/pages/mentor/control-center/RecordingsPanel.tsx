import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Plus, Eye, Play, CheckCircle } from "lucide-react";
import { getRecordings, uploadSessionRecording, publishRecording } from "@/services/mentorControlService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/composites/ToastProvider";

interface RecordingsPanelProps {
  sessionId: string;
}

export default function RecordingsPanel({ sessionId }: RecordingsPanelProps) {
  const [recordings, setRecordings] = useState<
    Array<{ _id: string; title: string; url: string; description?: string; isPublished: boolean; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  useEffect(() => {
    const dialog = createDialogRef.current;
    if (!dialog) return;
    if (showCreate && !dialog.open) {
      dialog.showModal();
    } else if (!showCreate && dialog.open) {
      dialog.close();
    }
  }, [showCreate]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const recList = await getRecordings(sessionId);
      setRecordings(recList || []);
    } catch (err) {
      console.error("Load recordings failed", err);
      toast.error("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadRecordings();
  }, [sessionId]);

  const handleCreate = async () => {
    if (!title.trim() || !url.trim()) return;
    setIsSubmitting(true);
    try {
      await uploadSessionRecording(sessionId, {
        title,
        description,
        url,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      });
      setTitle("");
      setDescription("");
      setUrl("");
      setDurationMinutes("");
      setShowCreate(false);
      loadRecordings();
    } catch (err) {
      console.error("Upload recording failed", err);
      toast.error("Failed to upload recording");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (recordingId: string) => {
    setIsToggling(recordingId);
    try {
      await publishRecording(sessionId, recordingId);
      loadRecordings();
    } catch (err) {
      console.error("Publish recording failed", err);
      toast.error("Failed to publish recording");
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <Card className="border-zinc-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 text-zinc-900 border border-zinc-200 p-1.5 rounded-lg">
            <Video size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Session Playback Recordings</h3>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={12} className="mr-1" /> Add Recording
        </Button>
        <dialog
          ref={createDialogRef}
          className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-900/40"
          onCancel={(e) => {
            e.preventDefault();
            setShowCreate(false);
          }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Add Session Recording</h2>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lesson 1 - Introduction to Node.js"
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary..."
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Recording URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Duration (Minutes)</label>
                <Input
                  value={durationMinutes}
                  type="number"
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="45"
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  onClick={handleCreate}
                  disabled={!title.trim() || !url.trim() || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Recording"}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-zinc-400">No recordings uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {recordings.map(
            (rec: {
              _id: string;
              title: string;
              url: string;
              description?: string;
              isPublished: boolean;
              createdAt: string;
              durationMinutes?: number;
              totalViews?: number;
              completionCount?: number;
            }) => (
              <div
                key={rec._id}
                className="rounded-xl border border-zinc-200/80 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-zinc-50 transition-all shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="bg-zinc-100 p-3 border border-zinc-200 rounded-xl shrink-0 flex items-center justify-center text-zinc-900">
                    <Play size={18} className="fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{rec.title}</p>
                    {rec.description && <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{rec.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-zinc-500">
                      {rec.durationMinutes && <span>{rec.durationMinutes} minutes</span>}
                      <span className="flex items-center gap-0.5">
                        <Eye size={10} /> Views: {rec.totalViews || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <CheckCircle size={10} /> Completed: {rec.completionCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant={rec.isPublished ? "primary" : "outline"}
                    className="h-7 text-[10px] px-2"
                    onClick={() => handleTogglePublish(rec._id)}
                    disabled={isToggling === rec._id}
                  >
                    {rec.isPublished ? "Published" : "Publish"}
                  </Button>
                  <Badge variant="default" className="text-[9px] border-zinc-200 uppercase bg-zinc-100 text-zinc-700">
                    mp4
                  </Badge>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
}
