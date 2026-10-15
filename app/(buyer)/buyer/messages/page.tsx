import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuyerMessagesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Messages"
        title="Messages"
        description="Invites and build questions land here. Phone numbers stay off Velu."
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
