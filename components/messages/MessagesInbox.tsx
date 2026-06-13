"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { InquiryMessage, InquiryThread } from "@/lib/messaging";
import { MESSAGING_DISCLAIMER } from "@/lib/messaging";
import { cn } from "@/lib/utils";

type ThreadDetail = {
  id: string;
  counterpart_name: string;
  counterpart_role: string;
  listing_address: string | null;
  listing_suburb: string | null;
  listing_postcode: string | null;
};

type MessagesInboxProps = {
  role: "buyer" | "builder";
  basePath: string;
};

export function MessagesInbox({ role, basePath }: MessagesInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const composeListingId = searchParams.get("listingId");
  const composeCounterpartyId = searchParams.get("counterpartyId");
  const selectedId = searchParams.get("thread");

  const [threads, setThreads] = useState<InquiryThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [composeDraft, setComposeDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/inquiries");
    const data = await res.json().catch(() => []);
    setThreads(Array.isArray(data) ? data : []);
    setLoadingThreads(false);
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    setError(null);
    const res = await fetch(`/api/inquiries/${threadId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to load conversation.");
      setLoadingThread(false);
      return;
    }
    setActiveThread(data.thread);
    setMessages(data.messages ?? []);
    setLoadingThread(false);
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 15000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
    } else {
      setActiveThread(null);
      setMessages([]);
    }
  }, [selectedId, loadThread]);

  async function sendToThread(threadId: string, message: string) {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/inquiries/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to send message.");
      setSending(false);
      return;
    }
    setDraft("");
    await loadThread(threadId);
    setSending(false);
  }

  async function startConversation() {
    if (!composeListingId || !composeCounterpartyId) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        land_listing_id: composeListingId,
        counterparty_id: composeCounterpartyId,
        message: composeDraft,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to start conversation.");
      setSending(false);
      return;
    }
    setComposeDraft("");
    router.replace(`${basePath}?thread=${data.id}`);
    setSending(false);
  }

  const showCompose =
    Boolean(composeListingId && composeCounterpartyId) && !selectedId;
  const showThread = Boolean(selectedId && activeThread);

  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => loadThread(selectedId), 10000);
    return () => clearInterval(interval);
  }, [selectedId, loadThread]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <Card
        className={cn(
          (showThread || showCompose) && "hidden lg:block"
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Conversations</CardTitle>
          <CardDescription>{MESSAGING_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-0 pb-4">
          {loadingThreads ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              No conversations yet. Use{" "}
              {role === "buyer"
                ? "Message builder on a proposal"
                : "Contact buyer on a lead"}{" "}
              to start chatting on Velu.
            </p>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                href={`${basePath}?thread=${thread.id}`}
                className={cn(
                  "block border-b border-black/[0.04] px-6 py-4 transition-colors hover:bg-muted/40",
                  selectedId === thread.id && "bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {thread.counterpart_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread.listing_suburb ?? "Land listing"}
                      {thread.listing_address
                        ? ` · ${thread.listing_address}`
                        : ""}
                    </p>
                    {thread.last_message_preview && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {thread.last_message_preview}
                      </p>
                    )}
                  </div>
                  {thread.unread_count > 0 && (
                    <Badge className="shrink-0 rounded-full">
                      {thread.unread_count}
                    </Badge>
                  )}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div
        className={cn(!showThread && !showCompose && "hidden lg:block")}
      >
        {showCompose ? (
          <Card>
            <CardHeader>
              <CardTitle>New conversation</CardTitle>
              <CardDescription>
                Introduce your build requirements or ask questions before
                submitting a formal proposal. Contact details stay private.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compose-message">Your message</Label>
                <textarea
                  id="compose-message"
                  required
                  minLength={10}
                  rows={6}
                  placeholder={
                    role === "buyer"
                      ? "Hi — I'm planning a build on my block and would like to understand your packages, inclusions, and typical timelines…"
                      : "Hi — I work in your area and would like to learn more about your block and build plans before sending a formal proposal…"
                  }
                  value={composeDraft}
                  onChange={(e) => setComposeDraft(e.target.value)}
                  className="flex min-h-[140px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={sending || composeDraft.trim().length < 10}
                  onClick={startConversation}
                  className="gap-2 rounded-full"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : "Send message"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => router.replace(basePath)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : showThread && activeThread ? (
          <Card className="flex min-h-[480px] flex-col">
            <CardHeader className="border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2 lg:hidden">
                <Link
                  href={basePath}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>
              <CardTitle className="text-lg">
                {activeThread.counterpart_name}
              </CardTitle>
              <CardDescription>
                {activeThread.listing_suburb}
                {activeThread.listing_address
                  ? ` · ${activeThread.listing_address}`
                  : ""}
                {activeThread.listing_postcode
                  ? ` ${activeThread.listing_postcode}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 p-0">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {loadingThread ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.is_mine
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p
                        className={cn(
                          "mt-2 text-[11px]",
                          message.is_mine
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(message.created_at).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <form
                className="border-t border-black/[0.06] p-4 sm:p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedId && draft.trim()) {
                    sendToThread(selectedId, draft.trim());
                  }
                }}
              >
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Type your message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[72px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="self-end rounded-full px-4"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden min-h-[480px] items-center justify-center lg:flex">
            <CardContent className="py-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Select a conversation</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Discuss requirements privately before committing to a proposal.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
