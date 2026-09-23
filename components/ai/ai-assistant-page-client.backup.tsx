"use client";

import { FormEvent, useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  user_id: string | null;
  created_at: string;
};

type AIResponse = {
  business?: {
    id: string;
    name: string;
    currency: string | null;
  };
  conversations?: Conversation[];
  error?: string;
};

type ConversationResponse = {
  conversation?: Conversation;
  messages?: Message[];
  error?: string;
};

export default function AIAssistantPageClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [businessName, setBusinessName] = useState("Your Business");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [error, setError] = useState("");

  async function loadConversations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai", {
        cache: "no-store",
      });

      const data: AIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations.");
      }

      setConversations(data.conversations ?? []);
      setBusinessName(data.business?.name || "Your Business");

      if (data.conversations?.length && !activeConversation) {
        await loadConversation(data.conversations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(conversationId: string) {
    setLoadingMessages(true);
    setError("");

    try {
      const response = await fetch(`/api/ai/${conversationId}`, {
        cache: "no-store",
      });

      const data: ConversationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversation.");
      }

      setActiveConversation(data.conversation ?? null);
      setMessages(data.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function createConversation() {
    setCreatingConversation(true);
    setError("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create conversation.");
      }

      const conversation = data.conversation as Conversation;

      setConversations((current) => [conversation, ...current]);
      setActiveConversation(conversation);
      setMessages([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create conversation."
      );
    } finally {
      setCreatingConversation(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageInput.trim();

    if (!content || !activeConversation || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/ai/${activeConversation.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setMessages((current) => [...current, data.message]);
      setMessageInput("");

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                updated_at: new Date().toISOString(),
              }
            : conversation
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            AI Business Assistant
          </div>

          <h1 className="mt-2 text-xl font-bold text-slate-950">
            {businessName}
          </h1>

          <button
            type="button"
            onClick={createConversation}
            disabled={creatingConversation}
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingConversation ? "Creating..." : "+ New Conversation"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm leading-6 text-slate-500">
              No conversations yet. Start a new conversation to begin.
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => loadConversation(conversation.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-white shadow-sm ring-1 ring-slate-200"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {conversation.title}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(conversation.updated_at).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="text-sm font-semibold text-slate-950">
            {activeConversation?.title || "AI Assistant"}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Business intelligence and assistance
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading conversation...
            </div>
          ) : !activeConversation ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-lg text-center">
                <div className="text-4xl">✦</div>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">
                  AI Business Assistant
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Create a conversation to begin. The conversation and message
                  foundation is ready for the AI provider integration.
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-lg text-center">
                <div className="text-4xl">✦</div>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">
                  How can I help your business?
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ask about customers, products, inventory, sales, orders,
                  invoices, expenses, or cashflow.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                Your message has been saved. AI provider integration will be
                connected in the next Stage 6 step.
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={sendMessage}
          className="border-t border-slate-200 bg-white p-4"
        >
          <div className="mx-auto flex max-w-3xl gap-3">
            <input
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              disabled={!activeConversation || sending}
              placeholder={
                activeConversation
                  ? "Ask your business assistant..."
                  : "Create a conversation first..."
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
            />

            <button
              type="submit"
              disabled={!activeConversation || !messageInput.trim() || sending}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
