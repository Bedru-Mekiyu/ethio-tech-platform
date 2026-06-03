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
      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
        isActive ? "bg-muted" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={otherParticipant?.avatar}
          name={otherParticipant?.fullName || "?"}
          className="h-8 w-8"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm truncate">
              {conversation.type === "group"
                ? conversation.name || "Group Chat"
                : otherParticipant?.fullName || "Unknown"}
            </span>
            {conversation.lastMessageAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {conversation.lastMessagePreview && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {conversation.lastMessagePreview}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const MessageBubble: React.FC<{ message: DMMessage; isOwn: boolean }> = ({
  message,
  isOwn,
}) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
    <div
      className={`max-w-[70%] rounded-lg px-3 py-2 ${
        isOwn
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      }`}
    >
      {!isOwn && (
        <div className="text-xs font-medium mb-1">
          {message.senderId.fullName}
        </div>
      )}
      <p className="text-sm">{message.text}</p>
      <div className="text-[10px] opacity-70 mt-1 text-right">
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

  const activeConversation = conversations.find(c => c._id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar: Conversations — hidden on mobile when thread is open */}
      <div className={`${mobileShowThread ? "hidden" : "flex"} md:flex w-full md:w-80 border-r flex-col`}>
        <div className="p-3 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No conversations yet</div>
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
      <div className={`${mobileShowThread ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
        {activeConversationId ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden mr-1"
                onClick={handleBack}
                aria-label="Back to conversations"
              >
                ←
              </Button>
              <Avatar
                src={activeConversation?.participants[0]?.avatar}
                name={activeConversation?.participants[0]?.fullName || "?"}
                className="h-8 w-8"
              />
              <div>
                <div className="font-medium text-sm">
                  {activeConversation?.type === "group"
                    ? activeConversation?.name || "Group Chat"
                    : activeConversation?.participants[0]?.fullName || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeConversation?.participants.length} participants
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="text-sm text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center mt-8">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={msg.senderId._id === currentUserId}
                  />
                ))
              )}
              {typingUsers[activeConversationId || ""]?.length > 0 && (
                <div className="px-4 py-2 text-sm text-gray-400 italic">
                  {typingUsers[activeConversationId!].map(t => t.userName).join(", ")} 
                  {typingUsers[activeConversationId!].length === 1 ? "is" : "are"} typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t">
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
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!inputText.trim() || sending}>
                  {sending ? "..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
