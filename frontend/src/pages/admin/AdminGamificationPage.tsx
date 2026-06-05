import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useToast } from "@/components/composites/ToastProvider";
import { Award, Flame, Plus, Sparkles, Trophy } from "lucide-react";

interface BadgeItem {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  xpRequired?: number;
  xpBonus?: number;
  category?: string;
}

interface DailyChallenge {
  _id: string;
  title: string;
  description?: string;
  xpReward?: number;
  activeDate?: string;
  isActive?: boolean;
}

export function AdminGamificationPage() {
  usePageTitle("Gamification Management");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"badges" | "challenges">("badges");
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeXp, setNewBadgeXp] = useState("");
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeXp, setNewChallengeXp] = useState("25");

  const badgesQuery = useQuery({
    queryKey: ["admin", "badges"],
    queryFn: async () => {
      const { data } = await api.get("/badges");
      return (data.data?.badges ?? data.badges ?? []) as BadgeItem[];
    },
  });

  const challengesQuery = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: async () => {
      const { data } = await api.get("/gamification/daily-challenge");
      const raw = data.data?.challenge ?? data.challenge;
      return raw ? [raw] : [];
    },
  });

  const createBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!newBadgeName.trim()) throw new Error("Name is required");
      const { data } = await api.post("/badges", {
        name: newBadgeName.trim(),
        xpRequired: parseInt(newBadgeXp) || 0,
        category: "achievement",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "badges"] });
      toast.success("Badge created");
      setNewBadgeName("");
      setNewBadgeXp("");
    },
    onError: () => toast.error("Failed to create badge"),
  });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      if (!newChallengeTitle.trim()) throw new Error("Title is required");
      const { data } = await api.post("/gamification/daily-challenge", {
        title: newChallengeTitle.trim(),
        xpReward: parseInt(newChallengeXp) || 25,
        activeDate: new Date().toISOString(),
        isActive: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
      toast.success("Daily challenge created");
      setNewChallengeTitle("");
      setNewChallengeXp("25");
    },
    onError: () => toast.error("Failed to create challenge"),
  });

  const badges = badgesQuery.data ?? [];
  const challenges = (challengesQuery.data ?? []) as DailyChallenge[];

  const STREAK_MILESTONES = [
    { days: 7, xp: 50, label: "7-day streak" },
    { days: 14, xp: 120, label: "14-day streak" },
    { days: 30, xp: 300, label: "30-day streak" },
    { days: 60, xp: 750, label: "60-day streak" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <h1 className="text-3xl font-bold tracking-tight">Engagement Systems</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Manage badges, daily challenges, and streak milestones that keep learners motivated and progressing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={tab === "badges" ? "primary" : "outline"} onClick={() => setTab("badges")}>
          <Award size={16} className="mr-1.5" /> Badges
        </Button>
        <Button variant={tab === "challenges" ? "primary" : "outline"} onClick={() => setTab("challenges")}>
          <Flame size={16} className="mr-1.5" /> Daily Challenges
        </Button>
      </div>

      {/* Badges Tab */}
      {tab === "badges" && (
        <>
          {/* Create Badge */}
          <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-semibold text-white">Create a Badge</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Badges are automatically awarded when a learner reaches the XP threshold.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Badge name"
                value={newBadgeName}
                onChange={(e) => setNewBadgeName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="XP required"
                type="number"
                value={newBadgeXp}
                onChange={(e) => setNewBadgeXp(e.target.value)}
                className="w-32"
              />
              <Button
                onClick={() => createBadgeMutation.mutate()}
                disabled={createBadgeMutation.isPending || !newBadgeName.trim()}
              >
                <Plus size={16} className="mr-1" />
                {createBadgeMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </Card>

          {/* Badge List */}
          <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <CardHeader className="mb-4 p-0">
              <CardTitle>All Badges ({badges.length})</CardTitle>
            </CardHeader>

            {badgesQuery.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            )}

            {badgesQuery.isError && <QueryError onRetry={() => badgesQuery.refetch()} />}

            {!badgesQuery.isLoading && badges.length === 0 && (
              <EmptyState
                title="No badges created"
                description="Create your first badge to start rewarding learners."
              />
            )}

            <div className="space-y-3">
              {badges.map((badge) => (
                <div
                  key={badge._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{badge.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {badge.category && <Badge variant="purple">{badge.category}</Badge>}
                        {badge.description && <span>{badge.description}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{badge.xpRequired ?? 0} XP</p>
                    {badge.xpBonus ? <p className="text-xs text-success">+{badge.xpBonus} bonus</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Daily Challenges Tab */}
      {tab === "challenges" && (
        <>
          {/* Create Challenge */}
          <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-semibold text-white">Create a Daily Challenge</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Daily challenges appear on every student&apos;s dashboard and grant XP on completion.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Challenge title"
                value={newChallengeTitle}
                onChange={(e) => setNewChallengeTitle(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="XP reward"
                type="number"
                value={newChallengeXp}
                onChange={(e) => setNewChallengeXp(e.target.value)}
                className="w-32"
              />
              <Button
                onClick={() => createChallengeMutation.mutate()}
                disabled={createChallengeMutation.isPending || !newChallengeTitle.trim()}
              >
                <Plus size={16} className="mr-1" />
                {createChallengeMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </Card>

          {/* Active Challenge */}
          <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <CardHeader className="mb-4 p-0">
              <CardTitle>Active Challenge</CardTitle>
            </CardHeader>

            {challengesQuery.isLoading && <Skeleton className="h-20 rounded-2xl" />}

            {!challengesQuery.isLoading && challenges.length === 0 && (
              <EmptyState
                title="No active challenge"
                description="Create a challenge above to engage learners today."
              />
            )}

            {challenges.map((ch) => (
              <div
                key={ch._id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-success/20 bg-success/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{ch.title}</p>
                    {ch.description && <p className="text-sm text-[var(--text-secondary)]">{ch.description}</p>}
                  </div>
                </div>
                <Badge variant="success">+{ch.xpReward ?? 25} XP</Badge>
              </div>
            ))}
          </Card>

          {/* Streak Milestones Reference */}
          <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <CardHeader className="mb-4 p-0">
              <div>
                <CardTitle>Streak Milestone Rewards</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  These rewards are automatically granted when learners hit streak milestones.
                </p>
              </div>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STREAK_MILESTONES.map((m) => (
                <div key={m.days} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                    <Flame size={18} />
                  </div>
                  <p className="text-lg font-semibold text-white">{m.days} days</p>
                  <p className="text-sm text-success">+{m.xp} XP</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{m.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
