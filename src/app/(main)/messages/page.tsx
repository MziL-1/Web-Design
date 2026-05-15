"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Image as ImageIcon, Smile, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_CHATS, CURRENT_USER, Chat } from "@/lib/mockData";
import ImageWithFallback from "@/components/figma/ImageWithFallback";

function generateChatForUser(username: string): Chat {
  return {
    id: `dm-${username}`,
    user: {
      username,
      displayName: `@${username}`,
      avatar: "",
    },
    lastMessage: "开始新的对话",
    time: "现在",
    unread: 0,
    messages: [],
  };
}

export default function Messages() {
  const searchParams = useSearchParams();
  const targetUser = searchParams.get("to");

  const chats = useMemo(() => {
    if (!targetUser) return MOCK_CHATS;
    const existing = MOCK_CHATS.find((c) => c.user.username === targetUser);
    if (existing) return MOCK_CHATS;
    return [generateChatForUser(targetUser), ...MOCK_CHATS];
  }, [targetUser]);

  const initialChat = useMemo(() => {
    if (targetUser) return chats.find((c) => c.user.username === targetUser)?.id ?? null;
    return MOCK_CHATS[0]?.id ?? null;
  }, [chats, targetUser]);

  const [activeChatId, setActiveChatId] = useState<string | null>(initialChat);
  const [messageInput, setMessageInput] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-96px)] flex border-x border-zinc-200/50 bg-white -my-8">
      <div className="w-80 border-r border-zinc-200/50 flex flex-col h-full bg-zinc-50/30 shrink-0">
        <div className="p-5 border-b border-zinc-200/50">
          <h2 className="font-display text-2xl font-semibold text-zinc-900">消息与通知</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
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
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-zinc-900 truncate pr-2">
                    {chat.user.displayName}
                  </span>
                  <span className="text-xs text-zinc-400 shrink-0">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? "font-medium text-zinc-900" : "text-zinc-500"}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {activeChat ? (
          <>
            <div className="h-[72px] px-6 border-b border-zinc-200/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100">
                  <ImageWithFallback
                    src={activeChat.user.avatar}
                    alt={activeChat.user.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900">{activeChat.user.displayName}</h3>
                  <p className="text-xs text-zinc-500">@{activeChat.user.username}</p>
                </div>
              </div>
              <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {activeChat.messages.length > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                      今天
                    </span>
                  </div>

                  <AnimatePresence>
                    {activeChat.messages.map((msg) => {
                      const isMe = msg.senderId === CURRENT_USER.username;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              isMe
                                ? "bg-zinc-900 text-white rounded-br-sm"
                                : "bg-zinc-100 text-zinc-900 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <span className="text-xs text-zinc-400 mt-1">{msg.time}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-400">
                  <p className="text-sm">暂无消息记录，发送第一条消息吧</p>
                </div>
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
                  placeholder="输入消息..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-1 placeholder:text-zinc-400"
                />
                <button
                  disabled={!messageInput.trim()}
                  className="p-1.5 text-blue-600 disabled:text-zinc-300 transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-4">
              <Send className="w-6 h-6 text-zinc-400" />
            </div>
            <p>选择一条消息开始阅读</p>
          </div>
        )}
      </div>
    </div>
  );
}
