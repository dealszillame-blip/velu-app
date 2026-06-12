import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Zap, Scale, HardHat, CheckCircle } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: MapPin,
    title: "Browse vacant land",
    description:
      "Explore available lots across South West Sydney on an interactive map. Filter by suburb, price, and size.",
  },
  {
    step: "02",
    icon: Zap,
    title: "Builders respond instantly",
    description:
      "When a lot sells, registered builders in the area are notified within seconds and submit build packages.",
  },
  {
    step: "03",
    icon: Scale,
    title: "Compare side by side",
    description:
      "Review price, inclusions, and build timelines from multiple builders — all in one place.",
  },
  {
    step: "04",
    icon: HardHat,
    title: "Track every milestone",
    description:
      "Once you accept a proposal, every construction stage is tracked and visible to both you and your builder.",
  },
];

const BUYER_BENEFITS = [
  "See every available lot in South West Sydney",
  "Get multiple builder proposals on your land",
  "Compare pricing and inclusions side by side",
  "Track your build from slab to handover",
];

const BUILDER_BENEFITS = [
  "Get notified the moment a lot sells in your area",
  "Submit proposals directly to the buyer",
  "Win work without cold calling or agents",
  "Manage every project in one dashboard",
];

export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col bg-background">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <span className="text-lg font-semibold tracking-tight sm:text-xl">
            Velu
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "rounded-full"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/register/buyer"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-start justify-center px-4 py-20 sm:px-6 sm:py-28">
        <p className="label-caps mb-4">South West Sydney</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05]">
          Vacant land.
          <br />
          The right builder.
          <br />
          Instantly.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
          When land sells, builders know in seconds. Buyers compare proposals
          side by side. Every build stage, tracked in one place.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/register/buyer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 rounded-full px-8 text-base"
            )}
          >
            I&apos;m buying land
          </Link>
          <Link
            href="/register/builder"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full px-8 text-base"
            )}
          >
            I&apos;m a builder
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-16 grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl bg-black/[0.06] sm:max-w-lg">
          {[
            { value: "48 hrs", label: "Avg. to first proposal" },
            { value: "25 km", label: "Builder service radius" },
            { value: "100%", label: "Free for buyers" },
          ].map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-4 text-center">
              <p className="text-xl font-semibold tracking-tight sm:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-black/[0.06]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="label-caps mb-3">How it works</p>
          <h2 className="mb-10 text-2xl font-semibold tracking-tight sm:text-3xl">
            From land to keys — four steps
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="surface-subtle p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="label-caps text-muted-foreground/60">{step}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-4.5 w-4.5 text-foreground" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="font-medium tracking-tight">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role benefits */}
      <section className="border-t border-black/[0.06]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Buyers */}
            <div className="surface p-6 sm:p-8">
              <p className="label-caps mb-3 text-muted-foreground">For buyers</p>
              <h3 className="text-xl font-semibold tracking-tight">
                Your land, your build
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Find the perfect lot and get competing build proposals without
                spending hours calling builders.
              </p>
              <ul className="mt-5 space-y-2.5">
                {BUYER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/register/buyer"
                  className={cn(buttonVariants(), "rounded-full")}
                >
                  Start as a buyer
                </Link>
              </div>
            </div>

            {/* Builders */}
            <div className="surface-subtle p-6 sm:p-8">
              <p className="label-caps mb-3 text-muted-foreground">For builders</p>
              <h3 className="text-xl font-semibold tracking-tight">
                More leads, less legwork
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Get notified the moment a lot sells in your service area and
                submit a proposal before your competitors even hear about it.
              </p>
              <ul className="mt-5 space-y-2.5">
                {BUILDER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/register/builder"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                >
                  Join as a builder
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          Verified vacant-land marketplace for South West Sydney
        </div>
      </footer>
    </main>
  );
}
