import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMessagesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Private chat"
        title="Messages"
        description="Discuss your block and build requirements with builders — without sharing phone or email."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        }
      >
        <MessagesInbox role="buyer" basePath="/buyer/messages" />
      </Suspense>
    </div>
  );
}
