import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuilderMessagesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Private chat"
        title="Messages"
        description="Reach out to buyers about their block before submitting a formal proposal — contact details stay on Velu."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        }
      >
        <MessagesInbox role="builder" basePath="/builder/messages" />
      </Suspense>
    </div>
  );
}
