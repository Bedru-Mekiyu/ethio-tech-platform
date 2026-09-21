import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
        return <Video size={16} className="text-zinc-700" />;
      case "github":
        return <Github size={16} className="text-zinc-900" />;
      case "slide":
        return <Globe size={16} className="text-yellow-400" />;
      default:
        return <Globe size={16} className="text-zinc-700" />;
    }
  };

  return (
    <Card className="border-zinc-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 text-zinc-900 border border-zinc-200 p-1.5 rounded-lg">
            <Link2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Shared Class Resources</h3>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={12} className="mr-1" /> Share Resource
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
            <h2 className="text-lg font-semibold text-zinc-900">Share Resource</h2>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lecture Slides - Week 1"
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short notes about slides..."
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Link / URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white border-zinc-200 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Resource Type</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={[
                    { value: "pdf", label: "PDF File" },
                    { value: "slide", label: "Slides" },
                    { value: "doc", label: "Document" },
                    { value: "video", label: "Video Link" },
                    { value: "github", label: "GitHub Repo" },
                    { value: "link", label: "Other Web Link" },
                  ]}
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
          <p className="text-xs text-zinc-400">No resources shared yet</p>
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
                className="rounded-xl border border-zinc-200/80 bg-white p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-zinc-50 border border-zinc-100 p-2 rounded-lg shrink-0">
                    {getResourceIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{res.title}</p>
                    {res.description && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{res.description}</p>}
                    <p className="text-[9px] text-[#b91c1c] mt-1 truncate hover:underline">
                      <a href={res.url} target="_blank" rel="noopener noreferrer">
                        {res.url}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <Eye size={11} /> {res.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Download size={11} /> {res.downloadCount || 0}
                    </span>
                  </div>
                  <Badge
                    variant="default"
                    className="text-[9px] border-zinc-200 uppercase font-bold text-zinc-700 bg-zinc-100"
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
