"use client";

import { StartInquiryButton } from "@/components/messages/StartInquiryButton";
import { MESSAGING_DISCLAIMER } from "@/lib/messaging";

type ContactBuyerPanelProps = {
  listingId: string;
  buyerId: string | null;
};

export function ContactBuyerPanel({ listingId, buyerId }: ContactBuyerPanelProps) {
  if (!buyerId) {
    return (
      <p className="text-sm text-muted-foreground">
        Buyer contact will be available once this listing is linked to a buyer
        account.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{MESSAGING_DISCLAIMER}</p>
      <StartInquiryButton
        landListingId={listingId}
        counterpartyId={buyerId}
        messagesPath="/builder/messages"
        label="Contact buyer"
        variant="default"
      />
    </div>
  );
}
