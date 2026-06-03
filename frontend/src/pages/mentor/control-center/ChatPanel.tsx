import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Send, Trash2, AlertCircle
} from "lucide-react";
import { getSocket } from "@/services/socket";
import { deleteMessage } from "@/services/mentorControlService";
import type { ChatMessageServerPayload } from "@/socket/contracts";
import { useAuthStore } from "@/store/authStore";

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageServerPayload[]>([]);
  const [inputText, setInputText] = useState("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [chatType, setChatType] = useState<"public" | "announcement" | "direct" | "private_question" | "system">("public");
  const [activeSubTab, setActiveSubTab] = useState<string>("public");
  
  const user = useAuthStore((s) => s.user);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg: ChatMessageServerPayload) => {
      if (msg.roomId === `session-${sessionId}` || msg.roomId === sessionId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleDeletedMessage = (payload: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.messageId !== payload.messageId));
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:message:deleted", handleDeletedMessage);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:message:deleted", handleDeletedMessage);
    };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const socket = getSocket();
    if (!socket) return;

    const payload = {
      roomId: `session-${sessionId}`,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientId: crypto.randomUUID(),
      text: inputText,
      at: new Date().toISOString(),
      type: chatType,
      recipientId: chatType === "direct" ? recipientId : undefined,
    };

    socket.emit("chat:message", payload, (ack: { ok: boolean }) => {
      if (ack.ok) {
        setInputText("");
      }
    });
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(sessionId, messageId, "Moderator action");
      // Local filter just in case
      setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      
      // Emit socket event to notify other clients
      getSocket()?.emit("participant:control", {
        roomId: `session-${sessionId}`,
        targetUserId: "",
        action: "message_deleted",
        reason: messageId
      });
    } catch (err) {
      console.error("Delete message failed", err);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeSubTab === "public") return m.type === "public" || !m.type;
    if (activeSubTab === "announcements") return m.type === "announcement" || m.announcement;
    if (activeSubTab === "dms") return m.type === "direct";
    if (activeSubTab === "questions") return m.type === "private_question";
    if (activeSubTab === "system") return m.type === "system" || m.system;
    return true;
  });

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-[550px] animate-slide-in">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="bg-primary/15 text-primary p-1.5 rounded-lg">
          <MessageSquare size={16} />
        </div>
        <h3 className="text-sm font-semibold text-white">Live Moderated Chat</h3>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mcc-tabs-list w-full shrink-0 flex overflow-x-auto">
          <TabsTrigger value="public" className="mcc-tabs-trigger flex-1 text-[11px] py-1.5">Public</TabsTrigger>
          <TabsTrigger value="announcements" className="mcc-tabs-trigger flex-1 text-[11px] py-1.5">Announcements</TabsTrigger>
          <TabsTrigger value="dms" className="mcc-tabs-trigger flex-1 text-[11px] py-1.5">DMs</TabsTrigger>
          <TabsTrigger value="questions" className="mcc-tabs-trigger flex-1 text-[11px] py-1.5">Questions</TabsTrigger>
          <TabsTrigger value="system" className="mcc-tabs-trigger flex-1 text-[11px] py-1.5">System</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mcc-scrollbar my-3 space-y-3 pr-1">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-xs text-[var(--text-muted)]">No messages in this tab</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOwn = msg.userId === user?.id;
              const isSystem = msg.system || msg.type === "system";

              if (isSystem) {
                return (
                  <div key={msg.messageId} className="flex items-center gap-2 justify-center py-1">
                    <span className="text-[10px] text-[var(--text-secondary)] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle size={10} className="text-indigo-400" />
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.messageId} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      {msg.author || "Participant"}
                      {msg.announcement && <Badge variant="warning" className="text-[8px] px-1 ml-1">Ann</Badge>}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-[var(--text-muted)]">
                        {msg.at ? new Date(msg.at).toLocaleTimeString() : ""}
                      </span>
                      {!isOwn && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-danger hover:bg-danger/10 rounded-md"
                          onClick={() => handleDelete(msg.messageId)}
                          title="Delete message"
                        >
                          <Trash2 size={11} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-[#E5E7EB] break-all">
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input box */}
        <div className="shrink-0 flex gap-2 pt-2 border-t border-white/5">
          <select
            value={chatType}
            onChange={(e) => setChatType(e.target.value as any)}
            className="h-9 rounded-xl border border-white/10 bg-[#0B0F19] px-2 text-xs text-white outline-none shrink-0"
          >
            <option value="public">Public</option>
            <option value="announcement">Announce</option>
            <option value="direct">Direct Msg</option>
            <option value="private_question">Question</option>
          </select>

          {chatType === "direct" && (
            <Input
              placeholder="Recipient User ID..."
              className="h-9 text-xs w-28 bg-white/5 border-white/5 text-white"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            />
          )}

          <Input
            placeholder={
              chatType === "announcement"
                ? "Send announcement to class..."
                : chatType === "direct"
                ? "Send direct message..."
                : "Type chat message..."
            }
            className="mcc-chat-input h-9 text-xs flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={handleSendMessage}>
            <Send size={14} />
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}
