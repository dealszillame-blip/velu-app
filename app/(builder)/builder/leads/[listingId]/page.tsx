import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBuyerPanel } from "@/components/messages/ContactBuyerPanel";
import { LeadBuyerRequirements } from "@/components/builder/LeadBuyerRequirements";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import { LandThumbnail } from "@/components/shared/LandThumbnail";
import { requireRole } from "@/lib/auth";
import { listingPriceLabel } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function BuilderLeadDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const { user } = await requireRole(["builder"]);
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("land_listings")
    .select(
      "id, address, suburb, postcode, price, price_display, land_size_sqm, frontage_meters, zoning, status, sold_at, buyer_id"
    )
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "sold") {
    notFound();
  }

  const { data: existingProposal } = await supabase
    .from("builder_proposals")
    .select("id, package_name, status")
    .eq("land_listing_id", listingId)
    .eq("builder_id", user.id)
    .maybeSingle();

  const soldDate = listing.sold_at
    ? new Date(listing.sold_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Recently sold";

  return (
    <div className="space-y-6">
      <Link
        href="/builder/leads"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1.5 rounded-full -ml-2"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      {/* Listing hero card */}
      <div className="surface overflow-hidden">
        <LandThumbnail size="md" className="rounded-none aspect-[21/9] sm:aspect-[21/7]" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing.suburb}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">{listing.address}, {listing.postcode}</p>
            </div>
            <Badge className="shrink-0 rounded-full bg-foreground text-background">
              Sold
            </Badge>
          </div>

          {/* Price strip */}
          <div className="mt-5 flex items-baseline gap-2 border-b border-black/[0.06] pb-5">
            <span className="label-caps">Sale price</span>
            <span className="text-3xl font-semibold tracking-tight">
              {listingPriceLabel(listing)}
            </span>
          </div>

          {/* Lot stats */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="label-caps mb-1">Land size</p>
              <p className="text-lg font-semibold">{listing.land_size_sqm}</p>
              <p className="text-xs text-muted-foreground">m²</p>
            </div>
            <div>
              <p className="label-caps mb-1">Frontage</p>
              <p className="text-lg font-semibold">{listing.frontage_meters}</p>
              <p className="text-xs text-muted-foreground">metres</p>
            </div>
            <div>
              <p className="label-caps mb-1">Zoning</p>
              <p className="text-lg font-semibold">{listing.zoning}</p>
              <p className="text-xs text-muted-foreground">residential</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sold {soldDate}
          </div>
        </div>
      </div>

      {/* Buyer requirements */}
      {listing.buyer_id ? (
        <LeadBuyerRequirements buyerId={listing.buyer_id} />
      ) : null}

      {/* Contact buyer before proposal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discuss requirements first</CardTitle>
          <CardDescription>
            Ask about the block, design preferences, or timeline before submitting
            your formal proposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactBuyerPanel listingId={listingId} buyerId={listing.buyer_id} />
        </CardContent>
      </Card>

      {/* Proposal card */}
      <div className="surface-subtle overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              {existingProposal ? (
                <CheckCircle className="h-4.5 w-4.5 text-foreground" strokeWidth={1.5} />
              ) : (
                <FileText className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <p className="font-medium tracking-tight">
                {existingProposal ? "Proposal submitted" : "Submit a proposal"}
              </p>
              <p className="text-sm text-muted-foreground">
                {existingProposal
                  ? `Your "${existingProposal.package_name}" proposal is ${existingProposal.status}.`
                  : "Send your build package directly to the buyer."}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          {existingProposal ? (
            <div className="space-y-4">
              <div className="surface-subtle flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{existingProposal.package_name}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    Status: {existingProposal.status}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full capitalize">
                  {existingProposal.status}
                </Badge>
              </div>
              <Link
                href="/builder/proposals"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
              >
                View all my proposals
              </Link>
            </div>
          ) : (
            <ProposalForm listingId={listingId} />
          )}
        </div>
      </div>
    </div>
  );
}
