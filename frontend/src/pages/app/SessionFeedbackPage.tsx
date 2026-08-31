import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";
import { submitSessionFeedback } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              size={28}
              className={cn(
                "transition-colors",
                (hovered || value) >= star ? "fill-warning text-warning" : "fill-transparent text-[var(--text-muted)]",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-[var(--text-muted)]">{value}/5</span>
      </div>
    </div>
  );
}

export function SessionFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [quality, setQuality] = useState(5);
  const [engagement, setEngagement] = useState(5);
  const [impact, setImpact] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => submitSessionFeedback(sessionId!, { quality, engagement, impact, comment }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-[var(--text-primary)]">
        <Card className="flex flex-col items-center gap-4 p-6 sm:p-8 text-center border-[#27272A] bg-[#0E0E11] rounded-xl shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-white">Thank you for your feedback!</h1>
          <p className="text-xs text-zinc-400 max-w-md">
            Your input directly helps mentors optimize future sessions and peer reviews.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link to="/app/sessions">
              <Button size="sm" className="text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white">
                Back to Sessions
              </Button>
            </Link>
            <Link to="/app/dashboard">
              <Button size="sm" variant="outline" className="text-xs text-zinc-300">
                Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-[var(--text-primary)]">
      <Link to="/app/sessions" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
        <ArrowLeft size={13} />
        Back to sessions
      </Link>

      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-white">Session Review & Feedback</h1>
        <p className="mt-0.5 text-xs text-zinc-400">
          Rate the session across three dimensions and leave comments for your mentor.
        </p>
      </Card>

      <Card className="space-y-5 p-5 sm:p-6 border-[#27272A] bg-[#0E0E11] rounded-xl shadow-sm">
        <StarRating value={quality} onChange={setQuality} label="Content Quality" />
        <StarRating value={engagement} onChange={setEngagement} label="Engagement" />
        <StarRating value={impact} onChange={setImpact} label="Learning Impact" />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Comments (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked well? What could be improved?"
            rows={4}
            className="w-full rounded-lg border border-[#27272A] bg-[#141418] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
          />
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            Failed to submit feedback. Please try again.
          </div>
        )}

        <Button
          size="sm"
          className="w-full text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </Card>
    </div>
  );
}
