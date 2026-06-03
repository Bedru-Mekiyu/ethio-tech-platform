import { useState, useCallback, useEffect, useRef } from "react";
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage as sendDM,
  markRead,
} from "@/services/dmService";
import type { Conversation, DMMessage } from "@/services/dmService";

export type { Conversation, DMMessage } from "@/services/dmService";

interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  at: string;
}

interface ReadReceipt {
  conversationId: string;
  userId: string;
  readAt: string;
  messageIds: string[];
}

interface UseDMOptions {
  socket: {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

export const useDM = ({ socket }: UseDMOptions) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; userName: string; at: string }[]>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const result = await fetchConversations();
      setConversations(result.conversations);
    } catch {
      // silently fail
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      await markRead(conversationId);
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    const handleNewDM = (payload: unknown) => {
      const msg = payload as DMMessage;
      if (msg.conversationId === activeConversationId) {
        setMessages(prev => [...prev, msg]);
        markRead(activeConversationId);
      }
      setConversations(prev =>
        prev.map(c =>
          c._id === msg.conversationId
            ? { ...c, lastMessageAt: msg.createdAt, lastMessagePreview: msg.text }
            : c
        )
      );
    };

    const cleanup = socket.on("dm:new", handleNewDM);
    return () => { cleanup(); };
  }, [socket, activeConversationId]);

  // Emit typing start
  const emitTypingStart = useCallback(() => {
    if (!activeConversationId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 2000) return; // throttle to 2s
    lastTypingEmitRef.current = now;
    socket.emit("dm:typing-start", { conversationId: activeConversationId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("dm:typing-stop", { conversationId: activeConversationId });
    }, 3000);
  }, [socket, activeConversationId]);

  // Emit typing stop on unmount/conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Listen for typing events
  useEffect(() => {
    const handleTyping = (payload: unknown) => {
      const p = payload as TypingIndicator;
      setTypingUsers(prev => {
        const conv = prev[p.conversationId] || [];
        if (!p.at) {
          // Typing stopped
          return { ...prev, [p.conversationId]: conv.filter(t => t.userId !== p.userId) };
        }
        // Typing started - add or update
        const filtered = conv.filter(t => t.userId !== p.userId);
        return { ...prev, [p.conversationId]: [...filtered, { userId: p.userId, userName: p.userName, at: p.at }] };
      });
    };

    const cleanup = socket.on("dm:typing", handleTyping);
    return () => { cleanup(); };
  }, [socket]);

  // Listen for read receipts
  useEffect(() => {
    const handleReadReceipt = (payload: unknown) => {
      const p = payload as ReadReceipt;
      setMessages(prev => prev.map(msg => {
        if (!p.messageIds.includes(msg._id)) return msg;
        const alreadyRead = msg.readBy.some(r => r.userId === p.userId);
        if (alreadyRead) return msg;
        return { ...msg, readBy: [...msg.readBy, { userId: p.userId, readAt: p.readAt }] };
      }));
    };

    const cleanup = socket.on("dm:read-receipt", handleReadReceipt);
    return () => { cleanup(); };
  }, [socket]);

  // Emit read receipt when viewing conversation
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      socket.emit("dm:read", { conversationId: activeConversationId });
    }
  }, [activeConversationId, messages.length, socket]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeConversationId || !text.trim()) return;
      setSending(true);
      try {
        const msg = await sendDM(activeConversationId, text);
        setMessages(prev => [...prev, msg]);
        return msg;
      } finally {
        setSending(false);
      }
    },
    [activeConversationId]
  );

  const startConversation = useCallback(
    async (participantId: string) => {
      const conv = await createConversation(participantId);
      setConversations(prev => {
        if (prev.some(c => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });
      setActiveConversationId(conv._id);
      return conv;
    },
    []
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    messagesEndRef,
    sendMessage,
    startConversation,
    selectConversation,
    refresh: loadConversations,
    typingUsers,
    emitTypingStart,
  };
};