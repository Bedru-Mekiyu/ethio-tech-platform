import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Plus, Eye, Download, FileText, Globe, Video, Github } from "lucide-react";
import { getResources, createResource } from "@/services/mentorControlService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/composites/ToastProvider";

interface ResourcesPanelProps {
  sessionId: string;
}

export default function ResourcesPanel({ sessionId }: ResourcesPanelProps) {
  const [resources, setResources] = useState<
    Array<{ _id: string; title: string; url: string; description?: string; type: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("pdf");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const loadResources = async () => {
    try {
      setLoading(true);
      const resList = await getResources(sessionId);
      setResources(resList || []);
    } catch (err) {
      console.error("Load resources failed", err);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadResources();
  }, [sessionId]);

  const handleCreate = async () => {
    if (!title.trim() || !url.trim()) return;
    setIsSubmitting(true);
    try {
      await createResource(sessionId, { title, description, url, type });
      setTitle("");
      setDescription("");
      setUrl("");
      setType("pdf");
      setShowCreate(false);
      loadResources();
    } catch (err) {
      console.error("Create resource failed", err);
      toast.error("Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResourceIcon = (resType: string) => {
    switch (resType) {
      case "pdf":
      case "doc":
        return <FileText size={16} className="text-red-400" />;
      case "video":
        return <Video size={16} className="text-violet-400" />;
      case "github":
        return <Github size={16} className="text-white" />;
      case "slide":
        return <Globe size={16} className="text-yellow-400" />;
      default:
        return <Globe size={16} className="text-primary" />;
    }
  };

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary p-1.5 rounded-lg border border-primary/20">
            <Link2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Shared Class Resources</h3>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={12} className="mr-1" /> Share Resource
        </Button>
        <dialog
          ref={createDialogRef}
          className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-0 text-white shadow-xl backdrop:bg-black/60"
          onCancel={(e) => {
            e.preventDefault();
            setShowCreate(false);
          }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white">Share Resource</h2>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lecture Slides - Week 1"
                  className="bg-white/5 border-white/5 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short notes about slides..."
                  className="bg-white/5 border-white/5 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Link / URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/5 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Resource Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <SelectTrigger className="bg-white/5 border-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0F19] border-white/10 text-white">
                    <SelectItem value="pdf">PDF File</SelectItem>
                    <SelectItem value="slide">Slides</SelectItem>
                    <SelectItem value="doc">Document</SelectItem>
                    <SelectItem value="video">Video Link</SelectItem>
                    <SelectItem value="github">GitHub Repo</SelectItem>
                    <SelectItem value="link">Other Web Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-white"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/95 text-white"
                  onClick={handleCreate}
                  disabled={!title.trim() || !url.trim() || isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Publish Resource"}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 rounded-xl w-full" />
          <Skeleton className="h-14 rounded-xl w-full" />
        </div>
      ) : resources.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No resources shared yet</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {resources.map(
            (res: {
              _id: string;
              title: string;
              url: string;
              description?: string;
              type: string;
              createdAt: string;
              viewCount?: number;
              downloadCount?: number;
            }) => (
              <div
                key={res._id}
                className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-white/5 p-2 rounded-lg shrink-0">{getResourceIcon(res.type)}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{res.title}</p>
                    {res.description && (
                      <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{res.description}</p>
                    )}
                    <p className="text-[9px] text-primary/80 mt-1 truncate hover:underline">
                      <a href={res.url} target="_blank" rel="noopener noreferrer">
                        {res.url}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-0.5">
                      <Eye size={11} /> {res.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Download size={11} /> {res.downloadCount || 0}
                    </span>
                  </div>
                  <Badge
                    variant="default"
                    className="text-[9px] border-white/10 uppercase font-bold text-white bg-white/5"
                  >
                    {res.type}
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
