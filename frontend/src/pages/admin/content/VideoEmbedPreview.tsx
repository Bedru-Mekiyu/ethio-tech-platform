import { useState } from "react";
import { Play, Video, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface VideoEmbedPreviewProps {
  url: string;
  onChange: (val: string) => void;
}

export function VideoEmbedPreview({ url, onChange }: VideoEmbedPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getEmbedUrl = (rawUrl: string): { embedUrl: string | null; platform: string | null } => {
    if (!rawUrl || !rawUrl.trim()) return { embedUrl: null, platform: null };
    const trimmed = rawUrl.trim();

    // YouTube
    const ytMatch =
      trimmed.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i) ||
      trimmed.match(/youtube\.com\/shorts\/([^"&?/\s]{11})/i);
    if (ytMatch) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
        platform: "YouTube",
      };
    }

    // Vimeo
    const vimeoMatch = trimmed.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i,
    );
    if (vimeoMatch && vimeoMatch[3]) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
        platform: "Vimeo",
      };
    }

    // Loom
    const loomMatch = trimmed.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
    if (loomMatch) {
      return {
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
        platform: "Loom",
      };
    }

    // Direct MP4 / Video
    if (/\.(mp4|webm|ogg)$/i.test(trimmed)) {
      return {
        embedUrl: trimmed,
        platform: "HTML5 Video",
      };
    }

    // Generic URL
    if (/^https?:\/\//i.test(trimmed)) {
      return {
        embedUrl: trimmed,
        platform: "Web Video",
      };
    }

    return { embedUrl: null, platform: null };
  };

  const { embedUrl, platform } = getEmbedUrl(url);
  const isValid = Boolean(embedUrl);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <label htmlFor="lesson-video-url" className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Video size={16} className="text-indigo-600" />
          Video Embed / Stream URL
        </label>
        {isValid && platform && (
          <Badge variant="purple" size="sm" className="gap-1">
            <CheckCircle2 size={11} /> {platform} Detected
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id="lesson-video-url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. https://www.youtube.com/watch?v=... or Loom / Vimeo"
          className="flex-1"
        />
        {isValid && (
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Play size={13} className="text-indigo-600" />
            {showPreview ? "Hide Preview" : "Test Embed"}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Supports YouTube, Vimeo, Loom, or direct HTTPS video streams. Automatically converts share links to responsive
        iframe embeds.
      </p>

      {/* Video Preview Player */}
      {showPreview && isValid && embedUrl && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Play size={12} className="text-indigo-400" />
              Live Video Preview ({platform})
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:underline"
            >
              Open original <ExternalLink size={12} />
            </a>
          </div>
          <div className="relative aspect-video w-full">
            {platform === "HTML5 Video" ? (
              <video src={embedUrl} controls className="h-full w-full object-cover" />
            ) : (
              <iframe
                src={embedUrl}
                title="Lesson video stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </div>
        </div>
      )}

      {url && !isValid && (
        <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
          <AlertCircle size={13} />
          Please enter a valid URL starting with https://
        </div>
      )}
    </div>
  );
}
