"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OtherProfile = {
  userId: string;
  displayName: string;
  username: string;
  profilePhoto: string | null;
};

type Conversation = {
  id: string;
  participantOne: string;
  participantTwo: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  otherProfile: OtherProfile | null;
  unreadCount: number;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
};

type Props = {
  conversations: Conversation[];
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto: string | null;
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  messages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });

  return groups;
}

function Avatar({
  photo, name, size = "md",
}: {
  photo: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden flex-shrink-0`}>
      {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

export default function InboxClient({
  conversations: initial,
  currentUserId,
  currentUserName,
  currentUserPhoto,
}: Props) {
  const [conversations, setConversations] = useState(initial);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatUsername, setNewChatUsername] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [searchUserError, setSearchUserError] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter((conv) =>
    conv.otherProfile?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherProfile?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load messages when conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?conversationId=${activeConversation!.id}`);
        const data = await res.json() as { messages: Message[] };
        setMessages(data.messages ?? []);
      } catch {
        console.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    }

    void loadMessages();
  }, [activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  async function handleSend() {
    if (!newMessage.trim() || !activeConversation || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeConversation.otherProfile?.userId,
          content,
        }),
      });

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation.id
            ? { ...conv, lastMessage: content, lastMessageAt: new Date() }
            : conv
        )
      );
    } catch {
      console.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  async function handleNewChat() {
    if (!newChatUsername.trim()) return;
    setIsSearchingUser(true);
    setSearchUserError("");

    try {
      const res = await fetch(
        `/api/profile/check-username?username=${encodeURIComponent(newChatUsername.trim())}`
      );
      const data = await res.json() as { available: boolean };

      if (data.available) {
        setSearchUserError("No user found with that username.");
        return;
      }

      const profileRes = await fetch(`/api/profile/by-username?username=${encodeURIComponent(newChatUsername.trim())}`);
      const profileData = await profileRes.json() as { profile?: OtherProfile };

      if (!profileData.profile) {
        setSearchUserError("User not found.");
        return;
      }

      if (profileData.profile.userId === currentUserId) {
        setSearchUserError("You cannot message yourself.");
        return;
      }

      const existingConv = conversations.find(
        (c) => c.otherProfile?.userId === profileData.profile!.userId
      );

      if (existingConv) {
        setActiveConversation(existingConv);
        setShowNewChat(false);
        setNewChatUsername("");
        return;
      }

      const tempConv: Conversation = {
        id: `temp-${profileData.profile.userId}`,
        participantOne: currentUserId,
        participantTwo: profileData.profile.userId,
        lastMessage: null,
        lastMessageAt: null,
        otherProfile: profileData.profile,
        unreadCount: 0,
      };

      setConversations((prev) => [tempConv, ...prev]);
      setActiveConversation(tempConv);
      setShowNewChat(false);
      setNewChatUsername("");
    } catch {
      setSearchUserError("Something went wrong. Try again.");
    } finally {
      setIsSearchingUser(false);
    }
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-gray-200 overflow-hidden bg-white">

      {/* Left Panel — Conversations */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Inbox</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition text-lg"
            >
              +
            </button>
          </div>

          {/* New Chat */}
          {showNewChat && (
            <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="text-xs font-medium text-indigo-700 mb-2">
                Start a new conversation
              </div>
              <div className="flex gap-2">
                <input
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleNewChat()}
                  placeholder="@username"
                  className="flex-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => void handleNewChat()}
                  disabled={isSearchingUser}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                >
                  {isSearchingUser ? "..." : "Go"}
                </button>
              </div>
              {searchUserError && (
                <p className="text-xs text-rose-600 mt-1">{searchUserError}</p>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-8 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-xs text-gray-400">
                No conversations yet. Start one by clicking +
              </div>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50",
                  activeConversation?.id === conv.id ? "bg-indigo-50" : "",
                ].join(" ")}
              >
                <Avatar
                  photo={conv.otherProfile?.profilePhoto ?? null}
                  name={conv.otherProfile?.displayName ?? "?"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {conv.otherProfile?.displayName ?? "Unknown"}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-400 truncate">
                      {conv.lastMessage ?? "No messages yet"}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-medium">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Chat Window */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Avatar
              photo={activeConversation.otherProfile?.profilePhoto ?? null}
              name={activeConversation.otherProfile?.displayName ?? "?"}
              size="md"
            />
            <div>
              <div className="text-sm font-bold text-gray-900">
                {activeConversation.otherProfile?.displayName}
              </div>
              <div className="text-xs text-gray-400">
                @{activeConversation.otherProfile?.username}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-gray-400">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-4xl mb-3">👋</div>
                <div className="text-sm font-medium text-gray-500">
                  Say hello to {activeConversation.otherProfile?.displayName}!
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium">{date}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-3">
                      {msgs.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {!isMe && (
                              <Avatar
                                photo={activeConversation.otherProfile?.profilePhoto ?? null}
                                name={activeConversation.otherProfile?.displayName ?? "?"}
                                size="sm"
                              />
                            )}
                            {isMe && (
                              <Avatar
                                photo={currentUserPhoto}
                                name={currentUserName}
                                size="sm"
                              />
                            )}
                            <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={[
                                "px-4 py-2.5 rounded-2xl text-sm",
                                isMe
                                  ? "bg-indigo-600 text-white rounded-br-sm"
                                  : "bg-gray-100 text-gray-900 rounded-bl-sm",
                              ].join(" ")}>
                                {msg.content}
                              </div>
                              <span className="text-xs text-gray-400 mt-1 px-1">
                                {timeAgo(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={`Message ${activeConversation.otherProfile?.displayName ?? ""}...`}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
              <button
                onClick={() => void handleSend()}
                disabled={isSending || !newMessage.trim()}
                className={[
                  "h-11 w-11 rounded-xl flex items-center justify-center text-white transition",
                  newMessage.trim()
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-200 cursor-not-allowed",
                ].join(" ")}
              >
                ➤
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">💬</div>
          <div className="text-base font-semibold text-gray-700">Your Inbox</div>
          <div className="text-sm text-gray-400 mt-1">
            Select a conversation or start a new one
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Start a conversation
          </button>
        </div>
      )}
    </div>
  );
}