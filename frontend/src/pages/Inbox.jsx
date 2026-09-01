// src/pages/Inbox.jsx
// Messenger inbox — conversations on the left, selected thread on the right.
// Customers message the seller's Facebook page; those messages arrive here
// via the backend webhook. The seller can read and reply without leaving
// CommerceFlow.

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  User,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/components/shared/Toast";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [active, setActive] = useState(null); // the open conversation (with messages)
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Jump to the New Order form, pre-filling the customer's name and
  // marking the source as Messenger. The seller adds the phone/products.
  const createOrderFromChat = () => {
    if (!active) return;
    navigate("/orders/new", {
      state: {
        prefill: {
          name: active.customer_name || "",
          source_channel: "messenger",
          conversation_id: active.id,
        },
      },
    });
  };

  // Load the conversation list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Light polling so new messages appear without a manual refresh.
    // Every 15s is enough for an inbox without hammering the server.
    const timer = setInterval(fetchConversations, 15000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // Scroll to the newest message whenever the open thread changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length]);

  // Open a conversation and load its full message history
  const openConversation = async (conversation) => {
    setLoadingThread(true);
    try {
      const res = await api.get(`/conversations/${conversation.id}`);
      setActive(res.data);
      // Mark it read in the local list too
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, is_read: true } : c,
        ),
      );
    } catch (err) {
      showToast("Could not open this conversation.", "error");
    } finally {
      setLoadingThread(false);
    }
  };

  // Send a reply to the customer
  const handleSend = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    const text = reply;
    setReply("");
    try {
      const res = await api.post(`/conversations/${active.id}/reply`, {
        text,
      });
      // Append our reply to the open thread instantly
      setActive((prev) => ({
        ...prev,
        messages: [...prev.messages, res.data.chat_message],
      }));
      fetchConversations(); // refresh list previews
    } catch (err) {
      const message = err.response?.data?.message || "";
      showToast(
        message || "Could not send the message. Please try again.",
        "error",
        { title: "Send failed" },
      );
      setReply(text); // restore the text so it isn't lost
    } finally {
      setSending(false);
    }
  };

  const displayName = (c) =>
    c?.customer_name || `Customer ${String(c?.psid || "").slice(-4)}`;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1">
          Inbox
        </h1>
        <p className="text-muted-foreground text-sm mb-4">
          Messages from your Facebook page
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border
                   rounded-xl overflow-hidden h-full bg-card"
      >
        {/* ── CONVERSATION LIST ──────────────────────────────────────────── */}
        <div
          className={`border-r border-border overflow-y-auto
            ${active ? "hidden md:block" : "block"}`}
        >
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When a customer messages your Facebook page, their chat will
                appear here.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c)}
                className={`w-full text-left px-4 py-3 border-b border-border
                  hover:bg-muted/50 transition-colors flex items-start gap-3
                  ${active?.id === c.id ? "bg-muted/60" : ""}`}
              >
                <div
                  className="w-9 h-9 rounded-full bg-primary/10 flex
                             items-center justify-center flex-shrink-0"
                >
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {displayName(c)}
                    </p>
                    {!c.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.last_message || "No messages"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* ── THREAD VIEW ────────────────────────────────────────────────── */}
        <div
          className={`md:col-span-2 flex flex-col
            ${active ? "flex" : "hidden md:flex"}`}
        >
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <div>
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to read and reply
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                  onClick={() => setActive(null)}
                  className="md:hidden text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div
                  className="w-8 h-8 rounded-full bg-primary/10 flex
                             items-center justify-center"
                >
                  <User className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium">{displayName(active)}</p>
                <Button
                  onClick={createOrderFromChat}
                  size="sm"
                  variant="outline"
                  className="ml-auto gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Create Order
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  active.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.direction === "seller"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm
                          ${
                            m.direction === "seller"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a reply..."
                  className="flex-1 text-sm border border-border rounded-full
                             px-4 py-2 bg-background text-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  size="icon"
                  className="rounded-full flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
