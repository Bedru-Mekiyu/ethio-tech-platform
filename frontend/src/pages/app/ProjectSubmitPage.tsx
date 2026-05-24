import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/services/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  difficulty: z.string(),
  location: z.string(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProjectSubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema as never) as Resolver<FormData>,
    defaultValues: {
      difficulty: "intermediate",
      location: "Addis Ababa, Ethiopia",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/submissions", {
        title: data.title,
        description: data.description,
        githubUrl: data.githubUrl,
        mentorNotes: data.notes,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <p className="text-sm text-[var(--text-muted)]">Submit your project and unlock XP</p>
        <h1 className="text-2xl font-bold">Project details</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Make your entry as clear as possible to maximize XP rewards.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <Label>Project title</Label>
            <Input placeholder="E.g. Weather App with React & Tailwind" {...register("title")} />
          </div>
          <div>
            <Label>Project description</Label>
            <Textarea placeholder="Describe your project..." {...register("description")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Difficulty</Label>
              <select
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-sm"
                {...register("difficulty")}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <Label>Location</Label>
              <Input {...register("location")} />
            </div>
          </div>
          <div>
            <Label>GitHub repository</Label>
            <Input placeholder="https://github.com/username/project" {...register("githubUrl")} />
          </div>
          <div>
            <Label>Notes to mentor</Label>
            <Textarea placeholder="Focus areas for review..." {...register("notes")} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4">
            <div>
              <p className="text-sm">Status: {submitted ? "Submitted" : "Draft"}</p>
              <p className="text-xs text-[var(--text-muted)]">Base 100 + 50 details + 50 docs XP</p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <Send size={16} /> Submit project
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project XP & progress</CardTitle>
          </CardHeader>
          <p className="text-sm">Module 2 of 5</p>
          <ProgressBar value={40} className="mt-2" />
          <p className="mt-4 text-sm text-primary">+200 – 400 XP after submission</p>
        </Card>
        <Card>
          <CardTitle>Submission timeline</CardTitle>
          <ol className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
            <li>1. Submit — mentor notified</li>
            <li>2. Feedback & XP</li>
            <li>3. Next project unlocks badges</li>
          </ol>
        </Card>
        <Card>
          <CardTitle>Recent mentor feedback</CardTitle>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Web API (+150 XP): Great clean architecture.
          </p>
        </Card>
      </div>
    </div>
  );
}
