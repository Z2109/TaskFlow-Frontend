
"use client";

import { useEffect, useRef, useState } from "react";
import API from "@/services/api";
import { toast } from "react-toastify";

import {
  Sparkles,
  Send,
  Plus,
  Bot,
  User,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const suggestions = [
  "How can I improve my project productivity?",
  "Help me create a task description",
  "How should I prioritize my tasks?",
  "Give me tips for managing my team",
];

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send message to TaskFlow AI
  const sendMessage = async (customMessage) => {
    const text = (customMessage || message).trim();

    if (!text || loading) return;

    const chatId = activeChatId || Date.now();

    const userMessage = {
      role: "user",
      content: text,
    };

    setActiveChatId(chatId);
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const { data } = await API.post("/ai/chat", {
        message: text,
      });

      if (!data.success) {
        throw new Error(
          data.message || "AI request failed"
        );
      }

      const aiMessage = {
        role: "assistant",
        content: data.reply || "I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, aiMessage]);

      setRecentChats((prev) => {
        const existing = prev.find(
          (chat) => chat.id === chatId
        );

        if (existing) return prev;

        return [
          {
            id: chatId,
            title: text.slice(0, 35),
            messages: [
              userMessage,
              aiMessage,
            ],
          },
          ...prev,
        ];
      });

    } catch (error) {
      console.error("TaskFlow AI Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to connect with TaskFlow AI";

      toast.error(errorMessage);

      // Keep the failed user message visible.
      // The user can retry by sending another message.
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  // Start a new conversation
  const startNewChat = () => {
    setMessages([]);
    setMessage("");
    setActiveChatId(null);
    textareaRef.current?.focus();
  };

  // Open an existing conversation from this page session
  const openChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
  };

  // Submit message
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Handle suggested prompts
  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8F9FD] p-4 md:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Sparkles size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              AI Assistant
            </h1>

            <p className="text-sm text-slate-500">
              Your intelligent project management companion
            </p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* CHAT LAYOUT */}
      <div className="grid min-h-[650px] grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">

        {/* RECENT CHATS */}
        {sidebarOpen && (
          <aside className="rounded-2xl border border-slate-200 bg-white p-4">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">
                Recent Chats
              </h2>

              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 transition hover:text-indigo-600"
                aria-label="Close recent chats"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare
                  size={28}
                  className="mx-auto mb-2 text-slate-300"
                />

                <p className="text-xs text-slate-400">
                  No conversations yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition ${
                      activeChatId === chat.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <MessageSquare
                      size={15}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {chat.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* MAIN CHAT */}
        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CHAT HEADER */}
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">

            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-500 transition hover:text-indigo-600"
                aria-label="Open recent chats"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Bot size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                TaskFlow AI
              </h2>

              <p className="text-xs text-emerald-600">
                ● Online · Powered by Groq
              </p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">

            {messages.length === 0 && (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-200">
                  <Sparkles size={36} />
                </div>

                <h2 className="text-2xl font-bold text-slate-800">
                  How can I help you today?
                </h2>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ask me anything about project management,
                  tasks, productivity and team collaboration.
                </p>

                <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleSuggestion(item)}
                      disabled={loading}
                      className="rounded-xl border border-slate-200 p-4 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                    >
                      <Sparkles
                        size={16}
                        className="mb-2 text-indigo-500"
                      />

                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Bot size={19} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                    <User size={19} />
                  </div>
                )}
              </div>
            ))}

            {/* LOADING */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Bot size={19} />
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  TaskFlow AI is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* MESSAGE INPUT */}
          <div className="border-t border-slate-100 p-4">

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3"
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about projects, tasks or your team..."
                rows={2}
                disabled={loading}
                className="max-h-36 min-h-12 flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />

              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={17} />
                )}

                <span className="hidden sm:inline">
                  Send
                </span>
              </button>
            </form>

            <p className="mt-2 text-center text-xs text-slate-400">
              TaskFlow AI can make mistakes. Verify important information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
