import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, Plus, Eye, Play, Square, Users, CheckCircle } from "lucide-react";
import { getRecordings, uploadSessionRecording, publishRecording } from "@/services/mentorControlService";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordingsPanelProps {
  sessionId: string;
}

export default function RecordingsPanel({ sessionId }: RecordingsPanelProps) {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const recList = await getRecordings(sessionId);
      setRecordings(recList || []);
    } catch (err) {
      console.error("Load recordings failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [sessionId]);

  const handleCreate = async () => {
    if (!title.trim() || !url.trim()) return;
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
    }
  };

  const handleTogglePublish = async (recordingId: string) => {
    try {
      await publishRecording(sessionId, recordingId);
      loadRecordings();
    } catch (err) {
      console.error("Publish recording failed", err);
    }
  };

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg border border-purple-500/20">
            <Video size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Session Playback Recordings</h3>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg">
              <Plus size={12} className="mr-1" /> Add Recording
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#0B0F19] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Add Session Recording</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson 1 - Introduction to Node.js" className="bg-white/5 border-white/5 text-white" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Description (Optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary..." className="bg-white/5 border-white/5 text-white" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Recording URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="bg-white/5 border-white/5 text-white" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Duration (Minutes)</label>
                <Input value={durationMinutes} type="number" onChange={(e) => setDurationMinutes(e.target.value)} placeholder="45" className="bg-white/5 border-white/5 text-white" />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/95 text-white" onClick={handleCreate} disabled={!title.trim() || !url.trim()}>
                Save Recording
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No recordings uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {recordings.map((rec) => (
            <div key={rec._id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.03] transition-all">
              <div className="flex items-start gap-3 min-w-0">
                <div className="bg-[#0B0F19] p-3 border border-white/5 rounded-xl shrink-0 flex items-center justify-center text-primary">
                  <Play size={18} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{rec.title}</p>
                  {rec.description && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">{rec.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-[var(--text-muted)]">
                    {rec.durationMinutes && <span>{rec.durationMinutes} minutes</span>}
                    <span className="flex items-center gap-0.5"><Eye size={10} /> Views: {rec.totalViews || 0}</span>
                    <span className="flex items-center gap-0.5"><CheckCircle size={10} /> Completed: {rec.completionCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant={rec.isPublished ? "success" : "outline"}
                  className="h-7 text-[10px] px-2 text-white"
                  onClick={() => handleTogglePublish(rec._id)}
                >
                  {rec.isPublished ? "Published" : "Make Private"}
                </Button>
                <Badge variant="outline" className="text-[9px] border-white/10 uppercase bg-white/5 text-white">
                  mp4
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
