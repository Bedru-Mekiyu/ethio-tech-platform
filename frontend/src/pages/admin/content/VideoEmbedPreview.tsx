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
      trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i) ||
      trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/i);
    if (ytMatch) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
        platform: "YouTube",
      };
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
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
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <label htmlFor="lesson-video-url" className="flex items-center gap-2 text-sm font-medium text-white">
          <Video size={16} className="text-purple-400" />
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Play size={13} className="text-primary" />
            {showPreview ? "Hide Preview" : "Test Embed"}
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Supports YouTube, Vimeo, Loom, or direct HTTPS video streams. Automatically converts share links to responsive iframe embeds.
      </p>

      {/* Video Preview Player */}
      {showPreview && isValid && embedUrl && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Play size={12} className="text-purple-400" />
              Live Video Preview ({platform})
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              Open original <ExternalLink size={12} />
            </a>
          </div>
          <div className="relative aspect-video w-full">
            {platform === "HTML5 Video" ? (
              <video
                src={embedUrl}
                controls
                className="h-full w-full object-cover"
              />
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
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle size={13} />
          Please enter a valid URL starting with https://
        </div>
      )}
    </div>
  );
}
