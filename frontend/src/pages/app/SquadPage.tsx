import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { upsertChatMessage, type RealtimeChatMessage } from "@/lib/realtime";

const participantLabel = (userId: string, currentUserId?: string) => {
  if (userId === currentUserId) return "You";
  return `Member ${userId.slice(-4).toUpperCase()}`;
};

export function SquadPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = `squad-${id ?? "demo"}`;
  const user = useAuthStore((s) => s.user);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([
    {
      id: "welcome",
      messageId: "welcome",
      roomId,
      text: "Welcome to the dev squad room. Share progress and ask for reviews.",
      author: "System",
      at: new Date().toISOString(),
      system: true,
      status: "delivered",
    },
  ]);

  const { connectionStatus, presenceCount, connectionQuality, pendingCount, isOnline, roomState, sendMessage } =
    useRealtimeRoom({
      roomId,
      userId: user?.id,
      onMessage: (message) => {
        setMessages((prev) => upsertChatMessage(prev, message));
      },
    });

  const roster = useMemo(
    () => (roomState?.connectedUserIds ?? []).map((participantId) => participantLabel(participantId, user?.id)),
    [roomState?.connectedUserIds, user?.id]
  );

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { author: user?.fullName ?? "You", userId: user?.id });
    setDraft("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={24} />
          <div>
            <h1 className="text-2xl font-bold">Dev Collaboration</h1>
            <p className="text-sm text-[var(--text-secondary)]">Squad room · Real-time chat via Socket.io</p>
          </div>
        </div>

        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">Live squad</Badge>
            <Badge variant={isOnline ? "success" : "default"}>{isOnline ? "Online sync" : "Offline queue"}</Badge>
            <Badge variant="default">{connectionQuality} link</Badge>
          </div>
          <h2 className="mt-4 font-semibold">Squad workspace</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Pair on projects, share snippets, and coordinate before mentor reviews. Messages sync live for everyone
            in this squad, even when the connection drops briefly.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["Shared repo", "Whiteboard", "Code review"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex h-[560px] flex-col">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="font-semibold">Squad chat</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {presenceCount} online · {pendingCount} queued
            </p>
          </div>
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
            {connectionStatus === "connected" ? "Live" : "Recovering"}
          </span>
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Team pulse</p>
            <p className="mt-2 text-2xl font-bold text-white">{roomState?.messageCount ?? messages.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Messages tracked in this squad.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Roster</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(roster.length ? roster : ["Arriving..."]).map((name) => (
                <Badge key={name} variant="purple">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar name={msg.author ?? "Member"} size="sm" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">
                  {msg.author} · {new Date(msg.at).toLocaleTimeString()}
                </p>
                <p className="mt-0.5 text-sm">
                  {msg.text}
                  {msg.status === "pending" ? <span className="ml-2 text-xs text-[var(--text-muted)]">(queued)</span> : null}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder={isOnline ? "Message your squad…" : "Type now; we'll send it when you reconnect…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendDraft()}
          />
          <Button type="button" onClick={sendDraft} aria-label="Send message">
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
