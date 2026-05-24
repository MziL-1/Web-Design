"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Image as ImageIcon, Smile, MoreVertical, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ImageWithFallback from "@/components/figma/ImageWithFallback";

interface ChatUser {
  username: string;
  displayName: string;
  avatar: string;
}

interface Chat {
  id: string;
  user: ChatUser;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { username: string; profile: { displayName: string; avatarUrl: string | null } | null };
}

interface RemoteUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatar: string;
}

export default function Messages() {
  const searchParams = useSearchParams();
  const targetUser = searchParams.get("to");

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [remoteUser, setRemoteUser] = useState<RemoteUser | null>(null);
  const [sending, setSending] = useState(false);
  const [myAvatar, setMyAvatar] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialFetchDone = useRef(false);

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (force = false) => {
    if (!force && !isNearBottom()) return;
    setTimeout(() => {
      const el = messagesContainerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.status === 401) return;
    const data = await res.json();
    if (Array.isArray(data)) setChats(data);
    return data;
  }, []);

  const fetchMessages = useCallback(async (userId: string, showLoading = false) => {
    if (showLoading) setMessagesLoading(true);
    const res = await fetch(`/api/messages?with=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    }
    if (showLoading) setMessagesLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations().then(() => setLoading(false));
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.avatarUrl) setMyAvatar(data.avatarUrl);
      })
      .catch(() => {});
  }, [fetchConversations]);

  // Handle ?to=username param
  useEffect(() => {
    if (!targetUser || loading) return;
    const existing = chats.find((c) => c.user.username === targetUser);
    if (existing) {
      setActiveChatId(existing.id);
      return;
    }
    fetch(`/api/public/profile/${encodeURIComponent(targetUser)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.username) {
          const newChat: Chat = {
            id: data.userId || data.username,
            user: {
              username: data.username,
              displayName: data.displayName || data.username,
              avatar: data.avatarUrl || "",
            },
            lastMessage: "",
            time: "",
            unread: 0,
          };
          setChats((prev) => {
            const exists = prev.find((c) => c.user.username === data.username);
            return exists ? prev : [newChat, ...prev];
          });
          setActiveChatId(data.userId || data.username);
          setRemoteUser({
            id: data.userId || data.username,
            username: data.username,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
            avatar: data.avatarUrl || "",
          });
        }
      })
      .catch(() => {});
  }, [targetUser, loading, chats]);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeUser = activeChat?.user || remoteUser;
  const otherUsername = activeUser?.username || "";

  // Poll for new messages in active conversation
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeChatId) return;

    initialFetchDone.current = false;
    fetchMessages(activeChatId, true).then(() => {
      initialFetchDone.current = true;
      scrollToBottom(true);
    });

    pollRef.current = setInterval(() => {
      fetchMessages(activeChatId, false);
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChatId, fetchMessages]);

  // Scroll to bottom when new messages arrive (only after initial fetch)
  useEffect(() => {
    if (initialFetchDone.current && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages.length]);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const handleBack = () => {
    setActiveChatId(null);
    setMessages([]);
    fetchConversations();
  };

  const handleSend = async () => {
    const text = messageInput.trim();
    if (!text || !activeChatId || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeChatId, content: text }),
    });
    if (res.ok) {
      setMessageInput("");
      await fetchMessages(activeChatId, false);
      fetchConversations();
    }
    setSending(false);
  };

  const chatListContent = (
    <>
      <div className="p-5 border-b border-zinc-200/50">
        <h2 className="font-display text-2xl font-semibold text-zinc-900">消息与通知</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-zinc-400 text-center">加载中...</div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">暂无消息</div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`w-full flex items-center gap-4 p-4 text-left transition-colors border-b border-zinc-100/50 ${
                activeChatId === chat.id
                  ? "bg-white border-l-4 border-l-zinc-900"
                  : "hover:bg-zinc-50 border-l-4 border-l-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100">
                  <ImageWithFallback
                    src={chat.user.avatar}
                    alt={chat.user.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {chat.unread > 9 ? "9+" : chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-zinc-900 truncate pr-2">
                    {chat.user.displayName}
                  </span>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {chat.time ? new Date(chat.time).toLocaleDateString("zh-CN") : ""}
                  </span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? "font-medium text-zinc-900" : "text-zinc-500"}`}>
                  {chat.lastMessage || "暂无消息"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );

  const displayUser = activeUser || { username: activeChatId || "", displayName: activeChatId || "", avatar: "" };

  const conversationContent = activeChatId && (
    <>
      <div className="h-[72px] px-6 border-b border-zinc-200/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="md:hidden p-1 -ml-1 text-zinc-500 hover:text-zinc-900 transition-colors"
            aria-label="返回聊天列表"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100">
            <ImageWithFallback
              src={displayUser.avatar}
              alt={displayUser.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900">{displayUser.displayName}</h3>
            <p className="text-xs text-zinc-500">@{displayUser.username}</p>
          </div>
        </div>
        <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            <p className="text-sm">加载中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            <p className="text-sm">暂无消息记录，发送第一条消息吧</p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const sentByMe = msg.sender?.username !== otherUsername;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${sentByMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                      {sentByMe ? (
                        myAvatar ? (
                          <img src={myAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
                            我
                          </span>
                        )
                      ) : (
                        displayUser.avatar ? (
                          <img src={displayUser.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
                            {displayUser.username?.[0]?.toUpperCase()}
                          </span>
                        )
                      )}
                    </div>

                    {/* Bubble + time */}
                    <div className={`flex flex-col ${sentByMe ? "items-end" : "items-start"} max-w-[70%]`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          sentByMe
                            ? "bg-zinc-900 text-white rounded-br-md"
                            : "bg-zinc-100 text-zinc-900 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 bg-white border-t border-zinc-200/50">
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <button className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="输入消息..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-1 placeholder:text-zinc-400"
          />
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            className="p-1.5 text-blue-600 disabled:text-zinc-300 transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );

  const noSelectionPlaceholder = (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-500 bg-zinc-50/50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-4">
        <Send className="w-6 h-6 text-zinc-400" />
      </div>
      <p>选择一条消息开始阅读</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-96px)] flex border-x border-zinc-200/50 bg-white -my-8">
      <div
        className={`flex flex-col h-full bg-zinc-50/30 shrink-0 border-r border-zinc-200/50
          ${activeChatId ? "hidden md:flex md:w-80" : "w-full md:w-80"}
        `}
      >
        {chatListContent}
      </div>

      <div
        className={`flex-col h-full min-w-0 bg-white
          ${activeChatId ? "flex flex-1" : "hidden md:flex md:flex-1"}
        `}
      >
        {activeChatId ? conversationContent : noSelectionPlaceholder}
      </div>
    </div>
  );
}
