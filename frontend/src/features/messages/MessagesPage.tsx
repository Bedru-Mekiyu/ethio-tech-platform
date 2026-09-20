import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { acquireSocketConnection } from "@/services/socket";
import { useDM, type Conversation, type DMMessage } from "@/hooks/useDM";

const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}> = ({ conversation, isActive, onClick }) => {
  const otherParticipant = conversation.participants[0];

  return (
    <button
      className={`w-full text-left p-3.5 transition-colors border-b border-slate-100 ${
        isActive ? "bg-white border-l-4 border-l-[#b91c1c] shadow-sm" : "hover:bg-slate-100/60"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={otherParticipant?.avatar}
          name={otherParticipant?.fullName || "?"}
          className="h-9 w-9 border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm truncate text-slate-900">
              {conversation.type === "group"
                ? conversation.name || "Group Chat"
                : otherParticipant?.fullName || "Unknown"}
            </span>
            {conversation.lastMessageAt && (
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {conversation.lastMessagePreview && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{conversation.lastMessagePreview}</p>
          )}
        </div>
      </div>
    </button>
  );
};

const MessageBubble: React.FC<{ message: DMMessage; isOwn: boolean }> = ({ message, isOwn }) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2.5`}>
    <div
      className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
        isOwn
          ? "bg-zinc-900 text-white rounded-tr-sm"
          : "bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-sm"
      }`}
    >
      {!isOwn && <div className="text-xs font-semibold mb-1 text-slate-700">{message.senderId.fullName}</div>}
      <p className="text-sm leading-relaxed">{message.text}</p>
      <div className={`text-[10px] mt-1 text-right ${isOwn ? "text-zinc-300" : "text-slate-400"}`}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  </div>
);

export const MessagesPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socket = acquireSocketConnection() as any;

  const {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    messagesEndRef,
    sendMessage,
    selectConversation,
    typingUsers,
    emitTypingStart,
  } = useDM({ socket });

  const [inputText, setInputText] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setMobileShowThread(true);
  };

  const handleBack = () => {
    setMobileShowThread(false);
  };

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Sidebar: Conversations — hidden on mobile when thread is open */}
      <div
        className={`${mobileShowThread ? "hidden" : "flex"} md:flex w-full md:w-80 border-r border-slate-200 bg-slate-50/50 flex-col`}
      >
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-base text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-sm text-slate-500">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={conv._id === activeConversationId}
                onClick={() => handleSelectConversation(conv._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main: Message Thread — full width on mobile when thread is open */}
      <div className={`${mobileShowThread ? "flex" : "hidden"} md:flex flex-1 flex-col bg-white`}>
        {activeConversationId ? (
          <>
            <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-white">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden mr-1 text-slate-600"
                onClick={handleBack}
                aria-label="Back to conversations"
              >
                ←
              </Button>
              <Avatar
                src={activeConversation?.participants[0]?.avatar}
                name={activeConversation?.participants[0]?.fullName || "?"}
                className="h-9 w-9 border border-slate-200"
              />
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  {activeConversation?.type === "group"
                    ? activeConversation?.name || "Group Chat"
                    : activeConversation?.participants[0]?.fullName || "Unknown"}
                </div>
                <div className="text-xs text-slate-500">{activeConversation?.participants.length} participants</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
              {loadingMessages ? (
                <div className="text-sm text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-slate-500 text-center mt-8">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg._id} message={msg} isOwn={msg.senderId._id === currentUserId} />
                ))
              )}
              {typingUsers[activeConversationId || ""]?.length > 0 && (
                <div className="px-4 py-2 text-xs text-slate-400 italic">
                  {typingUsers[activeConversationId!].map((t) => t.userName).join(", ")}
                  {typingUsers[activeConversationId!].length === 1 ? "is" : "are"} typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    emitTypingStart();
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="flex-1 bg-white border-slate-200 text-slate-900 text-sm"
                />
                <Button variant="primary" onClick={handleSend} disabled={!inputText.trim() || sending}>
                  {sending ? "..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm bg-slate-50/20">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
