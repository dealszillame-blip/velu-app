import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Velu — You bring the land. We connect you.",
  description:
    "The verified marketplace connecting vacant land buyers with licensed builders in South West Sydney — the moment a block sells.",
};

export default function HomePage() {
  return <LandingPage />;
}
