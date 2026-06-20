"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StartInquiryButtonProps = {
  landListingId: string;
  counterpartyId: string;
  messagesPath: string;
  label?: string;
  variant?: "default" | "outline";
  className?: string;
  prefill?: string;
};

export function StartInquiryButton({
  landListingId,
  counterpartyId,
  messagesPath,
  label = "Message",
  variant = "outline",
  className,
  prefill,
}: StartInquiryButtonProps) {
  const params = new URLSearchParams({
    listingId: landListingId,
    counterpartyId,
  });
  if (prefill) {
    params.set("prefill", prefill);
  }
  const href = `${messagesPath}?${params.toString()}`;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant, size: "sm" }),
        "rounded-full gap-2",
        className
      )}
    >
      <MessageSquare className="h-4 w-4" />
      {label}
    </Link>
  );
}
