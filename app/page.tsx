import type { Metadata } from "next";
import { BldwiseHome } from "@/components/landing/bldwise-home";

export const metadata: Metadata = {
  title: "BLD-Wise — Land to living",
  description:
    "Start with your land, price the site from facts, compare builders on one standard template, and track every milestone through handover.",
};

export default function HomePage() {
  return <BldwiseHome />;
}
