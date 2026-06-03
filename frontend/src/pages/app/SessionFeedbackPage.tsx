import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";
import { submitSessionFeedback } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
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
                (hovered || value) >= star
                  ? "fill-warning text-warning"
                  : "fill-transparent text-[var(--text-muted)]"
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
    mutationFn: () =>
      submitSessionFeedback(sessionId!, { quality, engagement, impact, comment }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white">Thank you for your feedback!</h1>
          <p className="text-[var(--text-secondary)]">
            Your input helps mentors improve future sessions. We appreciate your time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/app/sessions">
              <Button>Back to sessions</Button>
            </Link>
            <Link to="/app/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to="/app/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={14} />
        Back to sessions
      </Link>

      <div>
        <Badge className="mb-3">Session feedback</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          How was the session?
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Rate the session across three dimensions and leave any comments for your mentor.
        </p>
      </div>

      <Card className="space-y-6 p-6">
        <StarRating value={quality} onChange={setQuality} label="Content Quality" />
        <StarRating value={engagement} onChange={setEngagement} label="Engagement" />
        <StarRating value={impact} onChange={setImpact} label="Learning Impact" />

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Comments (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked well? What could be improved?"
            rows={4}
            className="w-full rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
        </div>

        {mutation.isError && (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to submit feedback. Please try again.
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Submitting..." : "Submit feedback"}
        </Button>
      </Card>
    </div>
  );
}
