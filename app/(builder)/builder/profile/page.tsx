import { BuilderPaymentDetailsForm } from "@/components/builder/BuilderPaymentDetailsForm";
import { BuilderProfileEditor } from "@/components/builder/BuilderProfileEditor";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BuilderProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your brand"
        title="Builder profile"
        description="Create a LinkedIn-style profile with portfolio, reviews, and photos for buyers to discover you on Velu. Payment details you type here are shown on your projects. Velu does not verify them or move the money."
      />
      <BuilderPaymentDetailsForm />
      <BuilderProfileEditor />
    </div>
  );
}
