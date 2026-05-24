import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { submitSessionFeedback } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Card className="p-6 text-center">
        <h1 className="text-xl font-bold">Thank you!</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Your feedback helps mentors improve.</p>
        <Link to="/app/sessions" className="mt-4 inline-block">
          <Button>Back to sessions</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/sessions" className="text-sm text-primary">
        Back
      </Link>
      <h1 className="text-2xl font-bold">Session feedback</h1>
      <Card className="space-y-4 p-6">
        <label className="block text-sm">
          Quality (1-5)
          <Input type="number" min={1} max={5} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </label>
        <label className="block text-sm">
          Engagement (1-5)
          <Input type="number" min={1} max={5} value={engagement} onChange={(e) => setEngagement(Number(e.target.value))} />
        </label>
        <label className="block text-sm">
          Impact (1-5)
          <Input type="number" min={1} max={5} value={impact} onChange={(e) => setImpact(Number(e.target.value))} />
        </label>
        <label className="block text-sm">
          Comment
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional" />
        </label>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Submit feedback
        </Button>
      </Card>
    </div>
  );
}
