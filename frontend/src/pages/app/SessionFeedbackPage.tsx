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
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <div className="flex gap-1 items-center" role="radiogroup" aria-label={label}>
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
                (hovered || value) >= star ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-200",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-600 font-medium">{value}/5</span>
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
      <div className="mx-auto max-w-lg space-y-6 py-8 text-slate-900">
        <Card className="flex flex-col items-center gap-4 p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 text-center rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100/80">
            <CheckCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Feedback Submitted</h1>
          <p className="text-xs text-slate-600 font-medium max-w-md">
            Your feedback helps mentors refine future classroom sessions and technical reviews.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link to="/app/sessions">
              <Button size="sm" variant="primary" className="text-xs font-medium">
                View Sessions
              </Button>
            </Link>
            <Link to="/app/dashboard">
              <Button size="sm" variant="outline" className="text-xs text-slate-700">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-slate-900">
      <Link
        to="/app/sessions"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
      >
        <ArrowLeft size={13} />
        All Sessions
      </Link>

      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Session Review & Feedback</h1>
        <p className="mt-0.5 text-xs text-slate-600 font-medium">
          Rate the session across three dimensions and leave comments for your mentor.
        </p>
      </Card>

      <Card className="space-y-5 p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <StarRating value={quality} onChange={setQuality} label="Content Quality" />
        <StarRating value={engagement} onChange={setEngagement} label="Engagement" />
        <StarRating value={impact} onChange={setImpact} label="Learning Impact" />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Comments (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked well? What could be improved?"
            rows={4}
            className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/5 resize-none"
          />
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            Failed to submit feedback. Please try again.
          </div>
        )}

        <Button
          size="sm"
          variant="primary"
          className="w-full text-xs font-medium"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </Card>
    </div>
  );
}
