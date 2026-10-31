import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuilderMessagesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="4 · Messages"
        title="Messages"
        description="Talk with a buyer about a lead, a proposal, or a build. Phone numbers stay off bldwise."
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
