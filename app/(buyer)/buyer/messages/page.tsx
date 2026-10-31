import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { PageHeader } from "@/components/shared/PageHeader";
import { redirectUnlessBuyerStep } from "@/lib/buyer-steps";

export default async function BuyerMessagesPage() {
  await redirectUnlessBuyerStep("messages");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Messages"
        title="Messages"
        description="Invites and build questions land here. Phone numbers stay off bldwise."
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
