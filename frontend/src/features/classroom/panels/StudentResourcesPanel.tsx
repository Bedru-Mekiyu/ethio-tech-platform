import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/composites/EmptyState";
import { Download, Link2, FileText, Video, ImageIcon, FileArchive } from "lucide-react";
import { api } from "@/services/api";

interface Resource {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  type?: string;
  fileType?: string;
  size?: string;
  url: string;
}

interface StudentResourcesPanelProps {
  resources: Resource[];
  sessionId: string;
}

const getResourceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "pdf":
    case "document":
      return <FileText size={16} />;
    case "video":
      return <Video size={16} />;
    case "image":
      return <ImageIcon size={16} />;
    case "archive":
    case "zip":
      return <FileArchive size={16} />;
    default:
      return <Link2 size={16} />;
  }
};

export function StudentResourcesPanel({ resources, sessionId }: StudentResourcesPanelProps) {
  const handleDownload = async (resourceId: string, url: string) => {
    try {
      // Record download if API exists
      await api.post(`/sessions/${sessionId}/resources/${resourceId}/download`);
    } catch (error) {
      console.error("Failed to record resource download", error);
    }
    // Proceed to open resource
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 overflow-y-auto space-y-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div
              key={resource._id || resource.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  {getResourceIcon(resource.type ?? resource.fileType ?? "link")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{resource.title || resource.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {resource.type || resource.fileType} • {resource.size || "External Link"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => handleDownload(resource._id ?? resource.id ?? "", resource.url)}
              >
                <Download size={16} className="mr-2 text-indigo-600" />
                {resource.url?.startsWith("http") ? "Open" : "Download"}
              </Button>
            </div>
          ))
        ) : (
          <div className="mt-8">
            <EmptyState
              title="No resources shared"
              description="Any files or links shared by the mentor will appear here."
            />
          </div>
        )}
      </div>
    </div>
  );
}
